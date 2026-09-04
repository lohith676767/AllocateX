import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import ImpactBadge from '../components/ImpactBadge';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useApiErrorToast, useToast } from '../hooks/useToast';
import { formatINR, formatScore } from '../lib/format';
import { api } from '../services/api';

export default function Allocations() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const allocations = useQuery({ queryKey: ['allocations'], queryFn: api.listAllocations });

  const invalidate = () => queryClient.invalidateQueries();

  const approve = useMutation({
    mutationFn: api.approveAllocation,
    onSuccess: () => {
      invalidate();
      push('success', 'Allocation approved', 'Funds released to the project.');
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
  const busy = approve.isPending || reject.isPending;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Allocations" subtitle="Every proposed allocation requires explicit human approval before funds move." />

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-stone-700">
          Pending approval
          {proposed.length > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">{proposed.length}</span>
          )}
        </h2>
        {proposed.length === 0 ? (
          <EmptyState title="Nothing pending" description="Generate an allocation to produce proposals, or all proposals have already been resolved." />
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-stone-200 text-[10.5px] uppercase tracking-wider text-stone-400">
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Region</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">FairFill Score</th>
                  <th className="px-4 py-3 font-medium">Impact</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proposed.map((a) => (
                  <tr key={a.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-900">{a.project?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{a.region?.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-stone-700">{formatINR(a.amount, { compact: true })}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-accent-600">{formatScore(a.score)}</td>
                    <td className="px-4 py-3">
                      <ImpactBadge score={a.score} small />
                    </td>
                    <td className="max-w-xs px-4 py-3 text-[11.5px] leading-snug text-stone-500">{a.reason}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => approve.mutate(a.id)}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-md bg-accent-600 px-2.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          onClick={() => reject.mutate(a.id)}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-md border border-stone-200 px-2.5 py-1.5 text-[11.5px] font-medium text-stone-600 hover:border-rose-200 hover:text-rose-700 disabled:opacity-60"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-[13px] font-semibold text-stone-700">History</h2>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-stone-200 text-[10.5px] uppercase tracking-wider text-stone-400">
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Region</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Impact</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {resolved.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[12px] text-stone-400">
                    No resolved allocations yet.
                  </td>
                </tr>
              )}
              {resolved.map((a) => (
                <tr key={a.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 text-stone-900">{a.project?.name}</td>
                  <td className="px-4 py-3 text-stone-600">{a.region?.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-700">{formatINR(a.amount, { compact: true })}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-accent-600">{formatScore(a.score)}</td>
                  <td className="px-4 py-3">
                    <ImpactBadge score={a.score} small />
                  </td>
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
