import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertOctagon,
  CheckCircle2,
  FastForward,
  FileImage,
  Rewind,
  SkipForward,
  StepForward,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuditFeed from '../components/AuditFeed';
import EvidenceModal from '../components/EvidenceModal';
import PageHeader from '../components/PageHeader';
import ProjectTimeline from '../components/ProjectTimeline';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import StatusBadge from '../components/StatusBadge';
import { useApiErrorToast, useToast } from '../hooks/useToast';
import { formatINR, formatPct } from '../lib/format';
import { api } from '../services/api';
import type { Milestone } from '../types';

export default function Simulation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const [evidenceTarget, setEvidenceTarget] = useState<Milestone | null>(null);

  const projects = useQuery({ queryKey: ['projects'], queryFn: api.listProjects });
  const project = useQuery({ queryKey: ['project', id], queryFn: () => api.getProject(id!), enabled: !!id });
  const audit = useQuery({ queryKey: ['audit'], queryFn: api.listAudit, refetchInterval: 4000 });

  const simulatable = useMemo(
    () => (projects.data ?? []).filter((p) => (p.milestones?.length ?? 0) > 0),
    [projects.data]
  );

  const invalidate = () => queryClient.invalidateQueries();

  const advance = useMutation({
    mutationFn: (months: number) => api.advanceSimulation(id!, months),
    onSuccess: (p) => {
      invalidate();
      push('info', `Clock advanced to Month ${p.currentSimulatedMonth}`);
    },
    onError: (err) => onError(err, 'Could not advance the clock'),
  });
  const rewind = useMutation({
    mutationFn: () => api.rewindSimulation(id!),
    onSuccess: invalidate,
    onError: (err) => onError(err, 'Could not rewind the clock'),
  });
  const jump = useMutation({
    mutationFn: () => api.jumpSimulation(id!),
    onSuccess: (p) => {
      invalidate();
      push('info', `Jumped to Month ${p.currentSimulatedMonth}`);
    },
    onError: (err) => onError(err, 'Could not jump to the next milestone'),
  });
  const completeMilestone = useMutation({
    mutationFn: (milestoneId: string) => api.completeMilestone(milestoneId),
    onSuccess: () => {
      invalidate();
      push('success', 'Milestone completed');
    },
    onError: (err) => onError(err, 'Could not complete milestone'),
  });
  const failMilestone = useMutation({
    mutationFn: () => api.failMilestone(id!),
    onSuccess: (p) => {
      invalidate();
      if (p.status === 'REALLOCATION_PROPOSED') {
        push('error', 'Milestone missed', 'Completion is below the salvage threshold — a reallocation has been proposed.');
      } else {
        push('error', 'Milestone missed', 'A salvage decision has been recorded.');
      }
    },
    onError: (err) => onError(err, 'Could not simulate failure'),
  });

  if (projects.isLoading) return <LoadingState label="Loading projects…" />;
  if (projects.isError) return <ErrorState message="Could not load projects." onRetry={() => projects.refetch()} />;

  const p = project.data;
  const currentMilestone = p?.milestones?.slice().sort((a, b) => a.order - b.order).find((m) => m.status === 'UPCOMING' || m.status === 'IN_PROGRESS');
  const busy = advance.isPending || rewind.isPending || jump.isPending || completeMilestone.isPending || failMilestone.isPending;
  const canAct = p?.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Simulation" subtitle="The judge controls the project clock directly — this is simulated time, never real elapsed time." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
        <div className="card max-h-[70vh] overflow-y-auto p-2">
          {simulatable.map((sp) => (
            <button
              key={sp.id}
              onClick={() => navigate(`/simulation/${sp.id}`)}
              className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors ${
                sp.id === id ? 'bg-signal-teal/10' : 'hover:bg-ink-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-xs font-medium ${sp.id === id ? 'text-signal-teal' : 'text-mist-200'}`}>{sp.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={sp.status} small />
                <span className="text-[10px] text-mist-400">M{sp.currentSimulatedMonth}</span>
              </div>
            </button>
          ))}
        </div>

        {!p ? (
          <EmptyState title="Select a project" description="Choose a project on the left to control its simulated timeline." />
        ) : (
          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-mist-100">{p.name}</h2>
                <p className="mt-0.5 text-xs text-mist-400">{p.region?.name}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>

            <div className="mt-4 flex items-center gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-mist-400">Simulated time</p>
                <p className="text-2xl font-bold tabular-nums text-mist-100">Month {p.currentSimulatedMonth}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-mist-400">Completion</p>
                <p className="text-2xl font-bold tabular-nums text-mist-100">{formatPct(p.completionPercentage)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-mist-400">Funding</p>
                <p className="text-2xl font-bold tabular-nums text-mist-100">
                  {formatINR(p.fundedAmount, { compact: true })} <span className="text-sm text-mist-400">/ {formatINR(p.requestedBudget, { compact: true })}</span>
                </p>
              </div>
            </div>

            {p.milestones && p.milestones.length > 0 && <ProjectTimeline milestones={p.milestones} currentMonth={p.currentSimulatedMonth} />}

            {currentMilestone && (
              <div className="mt-2 rounded-lg border border-ink-700 bg-ink-800/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-mist-100">Current milestone: {currentMilestone.name}</p>
                  <StatusBadge status={currentMilestone.status} small />
                </div>
                <div className="mt-2 flex items-center gap-6 text-xs text-mist-400">
                  <span>Due Month {currentMilestone.dueMonth}</span>
                  <span>{currentMilestone.type === 'EXTERNAL_DEPENDENCY' ? 'External dependency' : 'Self-controlled'}</span>
                  <span>Expected {formatPct(currentMilestone.expectedCompletion * 100)}</span>
                  {currentMilestone.actualCompletion !== null && <span>Actual {formatPct((currentMilestone.actualCompletion ?? 0) * 100)}</span>}
                </div>
                <button
                  onClick={() => setEvidenceTarget(currentMilestone)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-signal-blue hover:opacity-80"
                >
                  <FileImage size={13} /> Attach evidence
                </button>
              </div>
            )}

            {p.status === 'UNDER_REVIEW' && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-signal-amber/30 bg-signal-amber/5 px-4 py-3 text-xs text-signal-amber">
                <AlertOctagon size={14} />
                Paused for human review — no penalty has been applied. Resolve externally, then resume manually.
              </div>
            )}
            {p.status === 'REALLOCATION_PROPOSED' && (
              <button
                onClick={() => navigate('/reallocations')}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-signal-amber/40 bg-signal-amber/5 px-4 py-3 text-xs font-medium text-signal-amber hover:bg-signal-amber/10"
              >
                <AlertOctagon size={14} /> Reallocation proposed — review in Reallocations
              </button>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <ControlButton icon={Rewind} label="Previous Month" onClick={() => rewind.mutate()} disabled={busy || p.currentSimulatedMonth === 0} />
              <ControlButton icon={StepForward} label="Advance 1 Month" onClick={() => advance.mutate(1)} disabled={busy} />
              <ControlButton icon={FastForward} label="Advance 3 Months" onClick={() => advance.mutate(3)} disabled={busy} />
              <ControlButton icon={SkipForward} label="Jump to Next Milestone" onClick={() => jump.mutate()} disabled={busy} />
              <ControlButton
                icon={CheckCircle2}
                label="Complete Current Milestone"
                onClick={() => currentMilestone && completeMilestone.mutate(currentMilestone.id)}
                disabled={busy || !canAct || !currentMilestone}
                accent="teal"
              />
              <ControlButton
                icon={AlertOctagon}
                label="Simulate Failure"
                onClick={() => failMilestone.mutate()}
                disabled={busy || !canAct || !currentMilestone}
                accent="rose"
              />
            </div>
          </div>
        )}

        <div className="card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-mist-400">Live Event Feed</p>
          {audit.data && audit.data.length > 0 ? (
            <AuditFeed events={audit.data.slice(0, 40)} />
          ) : (
            <p className="text-xs text-mist-400">No events yet.</p>
          )}
        </div>
      </div>

      {evidenceTarget && <EvidenceModal milestone={evidenceTarget} onClose={() => setEvidenceTarget(null)} />}
    </div>
  );
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  accent,
}: {
  icon: typeof Rewind;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: 'teal' | 'rose';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        accent === 'teal'
          ? 'border-signal-teal/30 text-signal-teal hover:bg-signal-teal/10'
          : accent === 'rose'
            ? 'border-signal-rose/30 text-signal-rose hover:bg-signal-rose/10'
            : 'border-ink-600 text-mist-300 hover:bg-ink-800'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
