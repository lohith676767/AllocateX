import { UNDERSERVICE_INDICATOR_WEIGHTS } from '../../config/fairfillConfig.js';

export interface IndicatorInput {
  key: string;
  regionalValue: number;
  benchmarkValue: number;
  lowerIsWorse: boolean;
}

export interface IndicatorGap {
  key: string;
  regionalValue: number;
  benchmarkValue: number;
  gap: number;
  weight: number;
  contribution: number;
}

export interface UnderserviceResult {
  score: number;
  serviceLevel: number;
  contributors: IndicatorGap[];
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Calculates a region's underservice score mathematically from authoritative
 * indicator evidence — never from NGO self-reporting.
 *
 * For an indicator where a lower value is worse (doctors per capita, beds,
 * access, funding): gap = 1 - (regionalValue / benchmarkValue), clamped to [0,1].
 * For an indicator where a higher value is worse (e.g. distance to facility),
 * the gap is computed as regionalValue / benchmarkValue - 1, clamped to [0,1].
 */
export function calculateUnderservice(indicators: IndicatorInput[]): UnderserviceResult {
  const contributors: IndicatorGap[] = indicators.map((ind) => {
    const weight = UNDERSERVICE_INDICATOR_WEIGHTS[ind.key] ?? 1 / Math.max(indicators.length, 1);
    const rawGap = ind.lowerIsWorse
      ? 1 - ind.regionalValue / ind.benchmarkValue
      : ind.regionalValue / ind.benchmarkValue - 1;
    const gap = clamp01(rawGap);
    return {
      key: ind.key,
      regionalValue: ind.regionalValue,
      benchmarkValue: ind.benchmarkValue,
      gap,
      weight,
      contribution: gap * weight,
    };
  });

  const totalWeight = contributors.reduce((sum, c) => sum + c.weight, 0) || 1;
  const score = clamp01(contributors.reduce((sum, c) => sum + c.contribution, 0) / totalWeight);

  return {
    score,
    serviceLevel: 1 - score,
    contributors,
  };
}
