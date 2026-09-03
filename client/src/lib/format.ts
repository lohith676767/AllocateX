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
