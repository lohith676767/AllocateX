import { describe, expect, it } from 'vitest';
import { checkConcavity, marginalFill } from '../src/services/fairfill/marginalAllocation.js';

describe('checkConcavity', () => {
  it('accepts a standard diminishing-returns tier curve', () => {
    expect(
      checkConcavity([
        { order: 1, amount: 800_000, impact: 900 },
        { order: 2, amount: 1_200_000, impact: 1200 },
        { order: 3, amount: 2_000_000, impact: 1600 },
      ])
    ).toBe(true);
  });

  it('flags a tier curve whose marginal efficiency increases as NON_CONCAVE', () => {
    expect(
      checkConcavity([
        { order: 1, amount: 500_000, impact: 100 }, // eff 0.0002
        { order: 2, amount: 1_000_000, impact: 500 }, // marginal eff 0.0008 — bigger, breaks concavity
      ])
    ).toBe(false);
  });
});

describe('marginalFill', () => {
  it('performs true marginal (tier-by-tier) allocation, not a single one-shot ranking', () => {
    const result = marginalFill('region-1', 2_750_000, [
      {
        projectId: 'handpump',
        name: 'Handpump',
        tiers: [
          { order: 1, amount: 300_000, impact: 350 },
          { order: 2, amount: 600_000, impact: 600 },
        ],
        trustMultiplier: 0.95,
        underserviceScore: 0.64,
        equityScore: 0.91,
      },
      {
        projectId: 'ruralwater',
        name: 'Rural Water',
        tiers: [
          { order: 1, amount: 800_000, impact: 900 },
          { order: 2, amount: 1_200_000, impact: 1200 },
          { order: 3, amount: 2_000_000, impact: 1600 },
        ],
        trustMultiplier: 0.95,
        underserviceScore: 0.64,
        equityScore: 0.91,
      },
      {
        projectId: 'groundwater',
        name: 'Groundwater',
        tiers: [
          { order: 1, amount: 600_000, impact: 500 },
          { order: 2, amount: 1_000_000, impact: 750 },
          { order: 3, amount: 1_400_000, impact: 900 },
        ],
        trustMultiplier: 0.95,
        underserviceScore: 0.64,
        equityScore: 0.91,
      },
    ]);

    const byId = Object.fromEntries(result.outcomes.map((o) => [o.projectId, o]));
    expect(byId.ruralwater.fundedAmount).toBeCloseTo(1_200_000, 2);
    expect(byId.ruralwater.tiersFunded).toBe(2);
    expect(byId.handpump.fundedAmount).toBeCloseTo(600_000, 2);
    expect(byId.groundwater.fundedAmount).toBeCloseTo(600_000, 2);
    expect(result.steps.length).toBeGreaterThan(3); // multiple discrete funding steps, i.e. real marginal stepping
  });

  it('routes a NON_CONCAVE project through the lump-sum fallback instead of tier-stepping it', () => {
    const result = marginalFill('region-1', 2_000_000, [
      {
        projectId: 'weird',
        name: 'Weird',
        tiers: [
          { order: 1, amount: 500_000, impact: 100 },
          { order: 2, amount: 1_000_000, impact: 900 }, // marginal efficiency jumps up -> non-concave
        ],
        trustMultiplier: 1,
        underserviceScore: 0.5,
        equityScore: 0.5,
      },
    ]);

    expect(result.outcomes[0].isConcave).toBe(false);
    expect(result.outcomes[0].fundedAmount).toBeCloseTo(1_000_000, 2); // funded as one indivisible lump
    expect(result.steps[0].mode).toBe('LUMP_SUM_FALLBACK');
  });

  it('never exceeds the regional cap', () => {
    const result = marginalFill('region-1', 500_000, [
      {
        projectId: 'p1',
        name: 'P1',
        tiers: [{ order: 1, amount: 800_000, impact: 1000 }],
        trustMultiplier: 1,
        underserviceScore: 0.5,
        equityScore: 0.5,
      },
    ]);
    expect(result.spent).toBeLessThanOrEqual(500_000);
    expect(result.outcomes[0].fundedAmount).toBe(0);
  });
});
