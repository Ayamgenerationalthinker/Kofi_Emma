import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ActionSheet } from "./ActionSheet";

// Section 6: a two-step destructive confirmation. The sheet opens once;
// the caller must press the danger button a second time before anything
// actually happens — a single tap can never trigger a reset.
export function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
}) {
  const [armed, setArmed] = useState(false);

  function handleClose() {
    setArmed(false);
    onClose();
  }

  function handlePress() {
    if (!armed) {
      setArmed(true);
      return;
    }
    onConfirm();
    setArmed(false);
    onClose();
  }

  return (
    <ActionSheet open={open} onClose={handleClose} title={title}>
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" aria-hidden="true" />
        <p className="text-parchment/80">{description}</p>
        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={handlePress}
            className={[
              "min-h-[44px] w-full rounded-md py-3 font-bold transition-colors",
              armed ? "bg-red-600 text-white hover:bg-red-500" : "border border-red-500/60 text-red-300 hover:bg-red-950/40",
            ].join(" ")}
          >
            {armed ? `Confirm: ${confirmLabel}` : confirmLabel}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] w-full rounded-md border border-charcoal-600 py-3 font-semibold text-parchment/70 hover:bg-charcoal-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </ActionSheet>
  );
}
