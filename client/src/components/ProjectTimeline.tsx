import { AlertTriangle, Check, Circle, Clock, Eye } from 'lucide-react';
import type { Milestone } from '../types';

const ICONS: Record<string, JSX.Element> = {
  COMPLETED: <Check size={11} strokeWidth={3} />,
  MISSED: <AlertTriangle size={11} strokeWidth={3} />,
  UNDER_REVIEW: <Eye size={11} strokeWidth={3} />,
  IN_PROGRESS: <Clock size={11} strokeWidth={3} />,
};

const DOT_CLASSES: Record<string, string> = {
  COMPLETED: 'bg-emerald-500 border-emerald-500 text-white',
  MISSED: 'bg-rose-500 border-rose-500 text-white',
  UNDER_REVIEW: 'bg-amber-500 border-amber-500 text-white',
  IN_PROGRESS: 'bg-accent-500 border-accent-500 text-white animate-pulseSoft',
  UPCOMING: 'bg-white border-stone-300 text-stone-400',
};

export default function ProjectTimeline({ milestones, currentMonth }: { milestones: Milestone[]; currentMonth: number }) {
  const sorted = [...milestones].sort((a, b) => a.dueMonth - b.dueMonth);
  const maxMonth = Math.max(...sorted.map((m) => m.dueMonth), currentMonth, 1);

  return (
    <div className="py-5">
      <div className="relative h-10">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-stone-200" />
        <div
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-accent-500 transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, (currentMonth / maxMonth) * 100)}%` }}
        />
        {sorted.map((m) => {
          const left = (m.dueMonth / maxMonth) * 100;
          return (
            <div key={m.id} className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%` }}>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${DOT_CLASSES[m.status] ?? DOT_CLASSES.UPCOMING}`}
              >
                {ICONS[m.status] ?? <Circle size={7} fill="currentColor" />}
              </div>
              <div className="pointer-events-none absolute left-1/2 top-8 z-10 w-max max-w-[160px] -translate-x-1/2 rounded-md border border-stone-200 bg-white px-2 py-1 text-center text-[10.5px] text-stone-600 opacity-0 shadow-popover transition-opacity group-hover:opacity-100">
                {m.name} · M{m.dueMonth}
              </div>
              <span className="absolute left-1/2 top-8 -translate-x-1/2 text-[10.5px] text-stone-400 group-hover:opacity-0">M{m.dueMonth}</span>
            </div>
          );
        })}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-stone-900 bg-white transition-all duration-700 ease-out"
          style={{ left: `${Math.min(100, (currentMonth / maxMonth) * 100)}%` }}
          title={`Now: Month ${currentMonth}`}
        />
      </div>
    </div>
  );
}
