import { prisma } from '../../db/client.js';
import { ApiError } from '../../utils/errors.js';
import { AuditEvents, logAudit } from '../audit.js';
import { assertTransition } from '../simulation/stateMachine.js';
import { calculateScore } from './scoring.js';

/**
 * Finds the best-scoring destination project for a source project's
 * unspent remainder and creates a PROPOSED Reallocation record. The
 * destination search is scoped to the SOURCE PROJECT'S OWN REGION so that
 * moving money never crosses — and therefore never violates — the Layer 1
 * regional fairness cap it was originally allocated under.
 *
 * "Unspent remainder" is bounded by TWO things, not just the gap between
 * what the project asked for and what it received: the source's own gap
 * (requestedBudget - fundedAmount) is only ever a WISH, since that gap was
 * never actually reserved for it — the marginal-fill engine simply chose
 * not to fund it. The only money that is genuinely free to move is what is
 * still unspent inside the REGION'S OWN cap (budgetCap - amount already
 * released in that region). Capping by the smaller of the two guarantees a
 * reallocation can never overspend the region's fairness cap or, therefore,
 * the total CSR pool — the same "exceeding remaining funds" guard the
 * approval step re-validates below.
 */
export async function proposeReallocation(sourceProjectId: string, reason: string) {
  const source = await prisma.project.findUnique({
    where: { id: sourceProjectId },
    include: { region: true, tiers: true },
  });
  if (!source) throw ApiError.notFound('Source project not found');

  const sourceGap = round2(source.requestedBudget - source.fundedAmount);
  if (sourceGap <= 0) {
    throw ApiError.conflict('Source project has no unspent remainder to reallocate');
  }

  const releasedInRegion = await prisma.allocation.aggregate({
    where: { regionId: source.regionId, status: 'RELEASED' },
    _sum: { amount: true },
  });
  const regionResidual = round2(Math.max(0, (source.region.budgetCap ?? 0) - (releasedInRegion._sum.amount ?? 0)));
  const remaining = round2(Math.min(sourceGap, regionResidual));

  if (remaining <= 0) {
    throw ApiError.conflict(`Region "${source.region.name}" has no unallocated cap headroom left for reallocation`);
  }

  const candidates = await prisma.project.findMany({
    where: {
      regionId: source.regionId,
      id: { not: source.id },
      status: { in: ['FUNDED', 'IN_PROGRESS', 'MILESTONE_COMPLETED', 'APPROVED'] },
    },
    include: { tiers: true },
  });

  let best: { project: (typeof candidates)[number]; score: number } | null = null;

  for (const candidate of candidates) {
    const nextTier = [...candidate.tiers]
      .sort((a, b) => a.order - b.order)
      .find((t) => t.amount > candidate.fundedAmount);
    const targetAmount = nextTier ? nextTier.amount - candidate.fundedAmount : candidate.requestedBudget - candidate.fundedAmount;
    const targetImpact = nextTier
      ? nextTier.impact * (targetAmount / Math.max(nextTier.amount, 1))
      : candidate.impactUnits * (targetAmount / Math.max(candidate.requestedBudget, 1));

    if (targetAmount <= 0) continue;

    const { finalScore } = calculateScore({
      impactUnits: targetImpact,
      amount: Math.min(targetAmount, remaining),
      trustMultiplier: candidate.trustMultiplier,
      underserviceScore: candidate.underserviceScore,
      equityScore: candidate.equityScore,
    });

    if (!best || finalScore > best.score) {
      best = { project: candidate, score: finalScore };
    }
  }

  if (!best) {
    throw ApiError.conflict('No eligible destination project found within the regional cap for reallocation');
  }

  const explanation = [
    `Higher marginal impact (adjusted score ${best.score.toFixed(1)}) than remaining alternatives in ${source.region.name}.`,
    `High underservice (${(best.project.underserviceScore * 100).toFixed(0)}%) and geographical equity (${(best.project.equityScore * 100).toFixed(0)}%) in the destination project's region.`,
    `Regional fairness constraint satisfied — the ₹${remaining.toLocaleString('en-IN')} redirected was still unspent inside ${source.region.name}'s regional cap, so no region gains beyond what it was already allotted.`,
  ].join(' ');

  const reallocation = await prisma.reallocation.create({
    data: {
      sourceProjectId: source.id,
      destinationProjectId: best.project.id,
      amount: round2(Math.min(remaining, best.project.requestedBudget - best.project.fundedAmount)),
      reason,
      destinationScore: round2(best.score),
      explanation,
      status: 'PROPOSED',
    },
    include: { sourceProject: true, destinationProject: true },
  });

  assertTransition(source.status as any, 'REALLOCATION_PROPOSED');
  await prisma.project.update({
    where: { id: source.id },
    data: { status: 'REALLOCATION_PROPOSED' },
  });

  await logAudit(
    AuditEvents.REALLOCATION_PROPOSED,
    `Reallocation proposed: ₹${reallocation.amount.toLocaleString('en-IN')} from "${source.name}" to "${best.project.name}" (destination score ${best.score.toFixed(1)}).`
  );

  return reallocation;
}

