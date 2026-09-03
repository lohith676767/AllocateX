import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ScoreBreakdown from '../components/ScoreBreakdown';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { clockTime, formatINR, formatPct } from '../lib/format';
import { api } from '../services/api';

const TABS = ['Funding', 'Milestones', 'Impact', 'Evidence', 'Audit'] as const;
type Tab = (typeof TABS)[number];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Funding');
  const project = useQuery({ queryKey: ['project', id], queryFn: () => api.getProject(id!), enabled: !!id });
  const audit = useQuery({ queryKey: ['audit'], queryFn: api.listAudit, enabled: tab === 'Audit' });

  if (project.isLoading) return <LoadingState label="Loading project…" />;
  if (project.isError || !project.data) return <ErrorState message="Could not load this project." onRetry={() => project.refetch()} />;

  const p = project.data;
  const projectAudit = (audit.data ?? []).filter((e) => e.details.includes(`"${p.name}"`));

  return (
    <div className="space-y-6 pb-10">
      <button onClick={() => navigate('/projects')} className="flex items-center gap-1.5 text-[12px] text-stone-500 hover:text-stone-900">
        <ArrowLeft size={13} /> Back to projects
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-stone-900">{p.name}</h1>
          <p className="mt-1 text-[12.5px] text-stone-500">
            {p.ngo?.name} · {p.region?.name} · {p.domain.replace('_', ' ')}
          </p>
        </div>
        <StatusBadge status={p.status} />
      </div>

      <div className="card flex flex-wrap">
        <div className="flex flex-col gap-1 border-r border-stone-200 px-5 py-4">
          <span className="label-caps">Funding</span>
          <span className="text-[20px] font-semibold tabular-nums text-stone-900">{formatINR(p.fundedAmount, { compact: true })}</span>
        </div>
        <div className="flex flex-col gap-1 border-r border-stone-200 px-5 py-4">
          <span className="label-caps">FairFill score</span>
          <span className="text-[20px] font-semibold tabular-nums text-accent-600">{p.finalScore.toFixed(1)}</span>
        </div>
        <div className="flex flex-col gap-1 border-r border-stone-200 px-5 py-4">
          <span className="label-caps">Completion</span>
          <span className="text-[20px] font-semibold tabular-nums text-stone-900">{formatPct(p.completionPercentage)}</span>
        </div>
        <div className="flex flex-col gap-1 px-5 py-4">
          <span className="label-caps">Simulated month</span>
          <span className="text-[20px] font-semibold tabular-nums text-stone-900">M{p.currentSimulatedMonth}</span>
        </div>
      </div>

      <div className="flex gap-1 border-b border-stone-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-[12.5px] font-medium transition-colors ${
              tab === t ? 'border-accent-600 text-accent-700' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Funding' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card space-y-4 p-6 lg:col-span-2">
            <p className="text-[13px] leading-relaxed text-stone-600">{p.description}</p>
            {p.tiers && p.tiers.length > 0 && (
              <div>
                <p className="label-caps mb-2">Funding tiers</p>
                <div className="space-y-2">
                  {p.tiers
                    .sort((a, b) => a.order - b.order)
                    .map((t) => {
                      const funded = p.fundedAmount >= t.amount;
                      return (
                        <div key={t.id} className="flex items-center justify-between rounded-md border border-stone-200 px-3 py-2 text-[12px]">
                          <span className={funded ? 'font-medium text-accent-700' : 'text-stone-500'}>Tier {t.order}</span>
                          <span className="tabular-nums text-stone-600">
                            {formatINR(t.amount, { compact: true })} → {t.impact.toLocaleString('en-IN')} impact units
                          </span>
                          {funded && <StatusBadge status="RELEASED" small />}
                        </div>
                      );
                    })}
                </div>
                {!p.isConcave && (
                  <p className="mt-2 text-[11.5px] text-amber-700">
                    Marginal returns are non-concave for this project — it was funded via the lump-sum fallback method
                    rather than tier-by-tier marginal allocation.
                  </p>
                )}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-[12px]">
              <span className="text-stone-500">Requested</span>
              <span className="tabular-nums text-stone-900">{formatINR(p.requestedBudget)}</span>
            </div>
          </div>
          <div className="space-y-4">
            {p.scoreBreakdown && <ScoreBreakdown breakdown={p.scoreBreakdown} />}
            {p.lastSalvageDecision && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-[12px] font-semibold text-amber-800">Last salvage decision: {p.lastSalvageDecision.replace('_', ' ')}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-stone-600">{p.lastSalvageReason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Milestones' && (
        <div className="card p-6">
          {p.milestones && p.milestones.length > 0 ? (
            <div className="space-y-2">
              {p.milestones
                .sort((a, b) => a.order - b.order)
                .map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-md border border-stone-200 px-3.5 py-2.5 text-[12.5px]">
                    <div>
                      <p className="text-stone-800">{m.name}</p>
                      <p className="text-[11px] text-stone-400">
                        Due M{m.dueMonth} · {m.type === 'EXTERNAL_DEPENDENCY' ? 'External dependency' : 'Self-controlled'}
                      </p>
                    </div>
                    <StatusBadge status={m.status} small />
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState title="No milestones on this project" />
          )}
          <button
            onClick={() => navigate(`/simulation/${p.id}`)}
            className="mt-4 flex items-center gap-1.5 text-[12.5px] font-medium text-accent-600 hover:opacity-80"
          >
            Open in Simulation <ArrowRight size={12} />
          </button>
        </div>
      )}

      {tab === 'Impact' && (
        <div className="card grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
          <div>
            <span className="label-caps">Impact units</span>
            <p className="mt-1 text-[20px] font-semibold tabular-nums text-stone-900">{p.impactUnits.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <span className="label-caps">Impact / ₹1L requested</span>
            <p className="mt-1 text-[20px] font-semibold tabular-nums text-stone-900">
              {((p.impactUnits / p.requestedBudget) * 100000).toFixed(1)}
            </p>
          </div>
          <div>
            <span className="label-caps">Underservice</span>
            <p className="mt-1 text-[20px] font-semibold tabular-nums text-rose-600">{formatPct(p.underserviceScore * 100)}</p>
          </div>
          <div>
            <span className="label-caps">Geographical equity</span>
            <p className="mt-1 text-[20px] font-semibold tabular-nums text-emerald-600">{formatPct(p.equityScore * 100)}</p>
          </div>
        </div>
      )}

      {tab === 'Evidence' && (
        <div className="space-y-3">
          {(p.milestones ?? []).filter((m) => m.evidence).length === 0 ? (
            <EmptyState title="No evidence submitted yet" description="Attach evidence to a milestone from the Simulation page." />
          ) : (
            (p.milestones ?? [])
              .filter((m) => m.evidence)
              .map((m) => (
                <div key={m.id} className="card p-4">
                  <p className="text-[13px] font-medium text-stone-900">{m.name}</p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" /> {new Date(m.evidence!.timestamp).toLocaleString('en-IN')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-emerald-500" /> {m.evidence!.simulatedLocation}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileCheck2 size={12} className="text-emerald-500" /> {m.evidence!.filename}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-stone-600">{m.evidence!.description}</p>
                </div>
              ))
          )}
        </div>
      )}

      {tab === 'Audit' && (
        <div className="card divide-y divide-stone-100 p-0">
          {audit.isLoading ? (
            <LoadingState label="Loading audit trail…" />
          ) : projectAudit.length === 0 ? (
            <EmptyState title="No audit events for this project yet" />
          ) : (
            projectAudit.map((e) => (
              <div key={e.id} className="px-4 py-3">
                <div className="flex items-center gap-2 font-mono text-[10.5px]">
                  <span className="text-stone-400">{clockTime(e.timestamp)}</span>
                  <span className="font-semibold text-accent-600">{e.event}</span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-stone-600">{e.details}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
