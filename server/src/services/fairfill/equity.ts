export interface PeerRegionInput {
  regionId: string;
  historicalCSR: number;
  needIndex: number;
}

export interface EquityResult {
  regionId: string;
  fundingPerNeed: number;
  peerAverageFundingPerNeed: number;
  relativeFundingGapPct: number; // positive => region is underfunded relative to peers
  score: number;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Geographical equity is NOT "less money in => more money out". It measures
 * funding *relative to need* against the peer-group average. A region that is
 * historically underfunded relative to its own need — compared to similar
 * peer regions — receives a higher equity score, independent of its raw
 * underservice indicators.
 */
export function calculateGeographicalEquity(
  region: PeerRegionInput,
  peerGroup: PeerRegionInput[]
): EquityResult {
  const fundingPerNeed = region.historicalCSR / Math.max(region.needIndex, 1e-9);

  const peers = peerGroup.filter((p) => p.regionId !== region.regionId);
  const comparisonSet = peers.length > 0 ? peers : peerGroup;
  const peerAverageFundingPerNeed =
    comparisonSet.reduce((sum, p) => sum + p.historicalCSR / Math.max(p.needIndex, 1e-9), 0) /
    Math.max(comparisonSet.length, 1);

  const relativeFundingGapPct =
    peerAverageFundingPerNeed > 0
      ? ((peerAverageFundingPerNeed - fundingPerNeed) / peerAverageFundingPerNeed) * 100
      : 0;

  // A region funded at or below half the peer average relative-to-need is
  // treated as maximally equity-deserving (score -> 1); a region funded at
  // or above 1.5x the peer average is treated as equity-saturated (score -> 0).
  const score = clamp01(0.5 + relativeFundingGapPct / 100);

  return {
    regionId: region.regionId,
    fundingPerNeed,
    peerAverageFundingPerNeed,
    relativeFundingGapPct,
    score,
  };
}
