import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { runFairFill } from '../services/fairfill/runFairFill.js';
import { computeAllocationComparison } from '../services/fairfill/comparison.js';
import {
  ALPHA_UNDERSERVICE_WEIGHT,
  BETA_EQUITY_WEIGHT,
  IMPACT_EFFICIENCY_SCALE,
  SALVAGE_THRESHOLD,
  TOTAL_CSR_POOL,
  TRUST_MULTIPLIER_MAX,
  TRUST_MULTIPLIER_MIN,
  UNDERSERVICE_INDICATOR_WEIGHTS,
} from '../config/fairfillConfig.js';

export const postRunFairFill = asyncHandler(async (_req: Request, res: Response) => {
  const result = await runFairFill();
  res.json(result);
});

export const getComparison = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await computeAllocationComparison();
  res.json(rows);
});

export const getConfig = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    totalCsrPool: TOTAL_CSR_POOL,
    alphaUnderserviceWeight: ALPHA_UNDERSERVICE_WEIGHT,
    betaEquityWeight: BETA_EQUITY_WEIGHT,
    impactEfficiencyScale: IMPACT_EFFICIENCY_SCALE,
    salvageThreshold: SALVAGE_THRESHOLD,
    trustMultiplierRange: [TRUST_MULTIPLIER_MIN, TRUST_MULTIPLIER_MAX],
    underserviceIndicatorWeights: UNDERSERVICE_INDICATOR_WEIGHTS,
  });
});
