import { Clock3, Eye, Scale, ShieldCheck, Sparkles } from 'lucide-react';

const ITEMS = [
  {
    icon: Scale,
    title: 'Fairness before optimization',
    body: 'Fairness is structurally enforced before project optimization.',
  },
  {
    icon: Eye,
    title: 'Evidence-based underservice',
    body: 'Need is independently measured rather than self-reported.',
  },
  {
    icon: Sparkles,
    title: 'Equity-adjusted impact',
    body: 'Impact is optimized without ignoring communities left behind.',
  },
  {
    icon: Clock3,
    title: 'Time-aware monitoring',
    body: 'Funding decisions evolve as projects progress.',
  },
  {
    icon: ShieldCheck,
    title: 'Human-governed reallocation',
    body: 'The engine proposes. A human approves.',
  },
];

export default function WhyFairFill() {
  return (
    <div className="card p-6">
      <h2 className="text-sm font-semibold text-mist-100">Why FairFill?</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-2 rounded-lg border border-ink-700 bg-ink-800/40 p-3.5">
            <Icon size={16} className="text-signal-teal" />
            <p className="text-xs font-semibold text-mist-100">{title}</p>
            <p className="text-[11px] leading-relaxed text-mist-400">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
