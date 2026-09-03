import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastContextValue {
  push: (kind: ToastKind, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, title: string, description?: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, kind, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto card flex items-start gap-3 border-l-2 p-3.5 ${
                t.kind === 'success'
                  ? 'border-l-signal-teal'
                  : t.kind === 'error'
                    ? 'border-l-signal-rose'
                    : 'border-l-signal-blue'
              }`}
            >
              {t.kind === 'success' && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-signal-teal" />}
              {t.kind === 'error' && <AlertTriangle size={18} className="mt-0.5 shrink-0 text-signal-rose" />}
              {t.kind === 'info' && <Info size={18} className="mt-0.5 shrink-0 text-signal-blue" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-mist-100">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs leading-relaxed text-mist-400">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="shrink-0 text-mist-400 hover:text-mist-100">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function useApiErrorToast() {
  const { push } = useToast();
  return useCallback(
    (err: unknown, fallbackTitle = 'Action failed') => {
      const message = err instanceof Error ? err.message : String(err);
      push('error', fallbackTitle, message);
    },
    [push]
  );
}
