import { STATUS_LABELS, STATUS_TONE } from '../lib/format';

export const TONE_CLASSES: Record<string, string> = {
  neutral: 'bg-stone-100 text-stone-600 border-stone-200',
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-accent-50 text-accent-700 border-accent-200',
};

export default function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const tone = STATUS_TONE[status] ?? 'neutral';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${TONE_CLASSES[tone]} ${
        small ? 'px-1.5 py-0.5 text-[10.5px]' : 'px-2 py-[3px] text-[11.5px]'
      }`}
    >
      <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
