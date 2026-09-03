import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Coins, Landmark, PlayCircle, ScrollText, Sparkles, TrendingUp, Users2, Wallet, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import AllocationFlow from '../components/AllocationFlow';
import ComparisonChart from '../components/ComparisonChart';
import MetricCard from '../components/MetricCard';
import PageHeader from '../components/PageHeader';
import { ErrorState, LoadingState } from '../components/StateViews';
import WhyFairFill from '../components/WhyFairFill';
import { useApiErrorToast, useToast } from '../hooks/useToast';
import { formatINR, formatPct, formatScore } from '../lib/format';
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
      push('success', 'FairFill run complete', `Regional caps computed across ${data.waterFill.caps.length} regions.`);
    },
    onError: (err) => onError(err, 'FairFill run failed'),
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
      <PageHeader
        title="Overview"
        subtitle="Fund where impact is high. Protect where need is highest."
        actions={
          <button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-signal-teal px-4 py-2 text-sm font-semibold text-ink-950 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {runMutation.isPending ? <Zap size={16} className="animate-pulse" /> : <PlayCircle size={16} />}
            {runMutation.isPending ? 'Running FairFill…' : 'Run FairFill'}
          </button>
        }
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <MetricCard label="Total CSR Pool" value={d.totalPool} formatter={(v) => formatINR(v, { compact: true })} icon={Wallet} accent="blue" />
        <MetricCard label="Allocated" value={d.allocated} formatter={(v) => formatINR(v, { compact: true })} icon={Coins} accent="teal" />
        <MetricCard label="Remaining" value={d.remaining} formatter={(v) => formatINR(v, { compact: true })} icon={Landmark} accent="violet" />
        <MetricCard label="Regions Served" value={d.regionsServed} formatter={(v) => `${Math.round(v)}/${d.totalRegions}`} icon={Users2} accent="amber" />
        <MetricCard label="Projects Funded" value={d.projectsFunded} formatter={(v) => `${Math.round(v)}/${d.totalProjects}`} icon={ScrollText} accent="teal" />
        <MetricCard label="Avg Impact / ₹1L" value={d.avgImpactPerRupee} formatter={(v) => formatScore(v)} icon={TrendingUp} accent="blue" />
        <MetricCard label="Equity Improvement" value={d.equityImprovementPct} formatter={(v) => formatPct(v)} icon={Sparkles} accent="violet" />
        <MetricCard label="Active Projects" value={d.activeProjects} formatter={(v) => `${Math.round(v)}`} icon={Zap} accent="amber" />
        <MetricCard label="Pending Approvals" value={d.pendingApprovals} formatter={(v) => `${Math.round(v)}`} icon={ScrollText} accent="rose" />
      </motion.div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-mist-400">FairFill Allocation Flow</h2>
        <AllocationFlow result={derivedResult} />
      </div>

      {comparison.data && comparison.data.length > 0 && <ComparisonChart rows={comparison.data} />}

      <WhyFairFill />
    </div>
  );
}
