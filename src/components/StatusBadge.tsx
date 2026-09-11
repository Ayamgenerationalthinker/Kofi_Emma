import { Lock, CheckCircle2, RotateCcw, Circle, PlayCircle } from "lucide-react";
import type { ProgressStatus } from "../lib/types";

const CONFIG: Record<ProgressStatus, { label: string; icon: React.ReactNode; className: string }> = {
  LOCKED: { label: "Locked", icon: <Lock className="h-3.5 w-3.5" />, className: "border-charcoal-600 text-parchment/40" },
  AVAILABLE: { label: "Available", icon: <Circle className="h-3.5 w-3.5" />, className: "border-charcoal-500 text-parchment/80" },
  IN_PROGRESS: { label: "In Progress", icon: <PlayCircle className="h-3.5 w-3.5" />, className: "border-blue-500/60 text-blue-300" },
  REPEAT: { label: "Repeat", icon: <RotateCcw className="h-3.5 w-3.5" />, className: "border-amber-500/60 text-amber-300" },
  MASTERED: { label: "Mastered", icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: "border-gold-500 text-gold-300" },
};

// Section 47: mastery is never signalled by color alone — every badge pairs
// an icon and an explicit text label with the color.
export function StatusBadge({ status }: { status: ProgressStatus }) {
  const cfg = CONFIG[status] ?? CONFIG.LOCKED;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
