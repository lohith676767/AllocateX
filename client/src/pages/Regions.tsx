import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import EquityMap from '../components/EquityMap';
import PageHeader from '../components/PageHeader';
import { ErrorState, LoadingState } from '../components/StateViews';
import { formatINR, formatPct } from '../lib/format';
import { api } from '../services/api';

export default function Regions() {
  const navigate = useNavigate();
  const regions = useQuery({ queryKey: ['regions'], queryFn: api.listRegions });

  if (regions.isLoading) return <LoadingState label="Loading regions…" />;
  if (regions.isError) return <ErrorState message="Could not load regions." onRetry={() => regions.refetch()} />;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Regions" subtitle="Structural fairness and evidence-based need, by region." />

      <EquityMap regions={regions.data!} />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-700 text-[11px] uppercase tracking-wider text-mist-400">
              <th className="px-4 py-3 font-medium">Region</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Underservice</th>
              <th className="px-4 py-3 font-medium">Equity</th>
              <th className="px-4 py-3 font-medium">Regional Cap</th>
              <th className="px-4 py-3 font-medium">Allocated</th>
            </tr>
          </thead>
          <tbody>
            {regions.data!.map((r) => (
              <tr
                key={r.id}
                onClick={() => navigate(`/regions/${r.id}`)}
                className="cursor-pointer border-b border-ink-800 last:border-0 hover:bg-ink-800/50"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-mist-100">{r.name}</p>
                  <p className="text-xs text-mist-400">{r.state}</p>
                </td>
                <td className="px-4 py-3 text-mist-300">{r.domain.replace('_', ' ')}</td>
                <td className="px-4 py-3 tabular-nums text-mist-300">{formatPct(r.underserviceScore * 100)}</td>
                <td className="px-4 py-3 tabular-nums text-mist-300">{formatPct(r.geographicalEquityScore * 100)}</td>
                <td className="px-4 py-3 tabular-nums text-mist-300">{r.budgetCap !== null ? formatINR(r.budgetCap, { compact: true }) : '—'}</td>
                <td className="px-4 py-3 tabular-nums text-mist-300">{formatINR(r.allocatedAmount, { compact: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
