import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImpactBadge from '../components/ImpactBadge';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, LoadingState } from '../components/StateViews';
import { formatINR, formatScore } from '../lib/format';
import { api } from '../services/api';
import type { Project } from '../types';

const DOMAIN_FILTERS = ['ALL', 'HEALTHCARE', 'WATER_SANITATION', 'EDUCATION'];

type SortKey = 'requestedBudget' | 'fundedAmount' | 'finalScore' | 'impactPerRupee';
const SORT_LABEL: Record<SortKey, string> = {
  requestedBudget: 'Requested',
  fundedAmount: 'Funded',
  finalScore: 'Final Score',
  impactPerRupee: 'Impact / ₹',
};

export default function Projects() {
  const navigate = useNavigate();
  const projects = useQuery({ queryKey: ['projects'], queryFn: api.listProjects });
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null);

  const filtered = useMemo(() => {
    if (!projects.data) return [];
    let rows = domainFilter === 'ALL' ? projects.data : projects.data.filter((p) => p.domain === domainFilter);
    if (sort) {
      rows = [...rows].sort((a, b) => (sort.dir === 'asc' ? a[sort.key] - b[sort.key] : b[sort.key] - a[sort.key]));
    }
    return rows;
  }, [projects.data, domainFilter, sort]);

  const comparisonPair = useMemo(() => {
    if (!projects.data) return null;
    const winner = projects.data.find((p) => p.isComparisonHighlight === 'FAIRFILL_WINNER');
    const baseline = projects.data.find((p) => p.isComparisonHighlight === 'IMPACT_ONLY');
    if (!winner || !baseline) return null;
    return { winner, baseline };
  }, [projects.data]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'desc' };
      if (prev.dir === 'desc') return { key, dir: 'asc' };
      return null;
    });
  };

  if (projects.isLoading) return <LoadingState label="Loading projects…" />;
  if (projects.isError) return <ErrorState message="Could not load projects." onRetry={() => projects.refetch()} />;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Projects" subtitle="Every project's score is fully explainable — impact, trust, underservice and equity." />

      {comparisonPair && (
        <div className="card border-accent-200 p-6">
          <p className="label-caps text-accent-600">Why FairFill is different</p>
          <p className="mt-1 text-[12.5px] text-stone-600">
            {comparisonPair.baseline.name} has higher raw impact, but {comparisonPair.winner.name} wins on final score
            because of much higher underservice and geographical equity.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[comparisonPair.baseline, comparisonPair.winner].map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="rounded-lg border border-stone-200 p-4 text-left hover:border-accent-300"
              >
                <p className="text-[13px] font-medium text-stone-900">{p.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11.5px] text-stone-500">
                  <span>
                    Raw impact/₹1L: <b className="text-stone-800">{formatScore((p.impactUnits / p.requestedBudget) * 100000)}</b>
                  </span>
                  <span>
                    Underservice: <b className="text-stone-800">{(p.underserviceScore * 100).toFixed(0)}%</b>
                  </span>
                  <span>
                    Equity: <b className="text-stone-800">{(p.equityScore * 100).toFixed(0)}%</b>
                  </span>
                  <span>
                    Final score: <b className="text-accent-600">{formatScore(p.finalScore)}</b>
                  </span>
                </div>
                <div className="mt-2.5">
                  <ImpactBadge score={p.finalScore} small />
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
            className={`rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
              domainFilter === d ? 'border-accent-200 bg-accent-50 text-accent-700' : 'border-stone-200 text-stone-500 hover:text-stone-800'
            }`}
          >
            {d === 'ALL' ? 'All domains' : d.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-stone-200 text-[10.5px] uppercase tracking-wider text-stone-400">
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">NGO</th>
              <th className="px-4 py-3 font-medium">Region</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              {(['requestedBudget', 'fundedAmount', 'finalScore', 'impactPerRupee'] as SortKey[]).map((key) => (
                <th key={key} className="px-4 py-3 text-right font-medium">
                  <button onClick={() => toggleSort(key)} className="ml-auto flex items-center gap-1 hover:text-stone-700">
                    {SORT_LABEL[key]}
                    {sort?.key === key ? (
                      sort.dir === 'desc' ? (
                        <ArrowDown size={11} />
                      ) : (
                        <ArrowUp size={11} />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="opacity-40" />
                    )}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Impact</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <ProjectRow key={p.id} p={p} onClick={() => navigate(`/projects/${p.id}`)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectRow({ p, onClick }: { p: Project; onClick: () => void }) {
  return (
    <tr onClick={onClick} className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-stone-50">
      <td className="px-4 py-3">
        <p className="font-medium text-stone-900">{p.name}</p>
      </td>
      <td className="px-4 py-3 text-stone-600">{p.ngo?.name}</td>
      <td className="px-4 py-3 text-stone-600">{p.region?.name}</td>
      <td className="px-4 py-3 text-stone-500">{p.domain.replace('_', ' ')}</td>
      <td className="px-4 py-3 text-right tabular-nums text-stone-700">{formatINR(p.requestedBudget, { compact: true })}</td>
      <td className="px-4 py-3 text-right tabular-nums text-stone-700">{formatINR(p.fundedAmount, { compact: true })}</td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold text-accent-600">{formatScore(p.finalScore)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-stone-700">
        {formatScore((p.impactUnits / p.requestedBudget) * 100000)}
      </td>
      <td className="px-4 py-3">
        <ImpactBadge score={p.finalScore} small />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={p.status} small />
      </td>
    </tr>
  );
}
