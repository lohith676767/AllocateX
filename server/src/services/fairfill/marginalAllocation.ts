import { EPSILON } from '../../config/fairfillConfig.js';
import { calculateScore } from './scoring.js';

export interface TierInput {
  order: number;
  amount: number; // cumulative amount to reach this tier
  impact: number; // cumulative impact at this tier
}

export interface AllocationProjectInput {
  projectId: string;
  name: string;
  tiers: TierInput[];
  trustMultiplier: number;
  underserviceScore: number;
  equityScore: number;
}

export interface FillStep {
  projectId: string;
  projectName: string;
  tierOrder: number;
  marginalAmount: number;
  marginalImpact: number;
  marginalEfficiency: number;
  adjustedScore: number;
  cumulativeSpentInRegion: number;
  mode: 'MARGINAL' | 'LUMP_SUM_FALLBACK';
}

export interface ProjectAllocationOutcome {
  projectId: string;
  name: string;
  isConcave: boolean;
  fundedAmount: number;
  fundedImpact: number;
  tiersFunded: number;
  totalTiers: number;
  finalScore: number;
}

export interface MarginalFillResult {
  regionId: string;
  cap: number;
  spent: number;
  residual: number;
  outcomes: ProjectAllocationOutcome[];
  steps: FillStep[];
}

/**
 * A project's tiers represent diminishing-returns funding bands. Concavity
 * means each additional rupee buys less marginal impact than the rupee
 * before it — the normal, well-behaved shape for CSR project economics.
 * If a project's marginal efficiency ever *increases* between tiers, greedy
 * marginal allocation is not sound for it, so it is flagged NON_CONCAVE and
 * funded as a single lump sum instead (ranked once, not tier-stepped).
 */
export function checkConcavity(tiers: TierInput[]): boolean {
  const sorted = [...tiers].sort((a, b) => a.order - b.order);
  let prevAmount = 0;
  let prevImpact = 0;
  let prevEfficiency = Infinity;

  for (const tier of sorted) {
    const marginalAmount = tier.amount - prevAmount;
    const marginalImpact = tier.impact - prevImpact;
    if (marginalAmount <= 0) return false;
    const efficiency = marginalImpact / marginalAmount;
    if (efficiency > prevEfficiency + EPSILON) return false;
    prevEfficiency = efficiency;
    prevAmount = tier.amount;
    prevImpact = tier.impact;
  }
  return true;
}

interface Cursor {
  project: AllocationProjectInput;
  tierIndex: number; // next tier not yet funded
  spent: number;
  impactSoFar: number;
}

/**
 * Layer 2 — marginal fill within a region's cap (established by Layer 1).
 *
 * NON_CONCAVE projects are funded first as an indivisible lump sum, ranked
 * once by their full adjusted score (fallback method), because greedy
 * tier-stepping is not sound when returns are not diminishing.
 *
 * Remaining concave projects are then filled tier-by-tier: at every step the
 * engine looks at every project's *next available tier only*, scores the
 * marginal impact-per-rupee of that increment (adjusted by trust,
 * underservice and equity), and funds whichever affordable increment scores
 * highest. This repeats until no remaining tier fits in what's left of the
 * cap — true marginal allocation, not a single one-shot ranking.
 */
