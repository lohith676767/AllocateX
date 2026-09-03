import type { Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { calculateUnderservice } from '../services/fairfill/underservice.js';
import { calculateGeographicalEquity } from '../services/fairfill/equity.js';

export const listRegions = asyncHandler(async (_req: Request, res: Response) => {
  const regions = await prisma.region.findMany({
    include: { indicators: true, projects: true, ngos: true },
    orderBy: { name: 'asc' },
  });
  res.json(regions);
});

export const getRegion = asyncHandler(async (req: Request, res: Response) => {
  const region = await prisma.region.findUnique({
    where: { id: req.params.id },
    include: { indicators: true, projects: { include: { ngo: true } }, ngos: true },
  });
  if (!region) throw ApiError.notFound('Region not found');

  const peers = await prisma.region.findMany({ where: { peerGroup: region.peerGroup } });

  const underservice = calculateUnderservice(
    region.indicators.map((i) => ({
      key: i.key,
      regionalValue: i.regionalValue,
      benchmarkValue: i.benchmarkValue,
      lowerIsWorse: i.lowerIsWorse,
    }))
  );
  const equity = calculateGeographicalEquity(
    { regionId: region.id, historicalCSR: region.historicalCSR, needIndex: region.needIndex },
    peers.map((p) => ({ regionId: p.id, historicalCSR: p.historicalCSR, needIndex: p.needIndex }))
  );

  res.json({ ...region, underserviceExplanation: underservice, equityExplanation: equity });
});
