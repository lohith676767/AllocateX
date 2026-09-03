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
      <h2 className="text-[14px] font-semibold text-stone-900">Why FairFill</h2>
      <div className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-stone-200 bg-stone-200 sm:grid-cols-2 lg:grid-cols-5">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-2 bg-white p-4">
            <Icon size={15} strokeWidth={2} className="text-accent-600" />
            <p className="text-[12.5px] font-semibold text-stone-900">{title}</p>
            <p className="text-[11.5px] leading-relaxed text-stone-500">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
