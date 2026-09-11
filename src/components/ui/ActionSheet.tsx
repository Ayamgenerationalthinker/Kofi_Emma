import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Section 10: the app's native-feeling mobile action sheet — slides up from
// the bottom, rounded top corners, drag-handle styling, closes on backdrop
// click or Escape, traps focus while open, and respects
// prefers-reduced-motion. On wider screens it centers instead of
// bottom-docking, since that reads better once there's no thumb to reach
// with.
export function ActionSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const sheet = sheetRef.current;
    const focusable = sheet?.querySelector<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    (focusable ?? sheet)?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !sheet) return;
      const focusables = Array.from(sheet.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")).filter(
        (el) => !el.hasAttribute("disabled")
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 bg-black/60 motion-safe:animate-[fadeIn_150ms_ease-out]" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-charcoal-700 bg-charcoal-900 p-5 pb-[calc(1.25rem+var(--safe-area-bottom))] shadow-2xl motion-safe:animate-[slideUp_200ms_ease-out] sm:max-w-md sm:rounded-2xl sm:border"
      >
        <div className="mb-3 flex justify-center sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-charcoal-600" aria-hidden="true" />
        </div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full text-parchment/60 hover:bg-charcoal-800 hover:text-parchment"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>,
    document.body
  );
}