export function marginalFill(
  regionId: string,
  cap: number,
  projects: AllocationProjectInput[]
): MarginalFillResult {
  const steps: FillStep[] = [];
  const outcomes: ProjectAllocationOutcome[] = [];
  let remaining = cap;
  let cumulativeSpent = 0;

  const concaveProjects: AllocationProjectInput[] = [];
  const nonConcaveProjects: AllocationProjectInput[] = [];

  for (const project of projects) {
    if (project.tiers.length === 0) continue;
    if (checkConcavity(project.tiers)) {
      concaveProjects.push(project);
    } else {
      nonConcaveProjects.push(project);
    }
  }

  // --- Fallback pass: NON_CONCAVE projects funded as a ranked lump sum ---
  const lumpCandidates = nonConcaveProjects
    .map((project) => {
      const finalTier = [...project.tiers].sort((a, b) => b.order - a.order)[0];
      const score = calculateScore({
        impactUnits: finalTier.impact,
        amount: finalTier.amount,
        trustMultiplier: project.trustMultiplier,
        underserviceScore: project.underserviceScore,
        equityScore: project.equityScore,
      });
      return { project, finalTier, score: score.finalScore };
    })
    .sort((a, b) => b.score - a.score);

  const fundedProjectIds = new Set<string>();

  for (const candidate of lumpCandidates) {
    if (candidate.finalTier.amount <= remaining + EPSILON) {
      remaining -= candidate.finalTier.amount;
      cumulativeSpent += candidate.finalTier.amount;
      fundedProjectIds.add(candidate.project.projectId);
      steps.push({
        projectId: candidate.project.projectId,
        projectName: candidate.project.name,
        tierOrder: candidate.finalTier.order,
        marginalAmount: candidate.finalTier.amount,
        marginalImpact: candidate.finalTier.impact,
        marginalEfficiency: candidate.finalTier.impact / candidate.finalTier.amount,
        adjustedScore: candidate.score,
        cumulativeSpentInRegion: cumulativeSpent,
        mode: 'LUMP_SUM_FALLBACK',
      });
      outcomes.push({
        projectId: candidate.project.projectId,
        name: candidate.project.name,
        isConcave: false,
        fundedAmount: candidate.finalTier.amount,
        fundedImpact: candidate.finalTier.impact,
        tiersFunded: candidate.project.tiers.length,
        totalTiers: candidate.project.tiers.length,
        finalScore: candidate.score,
      });
    } else {
      outcomes.push({
        projectId: candidate.project.projectId,
        name: candidate.project.name,
        isConcave: false,
        fundedAmount: 0,
        fundedImpact: 0,
        tiersFunded: 0,
        totalTiers: candidate.project.tiers.length,
        finalScore: candidate.score,
      });
    }
  }

  // --- Marginal pass: concave projects filled tier-by-tier ---
  const cursors = new Map<string, Cursor>(
    concaveProjects.map((project) => [
      project.projectId,
      { project, tierIndex: 0, spent: 0, impactSoFar: 0 },
    ])
  );

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidates = [...cursors.values()]
      .filter((c) => c.tierIndex < c.project.tiers.length)
      .map((c) => {
        const tier = [...c.project.tiers].sort((a, b) => a.order - b.order)[c.tierIndex];
        const marginalAmount = tier.amount - c.spent;
        const marginalImpact = tier.impact - c.impactSoFar;
        const score = calculateScore({
          impactUnits: marginalImpact,
          amount: marginalAmount,
          trustMultiplier: c.project.trustMultiplier,
          underserviceScore: c.project.underserviceScore,
          equityScore: c.project.equityScore,
        });
        return { cursor: c, tier, marginalAmount, marginalImpact, score: score.finalScore };
      })
      .filter((c) => c.marginalAmount <= remaining + EPSILON && c.marginalAmount > EPSILON);

    if (candidates.length === 0) break;

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    best.cursor.spent = best.tier.amount;
    best.cursor.impactSoFar = best.tier.impact;
    best.cursor.tierIndex += 1;
    remaining -= best.marginalAmount;
    cumulativeSpent += best.marginalAmount;

    steps.push({
      projectId: best.cursor.project.projectId,
      projectName: best.cursor.project.name,
      tierOrder: best.tier.order,
      marginalAmount: best.marginalAmount,
      marginalImpact: best.marginalImpact,
      marginalEfficiency: best.marginalImpact / best.marginalAmount,
      adjustedScore: best.score,
      cumulativeSpentInRegion: cumulativeSpent,
      mode: 'MARGINAL',
    });
  }

  for (const cursor of cursors.values()) {
    const lastScore = steps
      .filter((s) => s.projectId === cursor.project.projectId)
      .reduce((max, s) => Math.max(max, s.adjustedScore), 0);
    outcomes.push({
      projectId: cursor.project.projectId,
      name: cursor.project.name,
      isConcave: true,
      fundedAmount: cursor.spent,
      fundedImpact: cursor.impactSoFar,
      tiersFunded: cursor.tierIndex,
      totalTiers: cursor.project.tiers.length,
      finalScore: lastScore,
    });
  }

  return {
    regionId,
    cap,
    spent: round2(cumulativeSpent),
    residual: round2(remaining),
    outcomes,
    steps,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
