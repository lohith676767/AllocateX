import { describe, expect, it } from 'vitest';
import { calculateUnderservice } from '../src/services/fairfill/underservice.js';

describe('calculateUnderservice', () => {
  it('computes a weighted gap score for a badly underserved region', () => {
    const result = calculateUnderservice([
      { key: 'doctorAvailability', regionalValue: 1.8, benchmarkValue: 6.5, lowerIsWorse: true },
      { key: 'hospitalBeds', regionalValue: 2.5, benchmarkValue: 9.0, lowerIsWorse: true },
      { key: 'healthcareAccess', regionalValue: 0.28, benchmarkValue: 0.8, lowerIsWorse: true },
      { key: 'csrFundingGap', regionalValue: 9, benchmarkValue: 65, lowerIsWorse: true },
    ]);

    expect(result.score).toBeGreaterThan(0.7);
    expect(result.score).toBeLessThan(0.8);
    expect(result.serviceLevel).toBeCloseTo(1 - result.score, 5);
    expect(result.contributors).toHaveLength(4);
  });

  it('clamps a well-served region (above benchmark on every indicator) to zero', () => {
    const result = calculateUnderservice([
      { key: 'doctorAvailability', regionalValue: 9, benchmarkValue: 6.5, lowerIsWorse: true },
      { key: 'hospitalBeds', regionalValue: 12, benchmarkValue: 9, lowerIsWorse: true },
      { key: 'healthcareAccess', regionalValue: 0.95, benchmarkValue: 0.8, lowerIsWorse: true },
      { key: 'csrFundingGap', regionalValue: 100, benchmarkValue: 65, lowerIsWorse: true },
    ]);

    expect(result.score).toBe(0);
    expect(result.serviceLevel).toBe(1);
  });

  it('never produces a negative gap for a single indicator', () => {
    const result = calculateUnderservice([
      { key: 'doctorAvailability', regionalValue: 100, benchmarkValue: 6.5, lowerIsWorse: true },
    ]);
    expect(result.contributors[0].gap).toBe(0);
  });
});
