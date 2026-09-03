import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useApiErrorToast, useToast } from '../hooks/useToast';
import { formatINR, formatScore } from '../lib/format';
import { api } from '../services/api';
import type { Allocation } from '../types';

export default function Allocations() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const allocations = useQuery({ queryKey: ['allocations'], queryFn: api.listAllocations });

  const invalidate = () => queryClient.invalidateQueries();

  const approve = useMutation({
    mutationFn: api.approveAllocation,
    onSuccess: (_, id) => {
      invalidate();
      push('success', 'Allocation approved', 'Funds released to the project.');
      void id;
    },
    onError: (err) => onError(err, 'Approval failed'),
  });

  const reject = useMutation({
    mutationFn: api.rejectAllocation,
    onSuccess: () => {
      invalidate();
      push('info', 'Allocation rejected');
    },
    onError: (err) => onError(err, 'Rejection failed'),
  });

  if (allocations.isLoading) return <LoadingState label="Loading allocations…" />;
  if (allocations.isError) return <ErrorState message="Could not load allocations." onRetry={() => allocations.refetch()} />;

  const rows = allocations.data!;
  const proposed = rows.filter((a) => a.status === 'PROPOSED');
  const resolved = rows.filter((a) => a.status !== 'PROPOSED');

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Allocations" subtitle="Every proposed allocation requires explicit human approval before funds move." />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-mist-400">
          Pending approval {proposed.length > 0 && <span className="text-signal-amber">({proposed.length})</span>}
        </h2>
        {proposed.length === 0 ? (
          <EmptyState title="Nothing pending" description="Run FairFill to generate proposed allocations, or all proposals have already been resolved." />
        ) : (
          <div className="space-y-3">
            {proposed.map((a) => (
              <AllocationRow
                key={a.id}
                a={a}
                onApprove={() => approve.mutate(a.id)}
                onReject={() => reject.mutate(a.id)}
                busy={approve.isPending || reject.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-mist-400">History</h2>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-[11px] uppercase tracking-wider text-mist-400">
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Region</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map((a) => (
                <tr key={a.id} className="border-b border-ink-800 last:border-0">
                  <td className="px-4 py-3 text-mist-100">{a.project?.name}</td>
                  <td className="px-4 py-3 text-mist-300">{a.region?.name}</td>
                  <td className="px-4 py-3 tabular-nums text-mist-300">{formatINR(a.amount, { compact: true })}</td>
                  <td className="px-4 py-3 tabular-nums text-signal-teal">{formatScore(a.score)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} small />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AllocationRow({
  a,
  onApprove,
  onReject,
  busy,
}: {
  a: Allocation;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  return (
    <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-mist-100">{a.project?.name}</p>
        <p className="mt-0.5 text-xs text-mist-400">{a.region?.name}</p>
        <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-mist-400">{a.reason}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-mist-100">{formatINR(a.amount, { compact: true })}</p>
          <p className="text-[11px] tabular-nums text-signal-teal">score {formatScore(a.score)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg bg-signal-teal px-3 py-1.5 text-xs font-semibold text-ink-950 disabled:opacity-60"
          >
            <Check size={13} /> Approve
          </button>
          <button
            onClick={onReject}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-mist-300 hover:border-signal-rose/40 hover:text-signal-rose disabled:opacity-60"
          >
            <X size={13} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}
