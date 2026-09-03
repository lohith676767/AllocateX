import { AnimatePresence, motion } from 'framer-motion';
import { clockTime } from '../lib/format';
import type { AuditEvent } from '../types';

const EVENT_COLORS: Record<string, string> = {
  MILESTONE_MISSED: 'text-rose-600',
  MILESTONE_PAUSED_EXTERNAL: 'text-amber-600',
  SALVAGE_EVALUATED: 'text-amber-600',
  REALLOCATION_PROPOSED: 'text-amber-600',
  REALLOCATION_APPROVED: 'text-emerald-600',
  REALLOCATION_REJECTED: 'text-rose-600',
  MILESTONE_COMPLETED: 'text-emerald-600',
  ALLOCATION_APPROVED: 'text-emerald-600',
  ALLOCATION_REJECTED: 'text-rose-600',
  PROJECT_FUNDED: 'text-emerald-600',
  DEMO_RESET: 'text-accent-600',
  REGIONAL_ALLOCATION_CREATED: 'text-accent-600',
  ALLOCATION_PROPOSED: 'text-accent-600',
};

export default function AuditFeed({ events, compact = true }: { events: AuditEvent[]; compact?: boolean }) {
  return (
    <div className={compact ? 'max-h-[520px] space-y-0 overflow-y-auto pr-1' : 'space-y-0'}>
      <AnimatePresence initial={false}>
        {events.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-stone-100 py-2.5 text-[12px] last:border-0"
          >
            <div className="flex items-center gap-2 font-mono text-[10.5px]">
              <span className="text-stone-400">{clockTime(e.timestamp)}</span>
              <span className={`font-semibold ${EVENT_COLORS[e.event] ?? 'text-stone-500'}`}>{e.event}</span>
            </div>
            <p className="mt-1 leading-relaxed text-stone-600">{e.details}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
