export type SalvageDecision = 'BRIDGE_TRANCHE' | 'REALLOCATE';

export interface SalvageResult {
  decision: SalvageDecision;
  completionPercentage: number;
  thresholdPercentage: number;
  reason: string;
}

/**
 * Salvage logic runs whenever a SELF_CONTROLLED milestone is missed.
 * completion and threshold are both expressed as fractions (0..1).
 * The result is always a proposal for a human to review — never an
 * automatic fund movement.
 */
export function evaluateSalvage(completion: number, threshold: number): SalvageResult {
  const completionPct = Math.round(completion * 1000) / 10;
  const thresholdPct = Math.round(threshold * 1000) / 10;

  if (completion >= threshold) {
    return {
      decision: 'BRIDGE_TRANCHE',
      completionPercentage: completionPct,
      thresholdPercentage: thresholdPct,
      reason: `Completion ${completionPct}% meets the salvage threshold of ${thresholdPct}%. A bridge tranche is recommended to complete the project rather than reallocating funds away from it.`,
    };
  }

  return {
    decision: 'REALLOCATE',
    completionPercentage: completionPct,
    thresholdPercentage: thresholdPct,
    reason: `Completion ${completionPct}% is below the salvage threshold of ${thresholdPct}%. Remaining funds are recommended for reallocation to a higher-performing project.`,
  };
}
