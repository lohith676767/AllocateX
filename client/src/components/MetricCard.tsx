import { motion, useMotionValue, useSpring } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

function AnimatedNumber({ value, formatter }: { value: number; formatter: (v: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 90, damping: 20, mass: 0.6 });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => {
      if (ref.current) ref.current.textContent = formatter(v);
    });
    return unsub;
  }, [spring, formatter]);

  return <span ref={ref} className="tabular-nums">{formatter(0)}</span>;
}

export default function MetricCard({
  label,
  value,
  formatter,
  icon: Icon,
  accent = 'teal',
  sub,
}: {
  label: string;
  value: number;
  formatter: (v: number) => string;
  icon?: LucideIcon;
  accent?: 'teal' | 'amber' | 'rose' | 'violet' | 'blue';
  sub?: string;
}) {
  const accentClass = {
    teal: 'text-signal-teal',
    amber: 'text-signal-amber',
    rose: 'text-signal-rose',
    violet: 'text-signal-violet',
    blue: 'text-signal-blue',
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="card flex flex-col gap-3 p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-mist-400">{label}</span>
        {Icon && <Icon size={16} className={accentClass} />}
      </div>
      <div className="text-2xl font-semibold text-mist-100">
        <AnimatedNumber value={value} formatter={formatter} />
      </div>
      {sub && <span className="text-xs text-mist-400">{sub}</span>}
    </motion.div>
  );
}
