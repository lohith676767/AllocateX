import { AnimatePresence, motion } from 'framer-motion';
import { clockTime } from '../lib/format';
import type { AuditEvent } from '../types';

const EVENT_COLORS: Record<string, string> = {
  MILESTONE_MISSED: 'text-signal-rose',
  MILESTONE_PAUSED_EXTERNAL: 'text-signal-amber',
  SALVAGE_EVALUATED: 'text-signal-amber',
  REALLOCATION_PROPOSED: 'text-signal-amber',
  REALLOCATION_APPROVED: 'text-signal-teal',
  REALLOCATION_REJECTED: 'text-signal-rose',
  MILESTONE_COMPLETED: 'text-signal-teal',
  ALLOCATION_APPROVED: 'text-signal-teal',
  PROJECT_FUNDED: 'text-signal-teal',
  DEMO_RESET: 'text-signal-blue',
};

export default function AuditFeed({ events, compact = true }: { events: AuditEvent[]; compact?: boolean }) {
  return (
    <div className={compact ? 'max-h-[520px] space-y-0 overflow-y-auto pr-1' : 'space-y-0'}>
      <AnimatePresence initial={false}>
        {events.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="border-b border-ink-800 py-2.5 font-mono text-[11px] last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-mist-400">{clockTime(e.timestamp)}</span>
              <span className={`font-semibold ${EVENT_COLORS[e.event] ?? 'text-mist-300'}`}>{e.event}</span>
            </div>
            <p className="mt-0.5 font-sans leading-relaxed text-mist-300">{e.details}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
