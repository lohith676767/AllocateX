import { EPSILON } from '../../config/fairfillConfig.js';

export interface RegionDemand {
  regionId: string;
  name: string;
  demand: number;
}

export interface RegionCapResult {
  regionId: string;
  name: string;
  demand: number;
  cap: number;
  satisfiedFully: boolean;
}

export interface WaterFillRound {
  round: number;
  activeRegionIds: string[];
  equalShare: number;
  satisfiedThisRound: string[];
  remainingPoolBefore: number;
  remainingPoolAfter: number;
}

export interface WaterFillResult {
  totalPool: number;
  totalDemand: number;
  unallocatedResidual: number;
  caps: RegionCapResult[];
  rounds: WaterFillRound[];
}

/**
 * Layer 1 — structural geographical fairness via max-min water-filling.
 *
 * Repeatedly computes an equal share of the *remaining* pool across regions
 * still active (i.e. whose demand has not yet been fully satisfied). Any
 * region whose remaining demand is <= the current equal share is fully
 * satisfied and removed from the active set, freeing its unused share for
 * the rest. This guarantees no single region — however large its demand —
 * can consume more than a fair ceiling while other regions still need funds.
 */
export function maxMinWaterFill(totalPool: number, demands: RegionDemand[]): WaterFillResult {
  const totalDemand = demands.reduce((sum, d) => sum + d.demand, 0);

  const state = new Map(demands.map((d) => [d.regionId, { ...d, cap: 0, satisfiedFully: false }]));
  let active = demands.filter((d) => d.demand > EPSILON).map((d) => d.regionId);
  let remaining = totalPool;
  const rounds: WaterFillRound[] = [];
  let roundIndex = 0;

  while (remaining > EPSILON && active.length > 0) {
    roundIndex += 1;
    const equalShare = remaining / active.length;
    const satisfiedThisRound: string[] = [];
    const remainingPoolBefore = remaining;

    for (const regionId of active) {
      const entry = state.get(regionId)!;
      const outstandingNeed = entry.demand - entry.cap;
      if (outstandingNeed <= equalShare + EPSILON) {
        entry.cap += outstandingNeed;
        entry.satisfiedFully = true;
        remaining -= outstandingNeed;
        satisfiedThisRound.push(regionId);
      }
    }

    if (satisfiedThisRound.length === 0) {
      // Nobody's demand fits within the equal share: everyone still active
      // gets exactly the equal share and we are done (classic max-min fixed point).
      for (const regionId of active) {
        const entry = state.get(regionId)!;
        entry.cap += equalShare;
      }
      remaining = 0;
      rounds.push({
        round: roundIndex,
        activeRegionIds: [...active],
        equalShare,
        satisfiedThisRound: [],
        remainingPoolBefore,
        remainingPoolAfter: 0,
      });
      active = [];
      break;
    }

    rounds.push({
      round: roundIndex,
      activeRegionIds: [...active],
      equalShare,
      satisfiedThisRound,
      remainingPoolBefore,
      remainingPoolAfter: remaining,
    });

    active = active.filter((id) => !satisfiedThisRound.includes(id));
  }

  const caps: RegionCapResult[] = demands.map((d) => {
    const entry = state.get(d.regionId)!;
    return {
      regionId: d.regionId,
      name: d.name,
      demand: d.demand,
      cap: round2(entry.cap),
      satisfiedFully: entry.satisfiedFully,
    };
  });

  const allocated = caps.reduce((sum, c) => sum + c.cap, 0);

  return {
    totalPool,
    totalDemand,
    unallocatedResidual: round2(Math.max(0, totalPool - allocated)),
    caps,
    rounds,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
