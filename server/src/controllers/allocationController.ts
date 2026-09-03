import type { Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { approveAllocation, rejectAllocation } from '../services/fairfill/allocations.js';

export const listAllocations = asyncHandler(async (_req: Request, res: Response) => {
  const allocations = await prisma.allocation.findMany({
    include: { project: { include: { ngo: true } }, region: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(allocations);
});

export const postApproveAllocation = asyncHandler(async (req: Request, res: Response) => {
  const allocation = await approveAllocation(req.params.id);
  res.json(allocation);
});

export const postRejectAllocation = asyncHandler(async (req: Request, res: Response) => {
  const allocation = await rejectAllocation(req.params.id);
  res.json(allocation);
});
