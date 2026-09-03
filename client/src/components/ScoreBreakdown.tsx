import { formatScore } from '../lib/format';
import type { ScoreBreakdown as ScoreBreakdownType } from '../types';

export default function ScoreBreakdown({ breakdown }: { breakdown: ScoreBreakdownType }) {
  const rows = [
    { label: 'Raw impact efficiency', value: formatScore(breakdown.impactEfficiency), tone: 'text-mist-100' },
    { label: 'NGO trust multiplier', value: `× ${breakdown.trustMultiplier.toFixed(2)}`, tone: 'text-signal-blue' },
    { label: 'Underservice adjustment', value: `+ ${breakdown.underserviceBonusPct.toFixed(1)}%`, tone: 'text-signal-rose' },
    { label: 'Geographical equity adjustment', value: `+ ${breakdown.equityBonusPct.toFixed(1)}%`, tone: 'text-signal-violet' },
  ];

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800/40 p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-mist-400">Score breakdown</p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-xs">
            <span className="text-mist-400">{row.label}</span>
            <span className={`tabular-nums font-medium ${row.tone}`}>{row.value}</span>
          </div>
        ))}
        <div className="my-1 border-t border-ink-700" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-mist-200">Final score</span>
          <span className="text-lg font-bold tabular-nums text-signal-teal">{formatScore(breakdown.finalScore)}</span>
        </div>
      </div>
    </div>
  );
}
