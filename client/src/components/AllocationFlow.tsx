import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { formatINR } from '../lib/format';
import type { RunFairFillResult } from '../types';

const BAR_COLORS = ['#2dd4bf', '#4f9df7', '#f5b942', '#8b7cf6', '#f3607a', '#6ee7b7'];

export default function AllocationFlow({ result }: { result: RunFairFillResult | null }) {
  if (!result) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm font-medium text-mist-200">FairFill hasn't been run yet</p>
        <p className="max-w-md text-xs text-mist-400">
          Click <span className="text-signal-teal">Run FairFill</span> to compute regional fairness caps and
          equity-adjusted project allocation from the seeded evidence data.
        </p>
      </div>
    );
  }

  const maxCap = Math.max(...result.waterFill.caps.map((c) => c.cap), 1);

  return (
    <div className="card p-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-mist-400">Total CSR Pool</span>
        <span className="text-3xl font-bold tabular-nums text-mist-100">{formatINR(result.totalPool, { compact: true })}</span>
      </div>

      <div className="flex justify-center py-2">
        <ArrowDown size={16} className="text-mist-400" />
      </div>
      <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-signal-teal">
        Layer 1 — Regional Fairness (Max-Min Water-Filling)
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {result.waterFill.caps.map((cap, i) => (
          <motion.div
            key={cap.regionId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="rounded-lg border border-ink-600 bg-ink-800/60 p-3"
          >
            <p className="truncate text-xs font-medium text-mist-300">{cap.name}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-mist-100">{formatINR(cap.cap, { compact: true })}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
              <motion.div
                className="h-full rounded-full"
                style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                initial={{ width: 0 }}
                animate={{ width: `${(cap.cap / maxCap) * 100}%` }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-mist-400">
              {cap.satisfiedFully ? 'Demand fully satisfied' : `of ₹${(cap.demand / 100000).toFixed(1)}L demand`}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center py-2 pt-4">
        <ArrowDown size={16} className="text-mist-400" />
      </div>
      <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-signal-violet">
        Layer 2 — Equity-Adjusted Impact Optimization
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {result.regionResults.map((region, i) => {
          const cap = result.waterFill.caps.find((c) => c.regionId === region.regionId);
          const fundedCount = region.outcomes.filter((o) => o.fundedAmount > 0).length;
          return (
            <motion.div
              key={region.regionId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="rounded-lg border border-ink-600 bg-ink-800/40 p-3"
            >
              <p className="truncate text-xs font-medium text-mist-300">{cap?.name}</p>
              <p className="mt-1 text-[11px] text-mist-400">
                {fundedCount} project{fundedCount === 1 ? '' : 's'} funded · {formatINR(region.spent, { compact: true })} spent
              </p>
              <ul className="mt-2 space-y-1">
                {region.outcomes
                  .filter((o) => o.fundedAmount > 0)
                  .sort((a, b) => b.finalScore - a.finalScore)
                  .slice(0, 3)
                  .map((o) => (
                    <li key={o.projectId} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate text-mist-300">{o.name}</span>
                      <span className="shrink-0 tabular-nums text-mist-400">{formatINR(o.fundedAmount, { compact: true })}</span>
                    </li>
                  ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
