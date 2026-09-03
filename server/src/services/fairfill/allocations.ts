import { prisma } from '../../db/client.js';
import { ApiError } from '../../utils/errors.js';
import { AuditEvents, logAudit } from '../audit.js';
import { assertTransition, ProjectState } from '../simulation/stateMachine.js';

export async function approveAllocation(allocationId: string) {
  const allocation = await prisma.allocation.findUnique({
    where: { id: allocationId },
    include: { project: true, region: true },
  });
  if (!allocation) throw ApiError.notFound('Allocation not found');
  if (allocation.status !== 'PROPOSED') {
    throw ApiError.conflict(`Allocation has already been ${allocation.status.toLowerCase()}`);
  }

  let status = allocation.project.status as ProjectState;
  for (const next of ['APPROVED', 'FUNDED', 'IN_PROGRESS'] as ProjectState[]) {
    assertTransition(status, next);
    status = next;
  }

  await prisma.$transaction([
    prisma.allocation.update({ where: { id: allocationId }, data: { status: 'RELEASED' } }),
    prisma.project.update({
      where: { id: allocation.projectId },
      data: { status, fundedAmount: { increment: allocation.amount } },
    }),
    prisma.region.update({
      where: { id: allocation.regionId },
      data: { allocatedAmount: { increment: allocation.amount } },
    }),
  ]);

  await logAudit(
    AuditEvents.ALLOCATION_APPROVED,
    `Allocation of ₹${allocation.amount.toLocaleString('en-IN')} approved for "${allocation.project.name}". Funds released.`
  );
  await logAudit(
    AuditEvents.PROJECT_FUNDED,
    `"${allocation.project.name}" is now funded and IN_PROGRESS in ${allocation.region.name}.`
  );

  return prisma.allocation.findUnique({ where: { id: allocationId }, include: { project: true, region: true } });
}

export async function rejectAllocation(allocationId: string) {
  const allocation = await prisma.allocation.findUnique({ where: { id: allocationId }, include: { project: true } });
  if (!allocation) throw ApiError.notFound('Allocation not found');
  if (allocation.status !== 'PROPOSED') {
    throw ApiError.conflict(`Allocation has already been ${allocation.status.toLowerCase()}`);
  }

  await prisma.allocation.update({ where: { id: allocationId }, data: { status: 'REJECTED' } });

  await logAudit(
    AuditEvents.ALLOCATION_REJECTED,
    `Proposed allocation of ₹${allocation.amount.toLocaleString('en-IN')} for "${allocation.project.name}" was rejected.`
  );

  return prisma.allocation.findUnique({ where: { id: allocationId }, include: { project: true } });
}