export async function approveReallocation(reallocationId: string) {
  const reallocation = await prisma.reallocation.findUnique({
    where: { id: reallocationId },
    include: { sourceProject: true, destinationProject: true },
  });
  if (!reallocation) throw ApiError.notFound('Reallocation not found');
  if (reallocation.status !== 'PROPOSED') {
    throw ApiError.conflict(`Reallocation has already been ${reallocation.status.toLowerCase()}`);
  }

  const source = reallocation.sourceProject;
  const destination = reallocation.destinationProject;

  const remainingAtSource = round2(source.requestedBudget - source.fundedAmount);
  if (reallocation.amount > remainingAtSource + 0.01) {
    throw ApiError.conflict('Reallocation amount exceeds the source project\'s remaining unspent funds');
  }

  const releasedInRegion = await prisma.allocation.aggregate({
    where: { regionId: source.regionId, status: 'RELEASED' },
    _sum: { amount: true },
  });
  const region = await prisma.region.findUniqueOrThrow({ where: { id: source.regionId } });
  const regionResidual = round2(Math.max(0, (region.budgetCap ?? 0) - (releasedInRegion._sum.amount ?? 0)));
  if (reallocation.amount > regionResidual + 0.01) {
    throw ApiError.conflict(
      `Reallocation amount exceeds the remaining unallocated cap in ${region.name} (₹${regionResidual.toLocaleString('en-IN')} available)`
    );
  }

  assertTransition(source.status as any, 'REALLOCATED');

  await prisma.$transaction([
    prisma.reallocation.update({ where: { id: reallocationId }, data: { status: 'APPROVED' } }),
    prisma.project.update({ where: { id: source.id }, data: { status: 'REALLOCATED' } }),
    prisma.project.update({
      where: { id: destination.id },
      data: { fundedAmount: { increment: reallocation.amount } },
    }),
    prisma.allocation.create({
      data: {
        projectId: destination.id,
        regionId: destination.regionId,
        amount: reallocation.amount,
        reason: `Reallocated from "${source.name}" — ${reallocation.reason}`,
        score: reallocation.destinationScore,
        status: 'RELEASED',
      },
    }),
    prisma.region.update({
      where: { id: destination.regionId },
      data: { allocatedAmount: { increment: reallocation.amount } },
    }),
  ]);

  await logAudit(
    AuditEvents.REALLOCATION_APPROVED,
    `Reallocation approved and released: ₹${reallocation.amount.toLocaleString('en-IN')} moved from "${source.name}" to "${destination.name}".`
  );

  return prisma.reallocation.findUnique({
    where: { id: reallocationId },
    include: { sourceProject: true, destinationProject: true },
  });
}

export async function rejectReallocation(reallocationId: string) {
  const reallocation = await prisma.reallocation.findUnique({
    where: { id: reallocationId },
    include: { sourceProject: true },
  });
  if (!reallocation) throw ApiError.notFound('Reallocation not found');
  if (reallocation.status !== 'PROPOSED') {
    throw ApiError.conflict(`Reallocation has already been ${reallocation.status.toLowerCase()}`);
  }

  assertTransition(reallocation.sourceProject.status as any, 'PAUSED');

  await prisma.$transaction([
    prisma.reallocation.update({ where: { id: reallocationId }, data: { status: 'REJECTED' } }),
    prisma.project.update({ where: { id: reallocation.sourceProjectId }, data: { status: 'PAUSED' } }),
  ]);

  await logAudit(
    AuditEvents.REALLOCATION_REJECTED,
    `Reallocation rejected for "${reallocation.sourceProject.name}". Project moved to PAUSED for manual follow-up.`
  );

  return prisma.reallocation.findUnique({ where: { id: reallocationId } });
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
