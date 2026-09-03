import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { formatINR } from '../lib/format';
import type { RunFairFillResult } from '../types';

const STEPS = ['Budget', 'Fair regional share', 'Need adjustment', 'Impact optimization', 'Final proposal'];

function StepRail({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {STEPS.map((step, i) => (
        <div key={step} className="flex shrink-0 items-center gap-1.5">
          <span
            className={`whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
              i <= activeStep ? 'bg-accent-50 text-accent-700' : 'text-stone-400'
            }`}
          >
            {step}
          </span>
          {i < STEPS.length - 1 && <ChevronRight size={12} className="shrink-0 text-stone-300" />}
        </div>
      ))}
    </div>
  );
}

export default function AllocationFlow({ result }: { result: RunFairFillResult | null }) {
  if (!result) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
        <StepRail activeStep={0} />
        <p className="mt-3 text-[13.5px] font-medium text-stone-700">Allocation engine ready</p>
        <p className="max-w-md text-[12.5px] text-stone-500">
          Click <span className="font-medium text-accent-600">Generate Allocation</span> to compute regional fairness
          caps and equity-adjusted project funding from the seeded evidence data.
        </p>
      </div>
    );
  }

  const maxCap = Math.max(...result.waterFill.caps.map((c) => c.cap), 1);

  return (
    <div className="card p-6">
      <StepRail activeStep={4} />

      <div className="mt-6 flex flex-col items-center gap-1 text-center">
        <span className="label-caps">Total CSR pool</span>
        <span className="text-[30px] font-semibold tabular-nums tracking-tight text-stone-900">
          {formatINR(result.totalPool, { compact: true })}
        </span>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="label-caps shrink-0 text-accent-600">Layer 1 — Regional fairness (max-min water-filling)</span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {result.waterFill.caps.map((cap, i) => (
          <motion.div
            key={cap.regionId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="rounded-md border border-stone-200 p-3"
          >
            <p className="truncate text-[12px] font-medium text-stone-700">{cap.name}</p>
            <p className="mt-1 text-[17px] font-semibold tabular-nums text-stone-900">{formatINR(cap.cap, { compact: true })}</p>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-stone-100">
              <motion.div
                className="h-full rounded-full bg-accent-500"
                initial={{ width: 0 }}
                animate={{ width: `${(cap.cap / maxCap) * 100}%` }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-1.5 text-[10.5px] text-stone-400">
              {cap.satisfiedFully ? 'Demand fully satisfied' : `of ${formatINR(cap.demand, { compact: true })} demand`}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="label-caps shrink-0 text-accent-600">Layer 2 — Equity-adjusted impact optimization</span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {result.regionResults.map((region, i) => {
          const cap = result.waterFill.caps.find((c) => c.regionId === region.regionId);
          const fundedCount = region.outcomes.filter((o) => o.fundedAmount > 0).length;
          return (
            <motion.div
              key={region.regionId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 + i * 0.06 }}
              className="rounded-md border border-stone-200 bg-stone-50/60 p-3"
            >
              <p className="truncate text-[12px] font-medium text-stone-700">{cap?.name}</p>
              <p className="mt-0.5 text-[11px] text-stone-500">
                {fundedCount} project{fundedCount === 1 ? '' : 's'} funded · {formatINR(region.spent, { compact: true })} spent
              </p>
              <ul className="mt-2 space-y-1 border-t border-stone-200 pt-2">
                {region.outcomes
                  .filter((o) => o.fundedAmount > 0)
                  .sort((a, b) => b.finalScore - a.finalScore)
                  .slice(0, 3)
                  .map((o) => (
                    <li key={o.projectId} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate text-stone-600">{o.name}</span>
                      <span className="shrink-0 tabular-nums text-stone-500">{formatINR(o.fundedAmount, { compact: true })}</span>
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
