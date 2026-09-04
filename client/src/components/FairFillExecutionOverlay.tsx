import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const STEPS = [
  'Loading regional evidence',
  'Calculating underservice',
  'Calculating geographical equity',
  'Building fairness caps',
  'Evaluating marginal tiers',
  'Applying fairness constraints',
  'Allocation complete',
];

const STEP_INTERVAL_MS = 380;
const LAST_STEP = STEPS.length - 1;
// The engine's real work happens server-side in one request, so the choreography
// advances through these steps on a fixed cadence and then holds on the last
// working step until the actual API response comes back — it never claims to be
// further along than the real run, and it never finishes before the response does.
const HOLD_STEP = STEPS.length - 2;

/**
 * Shown for the full lifetime of a FairFill run. Purely a progress narration of a
 * deterministic, rules-based computation — there is no model inference here, and
 * the copy says so explicitly so it never reads as "AI is deciding this".
 */
export default function FairFillExecutionOverlay({
  active,
  failed,
  onDone,
}: {
  active: boolean;
  /** The run rejected — close immediately instead of playing the success finish (the caller's own error toast covers messaging). */
  failed?: boolean;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const wasActive = useRef(false);
  // onDone is an inline callback from the caller and gets a new identity on every
  // parent re-render (e.g. the query refetches a successful run triggers) — reading
  // it through a ref keeps the timer effect below from depending on that identity,
  // so an unrelated re-render can no longer cancel the pending close timeout.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (active && !wasActive.current) {
      setStep(0);
      setFinishing(false);
    }
    if (!active && wasActive.current) {
      wasActive.current = active;
      if (failed) {
        onDoneRef.current();
        return;
      }
      setFinishing(true);
      setStep(LAST_STEP);
      const t = setTimeout(() => {
        setFinishing(false);
        onDoneRef.current();
      }, 900);
      return () => clearTimeout(t);
    }
    wasActive.current = active;
  }, [active, failed]);

  useEffect(() => {
    if (!active || finishing || step >= HOLD_STEP) return;
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, HOLD_STEP)), STEP_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [active, finishing, step]);

  const visible = active || finishing;
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/70 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-xl border border-navy-800 bg-navy-900 p-6 shadow-popover"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-600/15 text-accent-400">
                {finishing ? <Check size={16} /> : <Loader2 size={16} className="animate-spin" />}
              </span>
              <div>
                <p className="text-[14px] font-semibold text-white">Running FairFill</p>
                <p className="text-[11.5px] text-navy-400">Deterministic allocation — same inputs always produce the same result</p>
              </div>
            </div>

            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-navy-800">
              <motion.div
                className="h-full rounded-full bg-accent-500"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>

            <ul className="mt-5 space-y-2.5">
              {STEPS.map((label, i) => {
                const done = finishing ? i <= LAST_STEP : i < step;
                const isCurrent = !finishing && i === step;
                return (
                  <li key={label} className="flex items-center gap-2.5 text-[12.5px]">
                    <span
                      className={`flex shrink-0 items-center justify-center rounded-full border ${
                        done
                          ? 'border-accent-500 bg-accent-500 text-white'
                          : isCurrent
                            ? 'border-accent-500 text-accent-400'
                            : 'border-navy-700 text-navy-600'
                      }`}
                      style={{ height: 18, width: 18 }}
                    >
                      {done ? <Check size={11} /> : isCurrent ? <Loader2 size={10} className="animate-spin" /> : null}
                    </span>
                    <span className={done || isCurrent ? 'text-navy-100' : 'text-navy-500'}>{label}</span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex items-start gap-2 rounded-md border border-navy-800 bg-navy-950/60 px-3 py-2.5">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-accent-400" />
              <p className="text-[11px] leading-relaxed text-navy-400">
                FairFill is a rules-based allocation engine, not a predictive model. Every step above is an explainable
                calculation over evidence a human reviewer can inspect — nothing here is AI-generated.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
