import { useMotionValue, useSpring } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

function AnimatedNumber({ value, formatter }: { value: number; formatter: (v: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 110, damping: 22, mass: 0.6 });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => {
      if (ref.current) ref.current.textContent = formatter(v);
    });
    return unsub;
  }, [spring, formatter]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatter(0)}
    </span>
  );
}

export default function MetricCard({
  label,
  value,
  formatter,
  icon: Icon,
  sub,
  emphasis = false,
}: {
  label: string;
  value: number;
  formatter: (v: number) => string;
  icon?: LucideIcon;
  sub?: string;
  /** Slightly larger figure for the metric(s) that matter most on the page. */
  emphasis?: boolean;
}) {
  return (
    <div className="card flex flex-col gap-2 px-4 py-3.5 transition-shadow hover:shadow-popover">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={12.5} strokeWidth={2.25} className="text-accent-600" />}
        <span className="label-caps">{label}</span>
      </div>
      <div className={`font-semibold text-stone-900 ${emphasis ? 'text-[24px] tracking-tight' : 'text-[19px]'}`}>
        <AnimatedNumber value={value} formatter={formatter} />
      </div>
      {sub && <span className="text-[11.5px] text-stone-500">{sub}</span>}
    </div>
  );
}
