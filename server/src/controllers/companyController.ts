import type { Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listCompanies = asyncHandler(async (_req: Request, res: Response) => {
  const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } });
  res.json(companies);
});
