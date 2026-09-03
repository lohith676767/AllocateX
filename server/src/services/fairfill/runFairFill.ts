import { prisma } from '../../db/client.js';
import { ApiError } from '../../utils/errors.js';
import { TOTAL_CSR_POOL } from '../../config/fairfillConfig.js';
import { AuditEvents, logAudit } from '../audit.js';
import { calculateUnderservice } from './underservice.js';
import { calculateGeographicalEquity } from './equity.js';
import { calculateScore } from './scoring.js';
import { maxMinWaterFill, type RegionDemand, type WaterFillResult } from './regionalFairness.js';
import { checkConcavity, marginalFill, type MarginalFillResult } from './marginalAllocation.js';

export interface RunFairFillResult {
  totalPool: number;
  waterFill: WaterFillResult;
  regionResults: MarginalFillResult[];
  regionScores: Array<{
    regionId: string;
    name: string;
    underserviceScore: number;
    geographicalEquityScore: number;
    serviceLevel: number;
  }>;
}

/**
 * Orchestrates a full FairFill run:
 *   Evidence -> underservice + equity scoring (per region)
 *            -> Layer 1 max-min water-filling (regional caps)
 *            -> Layer 2 marginal tiered allocation (per region, per project)
 *            -> PROPOSED Allocation records (never auto-approved)
 */
