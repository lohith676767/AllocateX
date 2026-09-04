export function formatINR(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (Math.abs(amount) >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
    if (Math.abs(amount) >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
    if (Math.abs(amount) >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatPct(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatScore(value: number): string {
  return value.toFixed(1);
}

/**
 * FairFill's final score is impactEfficiency (impact units per ₹1L — an
 * arbitrary per-domain unit, not a percentage) multiplied by NGO trust and a
 * fairness bonus — it is open-ended, NOT bounded to 0-100. These thresholds
 * are tuned to the shape of the current demo dataset (observed range
 * roughly 70-275) and are the single place to retune if the underlying
 * score scale ever changes. The classification itself never touches the
 * score calculation — it only labels the number FairFill already produced.
 */
export const IMPACT_SCORE_THRESHOLDS = { high: 220, medium: 130 } as const;

export type ImpactClassification = 'HIGH' | 'MEDIUM' | 'LOW';

export function classifyImpactScore(
  score: number,
  thresholds: { high: number; medium: number } = IMPACT_SCORE_THRESHOLDS,
): ImpactClassification {
  if (score >= thresholds.high) return 'HIGH';
  if (score >= thresholds.medium) return 'MEDIUM';
  return 'LOW';
}

export const IMPACT_CLASSIFICATION_TONE: Record<ImpactClassification, 'positive' | 'warning' | 'danger'> = {
  HIGH: 'positive',
  MEDIUM: 'warning',
  LOW: 'danger',
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PROPOSED: 'Proposed',
  APPROVED: 'Approved',
  FUNDED: 'Funded',
  IN_PROGRESS: 'In Progress',
  MILESTONE_COMPLETED: 'Milestone Completed',
  MILESTONE_MISSED: 'Milestone Missed',
  PAUSED: 'Paused',
  UNDER_REVIEW: 'Under Review',
  COMPLETED: 'Completed',
  REALLOCATION_PROPOSED: 'Reallocation Proposed',
  REALLOCATED: 'Reallocated',
  REJECTED: 'Rejected',
  RELEASED: 'Released',
  UPCOMING: 'Upcoming',
  MISSED: 'Missed',
  SUBMITTED: 'Pending Review',
  REVIEWED: 'Reviewed',
  FLAGGED: 'Flagged',
};

export const STATUS_TONE: Record<string, 'neutral' | 'positive' | 'warning' | 'danger' | 'info'> = {
  DRAFT: 'neutral',
  PROPOSED: 'info',
  APPROVED: 'positive',
  FUNDED: 'positive',
  IN_PROGRESS: 'info',
  MILESTONE_COMPLETED: 'positive',
  MILESTONE_MISSED: 'danger',
  PAUSED: 'warning',
  UNDER_REVIEW: 'warning',
  COMPLETED: 'positive',
  REALLOCATION_PROPOSED: 'warning',
  REALLOCATED: 'info',
  REJECTED: 'danger',
  RELEASED: 'positive',
  UPCOMING: 'neutral',
  MISSED: 'danger',
  SUBMITTED: 'warning',
  REVIEWED: 'positive',
  FLAGGED: 'danger',
};

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour12: false });
}
