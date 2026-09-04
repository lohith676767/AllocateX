import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Check, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useApiErrorToast, useToast } from '../hooks/useToast';
import { formatINR, formatPct, formatScore } from '../lib/format';
import { api } from '../services/api';
import type { Reallocation } from '../types';

export default function Reallocations() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const reallocations = useQuery({ queryKey: ['reallocations'], queryFn: api.listReallocations });
  // A project whose salvage decision was REALLOCATE but that never reached
  // REALLOCATION_PROPOSED has no eligible destination — it stays parked at
  // MILESTONE_MISSED. The empty state below must explain that, not just show
  // "nothing here", since the reason it stalled is real governance information.
  const projects = useQuery({ queryKey: ['projects'], queryFn: api.listProjects });
  const stuckProjects = (projects.data ?? []).filter((p) => p.status === 'MILESTONE_MISSED' && p.lastSalvageDecision === 'REALLOCATE');

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

      {stuckProjects.length > 0 && (
        <div className="space-y-3">
          {stuckProjects.map((p) => (
            <div key={p.id} className="card flex items-start gap-3 border-amber-200 bg-amber-50/40 p-4">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-[13px] font-semibold text-stone-900">
                  {p.name} — salvage recommended reallocation, but none could be proposed
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-stone-600">{p.lastSalvageReason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {proposed.length === 0 ? (
        stuckProjects.length === 0 && (
          <EmptyState
            title="No reallocations proposed"
            description="A reallocation is proposed automatically when a self-controlled milestone misses its target and completion falls below the salvage threshold."
          />
        )
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
          <h2 className="mb-3 text-[13px] font-semibold text-stone-700">History</h2>
          <div className="card divide-y divide-stone-100 p-0">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-4 py-3 text-[13px]">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-stone-800">{r.sourceProject?.name}</span>
                  <ArrowRight size={12} className="shrink-0 text-stone-400" />
                  <span className="truncate text-stone-800">{r.destinationProject?.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-[12px] tabular-nums text-stone-500">{formatINR(r.amount, { compact: true })}</span>
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
  const [reviewed, setReviewed] = useState(false);
  const completion = r.sourceProject?.completionPercentage ?? 0;
  const threshold = (r.sourceProject?.salvageThreshold ?? 0.6) * 100;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-rose-100 bg-rose-50/50 px-6 py-4">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-rose-600">Milestone missed</p>
        <p className="mt-1 text-[15px] font-semibold text-stone-900">{r.sourceProject?.name}</p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-stone-600">
          <span>
            Cause: <span className="font-medium text-stone-800">Self-controlled</span>
          </span>
          <span>
            Completion: <span className="font-medium text-rose-600">{formatPct(completion)}</span>
          </span>
          <span>
            Salvage threshold: <span className="font-medium text-stone-800">{formatPct(threshold)}</span>
          </span>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">Recommendation</span>
          <span className="text-[13px] font-semibold text-stone-900">Reallocation proposed</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10.5px] font-medium text-stone-500">
          {['Failed Project', 'Remaining Funds', 'Eligible Destination', 'Destination Score', 'Human Approval', 'Release'].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-1.5">
                <span
                  className={`rounded-full border px-2 py-0.5 ${
                    i === 4 ? 'border-accent-300 bg-accent-50 text-accent-700' : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {step}
                </span>
                {i < arr.length - 1 && <span className="text-stone-300">→</span>}
              </span>
            )
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 rounded-lg border border-stone-200 bg-stone-50/60 p-4">
          <div className="min-w-[140px]">
            <p className="label-caps">Source</p>
            <p className="text-[13px] font-medium text-stone-900">{r.sourceProject?.name}</p>
            <p className="text-[16px] font-semibold tabular-nums text-stone-900">{formatINR(r.amount, { compact: true })} remaining</p>
          </div>
          <ArrowRight size={16} className="shrink-0 text-stone-400" />
          <div className="min-w-[140px]">
            <p className="label-caps">Reallocated</p>
            <p className="text-[16px] font-semibold tabular-nums text-accent-600">{formatINR(r.amount, { compact: true })}</p>
          </div>
          <ArrowRight size={16} className="shrink-0 text-stone-400" />
          <div className="min-w-[140px]">
            <p className="label-caps">Candidate</p>
            <p className="text-[13px] font-medium text-stone-900">{r.destinationProject?.name}</p>
            <p className="text-[12px] tabular-nums text-emerald-600">FairFill Score {formatScore(r.destinationScore)}</p>
          </div>
        </div>

        {!reviewed ? (
          <button
            onClick={() => setReviewed(true)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-stone-200 py-2.5 text-[12.5px] font-medium text-stone-700 hover:bg-stone-50"
          >
            Review Proposal <ChevronDown size={14} />
          </button>
        ) : (
          <>
            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50/40 p-3.5">
              <p className="label-caps mb-1">Reason</p>
              <p className="text-[12.5px] leading-relaxed text-stone-600">{r.reason}</p>
            </div>
            <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50/40 p-3.5">
              <p className="label-caps mb-1">Why this destination</p>
              <p className="text-[12.5px] leading-relaxed text-stone-600">{r.explanation}</p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onReject}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-md border border-stone-200 px-4 py-2 text-[12.5px] font-medium text-stone-600 hover:border-rose-200 hover:text-rose-700 disabled:opacity-60"
              >
                <X size={13} /> Reject
              </button>
              <button
                onClick={onApprove}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-md bg-accent-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
              >
                <Check size={13} /> Approve Reallocation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
