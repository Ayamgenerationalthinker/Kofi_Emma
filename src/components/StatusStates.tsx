import { Inbox } from "lucide-react";

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-charcoal-700 bg-charcoal-900/60 px-6 py-12 text-center text-parchment/60">
      {icon ?? <Inbox className="h-8 w-8" aria-hidden="true" />}
      <p>{message}</p>
    </div>
  );
}
