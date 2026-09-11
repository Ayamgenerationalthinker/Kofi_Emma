import { AlertTriangle, Loader2, Inbox } from "lucide-react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-charcoal-600/80">
      <div className="grid grid-cols-3 gap-2 w-24" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-charcoal-700 animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
      <span className="flex items-center gap-2 text-sm text-parchment/70">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}

export function ErrorState({
  message = "Your local practice database could not be reached.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-red-900/50 bg-red-950/30 px-6 py-10 text-center">
      <AlertTriangle className="h-8 w-8 text-red-400" aria-hidden="true" />
      <p className="text-parchment/90">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md border border-gold-500/60 px-4 py-2 text-sm font-medium text-gold-400 hover:bg-gold-500/10"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-charcoal-700 bg-charcoal-900/60 px-6 py-12 text-center text-parchment/60">
      {icon ?? <Inbox className="h-8 w-8" aria-hidden="true" />}
      <p>{message}</p>
    </div>
  );
}