export async function runFairFill(): Promise<RunFairFillResult> {
  const alreadyCommitted = await prisma.allocation.count({ where: { status: { in: ['APPROVED', 'RELEASED'] } } });
  if (alreadyCommitted > 0) {
    throw ApiError.conflict('FairFill has already been run and funds approved this scenario. Reset the demo to run it again.');
  }

  // Clear any stale PROPOSED allocations from a prior (unapproved) run.
  await prisma.allocation.deleteMany({ where: { status: 'PROPOSED' } });

  const regions = await prisma.region.findMany({ include: { indicators: true } });

  const peerInputs = regions.map((r) => ({ regionId: r.id, historicalCSR: r.historicalCSR, needIndex: r.needIndex }));

  const regionScoreMap = new Map<
    string,
    { underserviceScore: number; equityScore: number; serviceLevel: number }
  >();

  for (const region of regions) {
    const underservice = calculateUnderservice(
      region.indicators.map((i) => ({
        key: i.key,
        regionalValue: i.regionalValue,
        benchmarkValue: i.benchmarkValue,
        lowerIsWorse: i.lowerIsWorse,
      }))
    );
    const peerGroupInputs = peerInputs.filter((p) => regions.find((r) => r.id === p.regionId)?.peerGroup === region.peerGroup);
    const equity = calculateGeographicalEquity(
      { regionId: region.id, historicalCSR: region.historicalCSR, needIndex: region.needIndex },
      peerGroupInputs
    );

    regionScoreMap.set(region.id, {
      underserviceScore: underservice.score,
      equityScore: equity.score,
      serviceLevel: underservice.serviceLevel,
    });

    await prisma.region.update({
      where: { id: region.id },
      data: {
        underserviceScore: underservice.score,
        geographicalEquityScore: equity.score,
        serviceLevel: underservice.serviceLevel,
        benchmarkServiceLevel: 1,
      },
    });

    for (const contributor of underservice.contributors) {
      const indicator = region.indicators.find((i) => i.key === contributor.key);
      if (indicator) {
        await prisma.regionIndicator.update({
          where: { id: indicator.id },
          data: { gap: contributor.gap, weight: contributor.weight },
        });
      }
    }
  }

  const eligibleProjects = await prisma.project.findMany({
    where: { status: 'PROPOSED' },
    include: { tiers: { orderBy: { order: 'asc' } }, ngo: true, region: true },
  });

  interface ScoredProject {
    id: string;
    name: string;
    regionId: string;
    tiers: { order: number; amount: number; impact: number }[];
    trustMultiplier: number;
    underserviceScore: number;
    equityScore: number;
    isConcave: boolean;
    finalScore: number;
    impactPerRupee: number;
    requestedBudget: number;
  }

  const scoredProjects: ScoredProject[] = [];

  for (const project of eligibleProjects) {
    const regionScore = regionScoreMap.get(project.regionId)!;
    const scoreBreakdown = calculateScore({
      impactUnits: project.impactUnits,
      amount: project.requestedBudget,
      trustMultiplier: project.ngo.trustMultiplier,
      underserviceScore: regionScore.underserviceScore,
      equityScore: regionScore.equityScore,
    });
    const tiers = project.tiers.map((t) => ({ order: t.order, amount: t.amount, impact: t.impact }));
    const isConcave = tiers.length > 0 ? checkConcavity(tiers) : true;

    scoredProjects.push({
      id: project.id,
      name: project.name,
      regionId: project.regionId,
      tiers,
      trustMultiplier: project.ngo.trustMultiplier,
      underserviceScore: regionScore.underserviceScore,
      equityScore: regionScore.equityScore,
      isConcave,
      finalScore: scoreBreakdown.finalScore,
      impactPerRupee: project.requestedBudget > 0 ? project.impactUnits / project.requestedBudget : 0,
      requestedBudget: project.requestedBudget,
    });

    await prisma.project.update({
      where: { id: project.id },
      data: {
        impactPerRupee: project.requestedBudget > 0 ? project.impactUnits / project.requestedBudget : 0,
        underserviceScore: regionScore.underserviceScore,
        equityScore: regionScore.equityScore,
        trustMultiplier: project.ngo.trustMultiplier,
        finalScore: scoreBreakdown.finalScore,
        isConcave,
      },
    });
  }

  // ── Layer 1: max-min regional fairness ──
  const demands: RegionDemand[] = regions.map((region) => ({
    regionId: region.id,
    name: region.name,
    demand: scoredProjects.filter((p) => p.regionId === region.id).reduce((sum, p) => sum + p.requestedBudget, 0),
  }));

  const waterFill = maxMinWaterFill(TOTAL_CSR_POOL, demands);

  for (const cap of waterFill.caps) {
    await prisma.region.update({
      where: { id: cap.regionId },
      data: { budgetCap: cap.cap, budgetDemand: cap.demand },
    });
  }

  await logAudit(
    AuditEvents.REGIONAL_ALLOCATION_CREATED,
    `Layer 1 max-min water-filling allocated ₹${TOTAL_CSR_POOL.toLocaleString('en-IN')} across ${waterFill.caps.length} regions based on regional demand.`
  );

  // ── Layer 2: marginal tiered allocation per region ──
  const regionResults: MarginalFillResult[] = [];

  for (const cap of waterFill.caps) {
    const regionProjects = scoredProjects.filter((p) => p.regionId === cap.regionId && p.tiers.length > 0);
    const result = marginalFill(
      cap.regionId,
      cap.cap,
      regionProjects.map((p) => ({
        projectId: p.id,
        name: p.name,
        tiers: p.tiers,
        trustMultiplier: p.trustMultiplier,
        underserviceScore: p.underserviceScore,
        equityScore: p.equityScore,
      }))
    );
    regionResults.push(result);

    for (const outcome of result.outcomes) {
      if (outcome.fundedAmount <= 0) continue;
      await prisma.allocation.create({
        data: {
          projectId: outcome.projectId,
          regionId: cap.regionId,
          amount: outcome.fundedAmount,
          score: outcome.finalScore,
          status: 'PROPOSED',
          reason: `Layer 2 marginal allocation: ${outcome.tiersFunded}/${outcome.totalTiers} funding tier(s) selected via ${
            outcome.isConcave ? 'marginal impact-per-rupee ranking' : 'lump-sum fallback (non-concave returns)'
          }, adjusted for underservice and geographical equity.`,
        },
      });
    }
  }

  await logAudit(
    AuditEvents.ALLOCATION_PROPOSED,
    `Layer 2 marginal allocation proposed funding for ${regionResults.reduce((s, r) => s + r.outcomes.filter((o) => o.fundedAmount > 0).length, 0)} projects across ${regionResults.length} regions.`
  );

  return {
    totalPool: TOTAL_CSR_POOL,
    waterFill,
    regionResults,
    regionScores: regions.map((r) => {
      const score = regionScoreMap.get(r.id)!;
      return {
        regionId: r.id,
        name: r.name,
        underserviceScore: score.underserviceScore,
        geographicalEquityScore: score.equityScore,
        serviceLevel: score.serviceLevel,
      };
    }),
  };
}
