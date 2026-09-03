import type { Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { TOTAL_CSR_POOL } from '../config/fairfillConfig.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [regions, projects, allocations, reallocations] = await Promise.all([
    prisma.region.findMany(),
    prisma.project.findMany(),
    prisma.allocation.findMany(),
    prisma.reallocation.findMany({ where: { status: 'PROPOSED' } }),
  ]);

  const released = allocations.filter((a) => a.status === 'RELEASED');
  const totalAllocated = released.reduce((sum, a) => sum + a.amount, 0);
  const totalImpactUnits = projects.reduce((sum, p) => sum + (p.fundedAmount > 0 ? p.impactUnits * (p.fundedAmount / p.requestedBudget) : 0), 0);

  const regionsServed = new Set(released.map((a) => a.regionId)).size;
  const projectsFunded = projects.filter((p) => p.fundedAmount > 0).length;
  const activeProjects = projects.filter((p) =>
    ['IN_PROGRESS', 'MILESTONE_COMPLETED', 'MILESTONE_MISSED'].includes(p.status)
  ).length;
  const pendingApprovals =
    (await prisma.allocation.count({ where: { status: 'PROPOSED' } })) + reallocations.length;

  const avgImpactPerRupee = totalAllocated > 0 ? totalImpactUnits / totalAllocated : 0;
  const avgEquityScore = regions.length > 0 ? regions.reduce((s, r) => s + r.geographicalEquityScore, 0) / regions.length : 0;

  const scoredProjects = projects.filter((p) => p.finalScore > 0);
  const avgFairFillScore = scoredProjects.length > 0 ? scoredProjects.reduce((s, p) => s + p.finalScore, 0) / scoredProjects.length : 0;

  res.json({
    totalPool: TOTAL_CSR_POOL,
    allocated: round2(totalAllocated),
    remaining: round2(TOTAL_CSR_POOL - totalAllocated),
    regionsServed,
    totalRegions: regions.length,
    projectsFunded,
    totalProjects: projects.length,
    avgImpactPerRupee: round2(avgImpactPerRupee * 100_000),
    avgFairFillScore: round2(avgFairFillScore),
    equityImprovementPct: round2(avgEquityScore * 100),
    activeProjects,
    pendingApprovals,
    fairFillHasRun: regions.some((r) => r.budgetCap !== null),
  });
});

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
