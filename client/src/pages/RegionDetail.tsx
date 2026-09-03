import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, LoadingState } from '../components/StateViews';
import { formatINR, formatPct } from '../lib/format';
import { api } from '../services/api';

export default function RegionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const region = useQuery({ queryKey: ['region', id], queryFn: () => api.getRegion(id!), enabled: !!id });

  if (region.isLoading) return <LoadingState label="Loading region…" />;
  if (region.isError || !region.data) return <ErrorState message="Could not load this region." onRetry={() => region.refetch()} />;

  const r = region.data;
  const under = r.underserviceExplanation;
  const equity = r.equityExplanation;

  return (
    <div className="space-y-6 pb-10">
      <button onClick={() => navigate('/regions')} className="flex items-center gap-1.5 text-xs text-mist-400 hover:text-mist-100">
        <ArrowLeft size={13} /> Back to regions
      </button>

      <PageHeader
        title={r.name}
        subtitle={`${r.state} · ${r.domain.replace('_', ' ')} · Population ${r.population.toLocaleString('en-IN')} · Peer group: ${r.peerGroup}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-mist-100">Why this underservice score?</h2>
            <span className="text-2xl font-bold tabular-nums text-signal-rose">{formatPct((under?.score ?? r.underserviceScore) * 100)}</span>
          </div>
          <p className="mt-1 text-xs text-mist-400">
            Calculated mathematically from authoritative indicator evidence — never self-reported by NGOs.
          </p>
          <div className="mt-4 space-y-3">
            {(under?.contributors ?? []).map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-mist-300">{indicatorLabel(c.key)}</span>
                  <span className="tabular-nums text-mist-400">
                    {c.regionalValue} / benchmark {c.benchmarkValue} → gap {formatPct(c.gap * 100)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full rounded-full bg-signal-rose" style={{ width: `${c.gap * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-mist-100">Why this geographical equity score?</h2>
            <span className="text-2xl font-bold tabular-nums text-signal-violet">{formatPct((equity?.score ?? r.geographicalEquityScore) * 100)}</span>
          </div>
          <p className="mt-1 text-xs text-mist-400">
            Funding relative to need, compared against the peer-group average — not simply "less money in, more money out".
          </p>
          <dl className="mt-4 space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-ink-800 pb-2">
              <dt className="text-mist-400">Historical CSR / need (this region)</dt>
              <dd className="tabular-nums text-mist-100">₹{Math.round(equity?.fundingPerNeed ?? 0).toLocaleString('en-IN')}</dd>
            </div>
            <div className="flex justify-between border-b border-ink-800 pb-2">
              <dt className="text-mist-400">Peer-group average</dt>
              <dd className="tabular-nums text-mist-100">₹{Math.round(equity?.peerAverageFundingPerNeed ?? 0).toLocaleString('en-IN')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-mist-400">Relative funding gap</dt>
              <dd className={`tabular-nums font-semibold ${(equity?.relativeFundingGapPct ?? 0) > 0 ? 'text-signal-teal' : 'text-signal-rose'}`}>
                {(equity?.relativeFundingGapPct ?? 0) > 0 ? 'Underfunded by ' : 'Overfunded by '}
                {formatPct(Math.abs(equity?.relativeFundingGapPct ?? 0))}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-mist-100">Projects in {r.name}</h2>
          <span className="text-xs text-mist-400">
            {formatINR(r.allocatedAmount, { compact: true })} allocated of {r.budgetCap !== null ? formatINR(r.budgetCap, { compact: true }) : '—'} cap
          </span>
        </div>
        <div className="mt-4 divide-y divide-ink-800">
          {(r.projects ?? []).map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between gap-4 py-3 hover:opacity-80">
              <div className="min-w-0">
                <p className="truncate text-sm text-mist-100">{p.name}</p>
                <p className="text-xs text-mist-400">{p.ngo?.name}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs tabular-nums text-mist-300">
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
