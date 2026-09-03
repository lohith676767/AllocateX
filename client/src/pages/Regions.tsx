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
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-stone-200 text-[10.5px] uppercase tracking-wider text-stone-400">
              <th className="px-4 py-3 font-medium">Region</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 text-right font-medium">Underservice</th>
              <th className="px-4 py-3 text-right font-medium">Equity</th>
              <th className="px-4 py-3 text-right font-medium">Regional Cap</th>
              <th className="px-4 py-3 text-right font-medium">Allocated</th>
            </tr>
          </thead>
          <tbody>
            {regions.data!.map((r) => (
              <tr
                key={r.id}
                onClick={() => navigate(`/regions/${r.id}`)}
                className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-stone-50"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-900">{r.name}</p>
                  <p className="text-[11.5px] text-stone-500">{r.state}</p>
                </td>
                <td className="px-4 py-3 text-stone-600">{r.domain.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-700">{formatPct(r.underserviceScore * 100)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-700">{formatPct(r.geographicalEquityScore * 100)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                  {r.budgetCap !== null ? formatINR(r.budgetCap, { compact: true }) : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-700">{formatINR(r.allocatedAmount, { compact: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
