import { STATUS_LABELS, STATUS_TONE } from '../lib/format';

const TONE_CLASSES: Record<string, string> = {
  neutral: 'bg-ink-700/60 text-mist-300 border-ink-600',
  positive: 'bg-signal-teal/10 text-signal-teal border-signal-teal/30',
  warning: 'bg-signal-amber/10 text-signal-amber border-signal-amber/30',
  danger: 'bg-signal-rose/10 text-signal-rose border-signal-rose/30',
  info: 'bg-signal-blue/10 text-signal-blue border-signal-blue/30',
};

export default function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const tone = STATUS_TONE[status] ?? 'neutral';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${TONE_CLASSES[tone]} ${
        small ? 'px-2 py-0.5 text-[10px] tracking-wide' : 'px-2.5 py-1 text-xs tracking-wide'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
