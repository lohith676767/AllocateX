import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, LoadingState } from '../components/StateViews';
import { formatINR, formatScore } from '../lib/format';
import { api } from '../services/api';

const DOMAIN_FILTERS = ['ALL', 'HEALTHCARE', 'WATER_SANITATION', 'EDUCATION'];

export default function Projects() {
  const navigate = useNavigate();
  const projects = useQuery({ queryKey: ['projects'], queryFn: api.listProjects });
  const [domainFilter, setDomainFilter] = useState('ALL');

  const filtered = useMemo(() => {
    if (!projects.data) return [];
    if (domainFilter === 'ALL') return projects.data;
    return projects.data.filter((p) => p.domain === domainFilter);
  }, [projects.data, domainFilter]);

  const comparisonPair = useMemo(() => {
    if (!projects.data) return null;
    const winner = projects.data.find((p) => p.isComparisonHighlight === 'FAIRFILL_WINNER');
    const baseline = projects.data.find((p) => p.isComparisonHighlight === 'IMPACT_ONLY');
    if (!winner || !baseline) return null;
    return { winner, baseline };
  }, [projects.data]);

  if (projects.isLoading) return <LoadingState label="Loading projects…" />;
  if (projects.isError) return <ErrorState message="Could not load projects." onRetry={() => projects.refetch()} />;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Projects" subtitle="Every project's score is fully explainable — impact, trust, underservice and equity." />

      {comparisonPair && (
        <div className="card border-signal-violet/30 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-signal-violet">Why FairFill is different</p>
          <p className="mt-1 text-xs text-mist-400">
            {comparisonPair.baseline.name} has higher raw impact, but {comparisonPair.winner.name} wins on final score because of
            much higher underservice and geographical equity.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[comparisonPair.baseline, comparisonPair.winner].map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="rounded-lg border border-ink-700 bg-ink-800/40 p-4 text-left hover:border-signal-teal/40"
              >
                <p className="text-sm font-medium text-mist-100">{p.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-mist-400">
                  <span>Raw impact/₹1L: <b className="text-mist-200">{formatScore((p.impactUnits / p.requestedBudget) * 100000)}</b></span>
                  <span>Underservice: <b className="text-mist-200">{(p.underserviceScore * 100).toFixed(0)}%</b></span>
                  <span>Equity: <b className="text-mist-200">{(p.equityScore * 100).toFixed(0)}%</b></span>
                  <span>Final score: <b className="text-signal-teal">{formatScore(p.finalScore)}</b></span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {DOMAIN_FILTERS.map((d) => (
          <button
            key={d}
            onClick={() => setDomainFilter(d)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              domainFilter === d ? 'border-signal-teal/40 bg-signal-teal/10 text-signal-teal' : 'border-ink-700 text-mist-400 hover:text-mist-200'
            }`}
          >
            {d === 'ALL' ? 'All domains' : d.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-700 text-[11px] uppercase tracking-wider text-mist-400">
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Region</th>
              <th className="px-4 py-3 font-medium">Funded / Requested</th>
              <th className="px-4 py-3 font-medium">Final Score</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="cursor-pointer border-b border-ink-800 last:border-0 hover:bg-ink-800/50"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-mist-100">{p.name}</p>
                  <p className="text-xs text-mist-400">{p.ngo?.name}</p>
                </td>
                <td className="px-4 py-3 text-mist-300">{p.region?.name}</td>
                <td className="px-4 py-3 tabular-nums text-mist-300">
                  {formatINR(p.fundedAmount, { compact: true })} / {formatINR(p.requestedBudget, { compact: true })}
                </td>
                <td className="px-4 py-3 tabular-nums font-medium text-signal-teal">{formatScore(p.finalScore)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} small />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
