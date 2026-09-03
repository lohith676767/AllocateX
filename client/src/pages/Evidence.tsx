import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Flag, MapPin, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import EvidenceModal from '../components/EvidenceModal';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useApiErrorToast, useToast } from '../hooks/useToast';
import { api } from '../services/api';
import type { Milestone } from '../types';

export default function Evidence() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const projects = useQuery({ queryKey: ['projects'], queryFn: api.listProjects });
  const [target, setTarget] = useState<Milestone | null>(null);

  const review = useMutation({
    mutationFn: ({ evidenceId, status }: { evidenceId: string; status: 'REVIEWED' | 'FLAGGED' }) => api.reviewEvidence(evidenceId, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries();
      push(vars.status === 'REVIEWED' ? 'success' : 'error', vars.status === 'REVIEWED' ? 'Evidence reviewed' : 'Evidence flagged');
    },
    onError: (err) => onError(err, 'Review failed'),
  });

  const milestones = useMemo(() => {
    const list: { milestone: Milestone; projectName: string }[] = [];
    for (const p of projects.data ?? []) {
      for (const m of p.milestones ?? []) {
        list.push({ milestone: m, projectName: p.name });
      }
    }
    return list;
  }, [projects.data]);

  if (projects.isLoading) return <LoadingState label="Loading evidence…" />;
  if (projects.isError) return <ErrorState message="Could not load evidence." onRetry={() => projects.refetch()} />;

  const withEvidence = milestones.filter((m) => m.milestone.evidence);
  const withoutEvidence = milestones.filter((m) => !m.milestone.evidence);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Evidence"
        subtitle="Milestone evidence is human-reviewable, not automatically verified by computer vision or ML."
      />

      <div>
        <h2 className="mb-3 text-[13px] font-semibold text-stone-700">Submitted evidence</h2>
        {withEvidence.length === 0 ? (
          <EmptyState title="No evidence submitted yet" description="Attach evidence to a milestone from the Simulation page or the list below." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {withEvidence.map(({ milestone, projectName }) => (
              <div key={milestone.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] text-stone-500">{projectName}</p>
                    <p className="mt-0.5 text-[13px] font-medium text-stone-900">{milestone.name}</p>
                  </div>
                  <StatusBadge status={milestone.evidence!.reviewStatus} small />
                </div>
                <div className="mt-3 space-y-1.5 text-[11px] text-stone-500">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" /> {new Date(milestone.evidence!.timestamp).toLocaleString('en-IN')}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-emerald-500" /> {milestone.evidence!.simulatedLocation}
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <ShieldCheck size={12} className="shrink-0 text-emerald-500" /> {milestone.evidence!.filename}
                  </p>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-stone-500">{milestone.evidence!.description}</p>

                {milestone.evidence!.reviewStatus === 'SUBMITTED' && (
                  <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
                    <button
                      onClick={() => review.mutate({ evidenceId: milestone.evidence!.id, status: 'REVIEWED' })}
                      disabled={review.isPending}
                      className="flex items-center gap-1 rounded-md border border-emerald-200 px-2.5 py-1.5 text-[11.5px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                    >
                      <CheckCircle2 size={12} /> Mark Reviewed
                    </button>
                    <button
                      onClick={() => review.mutate({ evidenceId: milestone.evidence!.id, status: 'FLAGGED' })}
                      disabled={review.isPending}
                      className="flex items-center gap-1 rounded-md border border-stone-200 px-2.5 py-1.5 text-[11.5px] font-medium text-stone-600 hover:border-rose-200 hover:text-rose-700 disabled:opacity-60"
                    >
                      <Flag size={12} /> Flag
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {withoutEvidence.length > 0 && (
        <div>
          <h2 className="mb-3 text-[13px] font-semibold text-stone-700">Awaiting evidence</h2>
          <div className="card divide-y divide-stone-100 p-0">
            {withoutEvidence.map(({ milestone, projectName }) => (
              <div key={milestone.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-stone-900">{milestone.name}</p>
                  <p className="text-[11.5px] text-stone-500">{projectName}</p>
                </div>
                <button
                  onClick={() => setTarget(milestone)}
                  className="shrink-0 rounded-md border border-stone-200 px-2.5 py-1.5 text-[11.5px] font-medium text-stone-600 hover:border-accent-300 hover:text-accent-700"
                >
                  Attach evidence
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {target && <EvidenceModal milestone={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
