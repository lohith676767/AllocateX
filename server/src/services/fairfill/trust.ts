import { TRUST_MULTIPLIER_MAX, TRUST_MULTIPLIER_MIN } from '../../config/fairfillConfig.js';

export interface NgoTrackRecord {
  projectsCompleted: number;
  projectsDelayed: number;
  projectsFailed: number;
}

/**
 * Derives an NGO trust multiplier from its delivery track record, clamped to
 * the configured [0.5, 1.2] band. Seed data assigns a baseline multiplier
 * directly (representing a due-diligence score); this function lets the
 * multiplier be recomputed/audited from raw project history at any time.
 */
export function deriveTrustMultiplier(record: NgoTrackRecord): number {
  const total = record.projectsCompleted + record.projectsDelayed + record.projectsFailed;
  if (total === 0) return 0.85; // neutral starting multiplier for a new NGO

  const reliability =
    (record.projectsCompleted - 0.5 * record.projectsDelayed - 1.5 * record.projectsFailed) / total;

  // Map reliability (roughly -1.5..1) onto the trust band.
  const normalized = Math.min(1, Math.max(0, (reliability + 1) / 2));
  const multiplier = TRUST_MULTIPLIER_MIN + normalized * (TRUST_MULTIPLIER_MAX - TRUST_MULTIPLIER_MIN);
  return Math.round(multiplier * 100) / 100;
}

export function clampTrustMultiplier(value: number): number {
  return Math.min(TRUST_MULTIPLIER_MAX, Math.max(TRUST_MULTIPLIER_MIN, value));
}
