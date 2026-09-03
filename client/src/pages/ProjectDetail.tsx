import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ScoreBreakdown from '../components/ScoreBreakdown';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, LoadingState } from '../components/StateViews';
import { formatINR, formatPct } from '../lib/format';
import { api } from '../services/api';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = useQuery({ queryKey: ['project', id], queryFn: () => api.getProject(id!), enabled: !!id });

  if (project.isLoading) return <LoadingState label="Loading project…" />;
  if (project.isError || !project.data) return <ErrorState message="Could not load this project." onRetry={() => project.refetch()} />;

  const p = project.data;

  return (
    <div className="space-y-6 pb-10">
      <button onClick={() => navigate('/projects')} className="flex items-center gap-1.5 text-xs text-mist-400 hover:text-mist-100">
        <ArrowLeft size={13} /> Back to projects
      </button>

      <PageHeader
        title={p.name}
        subtitle={`${p.ngo?.name} · ${p.region?.name} · ${p.domain.replace('_', ' ')}`}
        actions={<StatusBadge status={p.status} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-4 p-6 lg:col-span-2">
          <p className="text-sm leading-relaxed text-mist-300">{p.description}</p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Requested" value={formatINR(p.requestedBudget, { compact: true })} />
            <Metric label="Funded" value={formatINR(p.fundedAmount, { compact: true })} />
            <Metric label="Completion" value={formatPct(p.completionPercentage)} />
            <Metric label="Sim. Month" value={`M${p.currentSimulatedMonth}`} />
          </div>

          {p.tiers && p.tiers.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mist-400">Funding tiers</p>
              <div className="space-y-2">
                {p.tiers
                  .sort((a, b) => a.order - b.order)
                  .map((t) => {
                    const funded = p.fundedAmount >= t.amount;
                    return (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-800/40 px-3 py-2 text-xs">
                        <span className={funded ? 'text-signal-teal' : 'text-mist-400'}>Tier {t.order}</span>
                        <span className="tabular-nums text-mist-300">
                          {formatINR(t.amount, { compact: true })} → {t.impact.toLocaleString('en-IN')} impact units
                        </span>
                        {funded && <StatusBadge status="RELEASED" small />}
                      </div>
                    );
                  })}
              </div>
              {!p.isConcave && (
                <p className="mt-2 text-[11px] text-signal-amber">
                  Marginal returns are non-concave for this project — it was funded via the lump-sum fallback method rather than
                  tier-by-tier marginal allocation.
                </p>
              )}
            </div>
          )}

          {p.milestones && p.milestones.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mist-400">Milestones</p>
              <div className="space-y-2">
                {p.milestones
                  .sort((a, b) => a.order - b.order)
                  .map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-800/40 px-3 py-2 text-xs">
                      <div>
                        <p className="text-mist-200">{m.name}</p>
                        <p className="text-[10px] text-mist-400">
                          Due M{m.dueMonth} · {m.type === 'EXTERNAL_DEPENDENCY' ? 'External dependency' : 'Self-controlled'}
                        </p>
                      </div>
                      <StatusBadge status={m.status} small />
                    </div>
                  ))}
              </div>
              <button
                onClick={() => navigate(`/simulation/${p.id}`)}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-signal-teal hover:opacity-80"
              >
                Open in Simulation <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {p.scoreBreakdown && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mist-400">Why was this project funded?</p>
              <ScoreBreakdown breakdown={p.scoreBreakdown} />
            </div>
          )}
          {p.lastSalvageDecision && (
            <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/5 p-4">
              <p className="text-xs font-semibold text-signal-amber">Last salvage decision: {p.lastSalvageDecision.replace('_', ' ')}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-mist-300">{p.lastSalvageReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-mist-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-mist-100">{value}</p>
    </div>
  );
}
