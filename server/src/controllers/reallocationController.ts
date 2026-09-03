import type { Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { approveReallocation, rejectReallocation } from '../services/fairfill/reallocation.js';

export const listReallocations = asyncHandler(async (_req: Request, res: Response) => {
  const reallocations = await prisma.reallocation.findMany({
    include: {
      sourceProject: { include: { region: true } },
      destinationProject: { include: { region: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(reallocations);
});

export const postApproveReallocation = asyncHandler(async (req: Request, res: Response) => {
  const reallocation = await approveReallocation(req.params.id);
  res.json(reallocation);
});

export const postRejectReallocation = asyncHandler(async (req: Request, res: Response) => {
  const reallocation = await rejectReallocation(req.params.id);
  res.json(reallocation);
});
