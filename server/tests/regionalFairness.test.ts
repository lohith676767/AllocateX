import { describe, expect, it } from 'vitest';
import { maxMinWaterFill } from '../src/services/fairfill/regionalFairness.js';

describe('maxMinWaterFill', () => {
  it('fully satisfies low-demand regions and splits the remainder equally among high-demand ones', () => {
    const result = maxMinWaterFill(10_000_000, [
      { regionId: 'A', name: 'A', demand: 4_300_000 },
      { regionId: 'B', name: 'B', demand: 4_000_000 },
      { regionId: 'C', name: 'C', demand: 2_300_000 },
      { regionId: 'D', name: 'D', demand: 2_200_000 },
    ]);

    const byId = Object.fromEntries(result.caps.map((c) => [c.regionId, c]));
    expect(byId.C.cap).toBeCloseTo(2_300_000, 2);
    expect(byId.C.satisfiedFully).toBe(true);
    expect(byId.D.cap).toBeCloseTo(2_200_000, 2);
    expect(byId.D.satisfiedFully).toBe(true);
    expect(byId.A.cap).toBeCloseTo(2_750_000, 2);
    expect(byId.B.cap).toBeCloseTo(2_750_000, 2);
    expect(byId.A.satisfiedFully).toBe(false);

    const totalAllocated = result.caps.reduce((s, c) => s + c.cap, 0);
    expect(totalAllocated).toBeCloseTo(10_000_000, 2);
  });

  it('never lets one region consume the whole pool just because its demand is huge', () => {
    const result = maxMinWaterFill(1_000_000, [
      { regionId: 'huge', name: 'huge', demand: 50_000_000 },
      { regionId: 'small', name: 'small', demand: 200_000 },
    ]);
    const byId = Object.fromEntries(result.caps.map((c) => [c.regionId, c]));
    expect(byId.small.cap).toBeCloseTo(200_000, 2);
    expect(byId.huge.cap).toBeCloseTo(800_000, 2);
    expect(byId.huge.cap).toBeLessThan(50_000_000);
  });

  it('splits equally when all regions have equal, unmet demand', () => {
    const result = maxMinWaterFill(900_000, [
      { regionId: 'A', name: 'A', demand: 1_000_000 },
      { regionId: 'B', name: 'B', demand: 1_000_000 },
      { regionId: 'C', name: 'C', demand: 1_000_000 },
    ]);
    for (const cap of result.caps) {
      expect(cap.cap).toBeCloseTo(300_000, 2);
    }
  });

  it('leaves residual unallocated when total demand is below the pool', () => {
    const result = maxMinWaterFill(1_000_000, [{ regionId: 'A', name: 'A', demand: 400_000 }]);
    expect(result.caps[0].cap).toBeCloseTo(400_000, 2);
    expect(result.unallocatedResidual).toBeCloseTo(600_000, 2);
  });
});
