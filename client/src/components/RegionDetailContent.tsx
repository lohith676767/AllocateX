import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import PageHeader from './PageHeader';
import StatusBadge from './StatusBadge';
import { ErrorState, LoadingState } from './StateViews';
import { formatINR, formatPct } from '../lib/format';
import { api } from '../services/api';

function historicalFundingLabel(equityScore: number): string {
  if (equityScore >= 0.66) return 'Low relative to need';
  if (equityScore >= 0.33) return 'Moderate relative to need';
  return 'High relative to need';
}

/**
 * The actual region-detail UI (score panels, evidence breakdown, project
 * list) as a standalone piece — used both by the full-page /regions/:id
 * route and by the map drawer on the Regions page, so there is exactly one
 * implementation of "what a region's detail view looks like".
 */
export default function RegionDetailContent({
  regionId,
  onNavigate,
  compact = false,
}: {
  regionId: string;
  onNavigate?: () => void;
  /** Use a single-column layout — for narrow contexts like the drawer, where a
   * viewport-width `lg:` breakpoint would otherwise turn on a two-column grid
   * regardless of how narrow the panel actually is. */
  compact?: boolean;
}) {
  const region = useQuery({ queryKey: ['region', regionId], queryFn: () => api.getRegion(regionId), enabled: !!regionId });

  if (region.isLoading) return <LoadingState label="Loading region…" />;
  if (region.isError || !region.data) return <ErrorState message="Could not load this region." onRetry={() => region.refetch()} />;

  const r = region.data;
  const under = r.underserviceExplanation;
  const equity = r.equityExplanation;

  return (
    <div className="space-y-6">
      <PageHeader
        title={r.name}
        subtitle={`${r.state} · ${r.domain.replace('_', ' ')} · Population ${r.population.toLocaleString('en-IN')} · Peer group: ${r.peerGroup}`}
      />

      <div className="card flex flex-wrap">
        <div className="flex flex-col gap-1 border-r border-stone-200 px-5 py-4">
          <span className="label-caps">Need index</span>
          <span className="text-[20px] font-semibold tabular-nums text-stone-900">{r.needIndex}</span>
        </div>
        <div className="flex flex-col gap-1 border-r border-stone-200 px-5 py-4">
          <span className="label-caps">Historical CSR / need</span>
          <span className="text-[15px] font-semibold text-stone-900">{historicalFundingLabel(r.geographicalEquityScore)}</span>
        </div>
        <div className="flex flex-col gap-1 border-r border-stone-200 px-5 py-4">
          <span className="label-caps">FairFill allocation</span>
          <span className="text-[20px] font-semibold tabular-nums text-stone-900">{formatINR(r.allocatedAmount, { compact: true })}</span>
        </div>
        <div className="flex flex-col gap-1 border-r border-stone-200 px-5 py-4">
          <span className="label-caps">Equity gap</span>
          <span className={`text-[20px] font-semibold tabular-nums ${(equity?.relativeFundingGapPct ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {(equity?.relativeFundingGapPct ?? 0) >= 0 ? '+' : ''}
            {formatPct(equity?.relativeFundingGapPct ?? 0)}
          </span>
        </div>
        <div className="flex flex-col gap-1 px-5 py-4">
          <span className="label-caps">Projects</span>
          <span className="text-[20px] font-semibold tabular-nums text-stone-900">{r.projects?.length ?? 0}</span>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${compact ? '' : 'lg:grid-cols-2'}`}>
        <div className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[13.5px] font-semibold text-stone-900">Why this underservice score?</h2>
            <span className="text-[22px] font-semibold tabular-nums text-rose-600">{formatPct((under?.score ?? r.underserviceScore) * 100)}</span>
          </div>
          <p className="mt-1 text-[12px] text-stone-500">
            Calculated mathematically from authoritative indicator evidence — never self-reported by NGOs.
          </p>
          <div className="mt-4 space-y-3">
            {(under?.contributors ?? []).map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-stone-600">{indicatorLabel(c.key)}</span>
                  <span className="tabular-nums text-stone-400">
                    {c.regionalValue} / benchmark {c.benchmarkValue} → gap {formatPct(c.gap * 100)}
                  </span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-rose-400" style={{ width: `${c.gap * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[13.5px] font-semibold text-stone-900">Why this geographical equity score?</h2>
            <span className="text-[22px] font-semibold tabular-nums text-accent-600">{formatPct((equity?.score ?? r.geographicalEquityScore) * 100)}</span>
          </div>
          <p className="mt-1 text-[12px] text-stone-500">
            Funding relative to need, compared against the peer-group average — not simply "less money in, more money out".
          </p>
          <dl className="mt-4 space-y-2.5 text-[12px]">
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <dt className="text-stone-500">Historical CSR / need (this region)</dt>
              <dd className="tabular-nums text-stone-900">₹{Math.round(equity?.fundingPerNeed ?? 0).toLocaleString('en-IN')}</dd>
            </div>
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <dt className="text-stone-500">Peer-group average</dt>
              <dd className="tabular-nums text-stone-900">₹{Math.round(equity?.peerAverageFundingPerNeed ?? 0).toLocaleString('en-IN')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Relative funding gap</dt>
              <dd className={`tabular-nums font-semibold ${(equity?.relativeFundingGapPct ?? 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {(equity?.relativeFundingGapPct ?? 0) > 0 ? 'Underfunded by ' : 'Overfunded by '}
                {formatPct(Math.abs(equity?.relativeFundingGapPct ?? 0))}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[13.5px] font-semibold text-stone-900">Projects in {r.name}</h2>
          <span className="text-[12px] text-stone-500">
            {formatINR(r.allocatedAmount, { compact: true })} allocated of {r.budgetCap !== null ? formatINR(r.budgetCap, { compact: true }) : '—'} cap
          </span>
        </div>
        <div className="mt-4 divide-y divide-stone-100">
          {(r.projects ?? []).map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} onClick={onNavigate} className="flex items-center justify-between gap-4 py-3 hover:opacity-70">
              <div className="min-w-0">
                <p className="truncate text-[13px] text-stone-900">{p.name}</p>
                <p className="text-[11.5px] text-stone-500">{p.ngo?.name}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[12px] tabular-nums text-stone-600">
                  {formatINR(p.fundedAmount, { compact: true })} / {formatINR(p.requestedBudget, { compact: true })}
                </span>
                <StatusBadge status={p.status} small />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function indicatorLabel(key: string): string {
  const labels: Record<string, string> = {
    doctorAvailability: 'Doctor availability',
    hospitalBeds: 'Hospital beds',
    healthcareAccess: 'Healthcare access',
    csrFundingGap: 'CSR funding gap',
    waterAccess: 'Water access',
    sanitationCoverage: 'Sanitation coverage',
    groundwaterQuality: 'Groundwater quality',
    teacherAvailability: 'Teacher availability',
    schoolInfrastructure: 'School infrastructure',
    enrollmentRate: 'Enrollment rate',
  };
  return labels[key] ?? key;
}
