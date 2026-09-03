import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-mist-400">
      <Loader2 size={22} className="animate-spin text-signal-teal" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-signal-rose/20 bg-signal-rose/5 py-16 text-center">
      <AlertCircle size={22} className="text-signal-rose" />
      <p className="max-w-sm text-sm text-mist-300">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg border border-ink-600 px-3 py-1.5 text-xs text-mist-300 hover:bg-ink-800">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-600 py-16 text-center">
      <Inbox size={20} className="text-mist-400" />
      <p className="text-sm font-medium text-mist-300">{title}</p>
      {description && <p className="max-w-sm text-xs text-mist-400">{description}</p>}
    </div>
  );
}
