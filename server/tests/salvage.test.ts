import { describe, expect, it } from 'vitest';
import { evaluateSalvage } from '../src/services/fairfill/salvage.js';

describe('evaluateSalvage', () => {
  it('recommends BRIDGE_TRANCHE at or above the threshold', () => {
    expect(evaluateSalvage(0.6, 0.6).decision).toBe('BRIDGE_TRANCHE');
    expect(evaluateSalvage(0.75, 0.6).decision).toBe('BRIDGE_TRANCHE');
  });

  it('recommends REALLOCATE below the threshold', () => {
    expect(evaluateSalvage(0.35, 0.6).decision).toBe('REALLOCATE');
    expect(evaluateSalvage(0.35, 0.6).completionPercentage).toBeCloseTo(35, 1);
    expect(evaluateSalvage(0.35, 0.6).thresholdPercentage).toBeCloseTo(60, 1);
  });
});
