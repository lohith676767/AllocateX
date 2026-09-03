import { prisma } from '../../db/client.js';
import { TOTAL_CSR_POOL } from '../../config/fairfillConfig.js';

export interface ComparisonRow {
  regionId: string;
  name: string;
  traditionalAmount: number;
  fairfillAmount: number;
}

/**
 * Illustrative comparison using the CURRENT demo scenario's own data — never
 * a fabricated empirical claim. "Traditional" simulates a naive impact-only
 * allocator that ranks every project nationwide by raw impact-per-rupee and
 * funds top-down against the whole pool with no regional fairness
 * constraint. "FairFill" is the real Allocation table produced by the
 * actual two-layer engine. Both are computed from the same seeded projects.
 */
export async function computeAllocationComparison(): Promise<ComparisonRow[]> {
  const projects = await prisma.project.findMany({ where: { NOT: { status: 'DRAFT' } } });
  const regions = await prisma.region.findMany();

  const traditionalSorted = [...projects].sort((a, b) => b.impactPerRupee - a.impactPerRupee);
  let remaining = TOTAL_CSR_POOL;
  const traditionalByRegion = new Map<string, number>();
  for (const project of traditionalSorted) {
    if (project.requestedBudget <= remaining) {
      remaining -= project.requestedBudget;
      traditionalByRegion.set(project.regionId, (traditionalByRegion.get(project.regionId) ?? 0) + project.requestedBudget);
    }
  }

  const allocations = await prisma.allocation.findMany();
  const fairfillByRegion = new Map<string, number>();
  for (const allocation of allocations) {
    fairfillByRegion.set(allocation.regionId, (fairfillByRegion.get(allocation.regionId) ?? 0) + allocation.amount);
  }

  return regions.map((region) => ({
    regionId: region.id,
    name: region.name,
    traditionalAmount: round2(traditionalByRegion.get(region.id) ?? 0),
    fairfillAmount: round2(fairfillByRegion.get(region.id) ?? 0),
  }));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
