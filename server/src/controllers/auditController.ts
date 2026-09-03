import type { Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listAuditEvents = asyncHandler(async (_req: Request, res: Response) => {
  const events = await prisma.auditEvent.findMany({ orderBy: { timestamp: 'desc' }, take: 500 });
  res.json(events);
});
