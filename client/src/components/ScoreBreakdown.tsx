import { formatScore } from '../lib/format';
import type { ScoreBreakdown as ScoreBreakdownType } from '../types';
import ImpactBadge from './ImpactBadge';

export default function ScoreBreakdown({ breakdown }: { breakdown: ScoreBreakdownType }) {
  const rows = [
    { label: 'Raw impact efficiency', value: formatScore(breakdown.impactEfficiency), tone: 'text-stone-800' },
    { label: 'NGO trust multiplier', value: `× ${breakdown.trustMultiplier.toFixed(2)}`, tone: 'text-accent-600' },
    { label: 'Underservice adjustment', value: `+ ${breakdown.underserviceBonusPct.toFixed(1)}%`, tone: 'text-rose-600' },
    { label: 'Geographical equity adjustment', value: `+ ${breakdown.equityBonusPct.toFixed(1)}%`, tone: 'text-emerald-600' },
  ];

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-4">
      <p className="label-caps mb-3">FairFill score breakdown</p>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-[12px]">
            <span className="text-stone-500">{row.label}</span>
            <span className={`tabular-nums font-medium ${row.tone}`}>{row.value}</span>
          </div>
        ))}
        <div className="my-1 border-t border-stone-200" />
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12.5px] font-semibold text-stone-800">Impact Score: {formatScore(breakdown.finalScore)}</span>
            <p className="text-[10.5px] text-stone-400">
              impact efficiency × NGO trust + underservice adjustment + geographical equity adjustment
            </p>
          </div>
          <ImpactBadge score={breakdown.finalScore} />
        </div>
      </div>
    </div>
  );
}
