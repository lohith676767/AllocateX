import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, PlayCircle, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AllocationFlow from '../components/AllocationFlow';
import ComparisonChart from '../components/ComparisonChart';
import MetricCard from '../components/MetricCard';
import { ErrorState, LoadingState } from '../components/StateViews';
import WhyFairFill from '../components/WhyFairFill';
import { useApiErrorToast, useToast } from '../hooks/useToast';
import { formatINR, formatScore } from '../lib/format';
import { api } from '../services/api';
import type { RunFairFillResult } from '../types';

export default function Overview() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const [runResult, setRunResult] = useState<RunFairFillResult | null>(null);

  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: api.getDashboard });
  const regions = useQuery({ queryKey: ['regions'], queryFn: api.listRegions });
  const allocations = useQuery({ queryKey: ['allocations'], queryFn: api.listAllocations });
  const comparison = useQuery({
    queryKey: ['comparison'],
    queryFn: api.getComparison,
    enabled: !!dashboard.data?.fairFillHasRun,
  });

  const runMutation = useMutation({
    mutationFn: api.runFairFill,
    onSuccess: (data) => {
      setRunResult(data);
      queryClient.invalidateQueries();
      push('success', 'Allocation generated', `Regional caps computed across ${data.waterFill.caps.length} regions.`);
    },
    onError: (err) => onError(err, 'Allocation generation failed'),
  });

  // Reconstruct a displayable result from persisted data if the page was reloaded
  // after a run (so the hero visualization survives navigation/refresh).
  const derivedResult: RunFairFillResult | null = useMemo(() => {
    if (runResult) return runResult;
    if (!dashboard.data?.fairFillHasRun || !regions.data || !allocations.data) return null;

    const caps = regions.data
      .filter((r) => r.budgetCap !== null)
      .map((r) => ({
        regionId: r.id,
        name: r.name,
        demand: r.budgetDemand,
        cap: r.budgetCap ?? 0,
        satisfiedFully: r.budgetDemand <= (r.budgetCap ?? 0) + 1,
      }));

    const regionResults = regions.data
      .filter((r) => r.budgetCap !== null)
      .map((r) => {
        const regionAllocs = allocations.data.filter((a) => a.regionId === r.id);
        const spent = regionAllocs.reduce((s, a) => s + a.amount, 0);
        return {
          regionId: r.id,
          cap: r.budgetCap ?? 0,
          spent,
          residual: (r.budgetCap ?? 0) - spent,
          outcomes: regionAllocs.map((a) => ({
            projectId: a.projectId,
            name: a.project?.name ?? '',
            isConcave: true,
            fundedAmount: a.amount,
            fundedImpact: 0,
            tiersFunded: 0,
            totalTiers: 0,
            finalScore: a.score,
          })),
          steps: [],
        };
      });

    return {
      totalPool: dashboard.data.totalPool,
      waterFill: { totalPool: dashboard.data.totalPool, totalDemand: 0, unallocatedResidual: 0, caps, rounds: [] },
      regionResults,
      regionScores: regions.data.map((r) => ({
        regionId: r.id,
        name: r.name,
        underserviceScore: r.underserviceScore,
        geographicalEquityScore: r.geographicalEquityScore,
        serviceLevel: r.serviceLevel,
      })),
    };
  }, [runResult, dashboard.data, regions.data, allocations.data]);

  if (dashboard.isLoading) return <LoadingState label="Loading dashboard…" />;
  if (dashboard.isError) return <ErrorState message="Could not load the dashboard." onRetry={() => dashboard.refetch()} />;

  const d = dashboard.data!;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-semibold tracking-tight text-stone-900">FairFill</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-medium text-stone-500">
              <span className={`h-1.5 w-1.5 rounded-full ${d.fairFillHasRun ? 'bg-emerald-500' : 'bg-stone-300'}`} />
              {d.fairFillHasRun ? 'Allocation engine operational' : 'Awaiting first allocation'}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-stone-500">
            Equitable CSR allocation engine — fund where impact is high, protect where need is highest.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {d.fairFillHasRun && (
            <Link
              to="/allocations"
              className="flex items-center gap-1.5 rounded-md border border-stone-200 px-3.5 py-2 text-[13px] font-medium text-stone-700 hover:bg-stone-50"
            >
              Review Proposal <ArrowRight size={14} />
            </Link>
          )}
          <button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            className="flex items-center gap-2 rounded-md bg-accent-600 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-60"
          >
            {runMutation.isPending ? <Zap size={14} className="animate-pulse" /> : <PlayCircle size={14} />}
            {runMutation.isPending ? 'Generating…' : 'Generate Allocation'}
          </button>
        </div>
      </div>

      <div className="card flex flex-wrap">
        <MetricCard label="CSR Pool" value={d.totalPool} formatter={(v) => formatINR(v, { compact: true })} emphasis />
        <MetricCard label="Allocated" value={d.allocated} formatter={(v) => formatINR(v, { compact: true })} emphasis />
        <MetricCard label="Remaining" value={d.remaining} formatter={(v) => formatINR(v, { compact: true })} emphasis />
        <MetricCard label="Avg FairFill Score" value={d.avgFairFillScore} formatter={(v) => formatScore(v)} />
        <MetricCard label="Regions Served" value={d.regionsServed} formatter={(v) => `${Math.round(v)}/${d.totalRegions}`} />
        <MetricCard label="Active Projects" value={d.activeProjects} formatter={(v) => `${Math.round(v)}`} />
        <MetricCard label="Pending Approvals" value={d.pendingApprovals} formatter={(v) => `${Math.round(v)}`} />
      </div>

      <div>
        <h2 className="mb-3 text-[13px] font-semibold text-stone-700">FairFill Allocation Flow</h2>
        <AllocationFlow result={derivedResult} />
      </div>

      {comparison.data && comparison.data.length > 0 && <ComparisonChart rows={comparison.data} />}

      <WhyFairFill />
    </div>
  );
}
