import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-stone-500">
      <Loader2 size={18} className="animate-spin text-accent-500" />
      <p className="text-[13px]">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-rose-200 bg-rose-50/60 py-16 text-center">
      <AlertTriangle size={18} className="text-rose-500" />
      <p className="max-w-sm text-[13px] text-stone-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 hover:bg-stone-50"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 py-16 text-center">
      <Inbox size={17} className="text-stone-400" />
      <p className="text-[13px] font-medium text-stone-700">{title}</p>
      {description && <p className="max-w-sm text-[12px] text-stone-500">{description}</p>}
    </div>
  );
}
