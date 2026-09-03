import { ALPHA_UNDERSERVICE_WEIGHT, BETA_EQUITY_WEIGHT, IMPACT_EFFICIENCY_SCALE } from '../../config/fairfillConfig.js';

export interface ScoreInput {
  impactUnits: number;
  amount: number;
  trustMultiplier: number;
  underserviceScore: number;
  equityScore: number;
}

export interface ScoreBreakdown {
  impactUnits: number;
  amount: number;
  impactEfficiency: number; // impact units per ₹1,00,000
  trustMultiplier: number;
  underserviceScore: number;
  equityScore: number;
  underserviceBonusPct: number;
  equityBonusPct: number;
  totalMultiplier: number;
  baseScore: number; // impactEfficiency * trust
  finalScore: number;
}

/**
 * Layer 2 scoring formula:
 *   impactEfficiency = impactUnits / amount              (scaled to per-₹1L for readability)
 *   adjustedScore     = impactEfficiency * trust * (1 + ALPHA*underservice + BETA*equity)
 *
 * Every term is preserved in the returned breakdown so the UI can render a
 * full waterfall instead of a single opaque number.
 */
export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const impactEfficiency = input.amount > 0 ? (input.impactUnits / input.amount) * IMPACT_EFFICIENCY_SCALE : 0;
  const underserviceBonus = ALPHA_UNDERSERVICE_WEIGHT * input.underserviceScore;
  const equityBonus = BETA_EQUITY_WEIGHT * input.equityScore;
  const totalMultiplier = 1 + underserviceBonus + equityBonus;
  const baseScore = impactEfficiency * input.trustMultiplier;
  const finalScore = baseScore * totalMultiplier;

  return {
    impactUnits: input.impactUnits,
    amount: input.amount,
    impactEfficiency: round2(impactEfficiency),
    trustMultiplier: input.trustMultiplier,
    underserviceScore: input.underserviceScore,
    equityScore: input.equityScore,
    underserviceBonusPct: round2(underserviceBonus * 100),
    equityBonusPct: round2(equityBonus * 100),
    totalMultiplier: round2(totalMultiplier),
    baseScore: round2(baseScore),
    finalScore: round2(finalScore),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
