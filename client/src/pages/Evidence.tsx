import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, FileImage, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import EvidenceModal from '../components/EvidenceModal';
import PageHeader from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { api } from '../services/api';
import type { Milestone } from '../types';

export default function Evidence() {
  const projects = useQuery({ queryKey: ['projects'], queryFn: api.listProjects });
  const [target, setTarget] = useState<Milestone | null>(null);

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
  // Evidence can be attached to any milestone that doesn't have it yet, at any
  // point — it should never require first going through Simulation and
  // advancing a project's clock just to get a milestone off UPCOMING.
  const withoutEvidence = milestones.filter((m) => !m.milestone.evidence);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Evidence"
        subtitle="Milestone evidence is human-reviewable, not automatically verified by computer vision or ML."
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-mist-400">Submitted evidence</h2>
        {withEvidence.length === 0 ? (
          <EmptyState title="No evidence submitted yet" description="Attach evidence to a milestone from the Simulation page or the list below." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {withEvidence.map(({ milestone, projectName }) => (
              <div key={milestone.id} className="card p-4">
                <p className="text-xs text-mist-400">{projectName}</p>
                <p className="mt-0.5 text-sm font-medium text-mist-100">{milestone.name}</p>
                <div className="mt-3 space-y-1.5 text-[11px] text-mist-300">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-signal-teal" /> Timestamp: {new Date(milestone.evidence!.timestamp).toLocaleString('en-IN')}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-signal-teal" /> {milestone.evidence!.simulatedLocation}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <FileImage size={12} className="text-signal-teal" /> {milestone.evidence!.filename}
                  </p>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-mist-400">{milestone.evidence!.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {withoutEvidence.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-mist-400">Awaiting evidence</h2>
          <div className="card divide-y divide-ink-800 p-0">
            {withoutEvidence.map(({ milestone, projectName }) => (
              <div key={milestone.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-mist-100">{milestone.name}</p>
                  <p className="text-xs text-mist-400">{projectName}</p>
                </div>
                <button
                  onClick={() => setTarget(milestone)}
                  className="shrink-0 rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-mist-300 hover:border-signal-blue/40 hover:text-signal-blue"
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
