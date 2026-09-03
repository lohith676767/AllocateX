import { describe, expect, it } from 'vitest';
import { calculateScore } from '../src/services/fairfill/scoring.js';

describe('calculateScore', () => {
  it('reproduces the documented worked example shape', () => {
    const result = calculateScore({
      impactUnits: 924,
      amount: 1_000_000,
      trustMultiplier: 1.1,
      underserviceScore: 0.82,
      equityScore: 0.91,
    });
    expect(result.impactEfficiency).toBeCloseTo(92.4, 1);
    expect(result.totalMultiplier).toBeCloseTo(1 + 0.3 * 0.82 + 0.2 * 0.91, 2);
    expect(result.finalScore).toBeCloseTo(result.impactEfficiency * 1.1 * result.totalMultiplier, 0);
  });

  it('demonstrates FairFill can prefer lower raw impact when underservice/equity are much higher', () => {
    const highImpactLowEquity = calculateScore({
      impactUnits: 2000,
      amount: 1_000_000,
      trustMultiplier: 1.15,
      underserviceScore: 0.014,
      equityScore: 0,
    });
    const lowerImpactHighEquity = calculateScore({
      impactUnits: 1700,
      amount: 1_000_000,
      trustMultiplier: 1.1,
      underserviceScore: 0.73,
      equityScore: 0.88,
    });

    expect(highImpactLowEquity.impactEfficiency).toBeGreaterThan(lowerImpactHighEquity.impactEfficiency);
    expect(lowerImpactHighEquity.finalScore).toBeGreaterThan(highImpactLowEquity.finalScore);
  });

  it('returns zero impact efficiency for a zero-amount request without dividing by zero', () => {
    const result = calculateScore({ impactUnits: 100, amount: 0, trustMultiplier: 1, underserviceScore: 0, equityScore: 0 });
    expect(result.impactEfficiency).toBe(0);
    expect(Number.isFinite(result.finalScore)).toBe(true);
  });
});
