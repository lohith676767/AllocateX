import { describe, expect, it } from 'vitest';
import { calculateGeographicalEquity } from '../src/services/fairfill/equity.js';

describe('calculateGeographicalEquity', () => {
  it('gives a high equity score to a region historically underfunded relative to need', () => {
    const region = { regionId: 'A', historicalCSR: 500_000, needIndex: 100 }; // 5,000/need
    const peers = [
      region,
      { regionId: 'B', historicalCSR: 2_000_000, needIndex: 100 }, // 20,000/need
      { regionId: 'C', historicalCSR: 2_000_000, needIndex: 100 },
    ];
    const result = calculateGeographicalEquity(region, peers);
    expect(result.score).toBeGreaterThan(0.8);
    expect(result.relativeFundingGapPct).toBeGreaterThan(0);
  });

  it('does NOT simply reward a region for having less absolute money — it compares funding relative to need', () => {
    // Region A has less absolute CSR than peers but also much less need, so its
    // funding-per-need ratio is actually higher — it should NOT score as equity-deserving.
    const region = { regionId: 'A', historicalCSR: 100_000, needIndex: 10 }; // 10,000/need
    const peers = [
      region,
      { regionId: 'B', historicalCSR: 5_000_000, needIndex: 1000 }, // 5,000/need
      { regionId: 'C', historicalCSR: 5_000_000, needIndex: 1000 },
    ];
    const result = calculateGeographicalEquity(region, peers);
    expect(result.score).toBeLessThan(0.5);
  });

  it('clamps to [0, 1]', () => {
    const region = { regionId: 'A', historicalCSR: 10_000_000, needIndex: 1 };
    const peers = [region, { regionId: 'B', historicalCSR: 1, needIndex: 1000 }];
    const result = calculateGeographicalEquity(region, peers);
    expect(result.score).toBe(0);
  });
});
