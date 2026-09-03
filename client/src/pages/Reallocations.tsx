import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useApiErrorToast, useToast } from '../hooks/useToast';
import { formatINR, formatScore } from '../lib/format';
import { api } from '../services/api';
import type { Reallocation } from '../types';

export default function Reallocations() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const reallocations = useQuery({ queryKey: ['reallocations'], queryFn: api.listReallocations });

  const invalidate = () => queryClient.invalidateQueries();

  const approve = useMutation({
    mutationFn: api.approveReallocation,
    onSuccess: () => {
      invalidate();
      push('success', 'Reallocation approved & released', 'Funds moved to the destination project.');
    },
    onError: (err) => onError(err, 'Approval failed'),
  });
  const reject = useMutation({
    mutationFn: api.rejectReallocation,
    onSuccess: () => {
      invalidate();
      push('info', 'Reallocation rejected', 'Source project moved to Paused for manual follow-up.');
    },
    onError: (err) => onError(err, 'Rejection failed'),
  });

  if (reallocations.isLoading) return <LoadingState label="Loading reallocations…" />;
  if (reallocations.isError) return <ErrorState message="Could not load reallocations." onRetry={() => reallocations.refetch()} />;

  const rows = reallocations.data!;
  const proposed = rows.filter((r) => r.status === 'PROPOSED');
  const resolved = rows.filter((r) => r.status !== 'PROPOSED');

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Reallocations"
        subtitle="FairFill proposes. A human approves. No reallocation is ever executed automatically."
      />

      {proposed.length === 0 ? (
        <EmptyState
          title="No reallocations proposed"
          description="A reallocation is proposed automatically when a self-controlled milestone misses its target and completion falls below the salvage threshold."
        />
      ) : (
        <div className="space-y-4">
          {proposed.map((r) => (
            <ReallocationCard
              key={r.id}
              r={r}
              onApprove={() => approve.mutate(r.id)}
              onReject={() => reject.mutate(r.id)}
              busy={approve.isPending || reject.isPending}
            />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-mist-400">History</h2>
          <div className="card divide-y divide-ink-800 p-0">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-mist-200">{r.sourceProject?.name}</span>
                  <ArrowRight size={12} className="shrink-0 text-mist-400" />
                  <span className="truncate text-mist-200">{r.destinationProject?.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="tabular-nums text-xs text-mist-400">{formatINR(r.amount, { compact: true })}</span>
                  <StatusBadge status={r.status} small />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReallocationCard({
  r,
  onApprove,
  onReject,
  busy,
}: {
  r: Reallocation;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  return (
    <div className="card border-signal-amber/25 p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-signal-amber">Reallocation Proposed</p>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-mist-400">Source</p>
          <p className="text-sm font-semibold text-mist-100">{r.sourceProject?.name}</p>
          <p className="mt-1 text-xs text-mist-400">Remaining ₹{Math.round(r.amount).toLocaleString('en-IN')}</p>
        </div>
        <div className="flex items-center justify-center text-mist-400">
          <ArrowRight size={18} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-mist-400">Recommended destination</p>
          <p className="text-sm font-semibold text-mist-100">{r.destinationProject?.name}</p>
          <p className="mt-1 text-xs text-signal-teal">Destination score {formatScore(r.destinationScore)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-ink-700 bg-ink-800/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">Reason</p>
        <p className="mt-1 text-xs leading-relaxed text-mist-300">{r.reason}</p>
      </div>
      <div className="mt-2 rounded-lg border border-ink-700 bg-ink-800/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">Why this destination</p>
        <p className="mt-1 text-xs leading-relaxed text-mist-300">{r.explanation}</p>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onReject}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-4 py-2 text-xs font-medium text-mist-300 hover:border-signal-rose/40 hover:text-signal-rose disabled:opacity-60"
        >
          <X size={13} /> Reject
        </button>
        <button
          onClick={onApprove}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-signal-teal px-4 py-2 text-xs font-semibold text-ink-950 disabled:opacity-60"
        >
          <Check size={13} /> Approve &amp; Release
        </button>
      </div>
    </div>
  );
}
