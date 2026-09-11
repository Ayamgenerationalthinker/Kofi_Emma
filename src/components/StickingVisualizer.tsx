import type { MetronomeEvent } from "../lib/types";

const LIMB_LABEL: Record<string, string> = {
  R: "R",
  L: "L",
  K: "K",
  H: "H",
  HH: "HH",
  REST: "–",
};

const LIMB_NAME: Record<string, string> = {
  R: "Right hand",
  L: "Left hand",
  K: "Kick",
  H: "Hi-hat",
  HH: "Hi-hat foot",
  REST: "Rest",
};

// Section 19/47: current event is visually emphasized (not by color alone —
// it also gets a thicker border, a scale change, and an aria-live text
// announcement), previous events sit at normal weight, upcoming ones are
// dimmed.
export function StickingVisualizer({
  events,
  currentStepIndex,
  large = false,
}: {
  events: MetronomeEvent[];
  currentStepIndex: number;
  large?: boolean;
}) {
  if (events.length === 0) return null;
  const currentLimb = currentStepIndex >= 0 ? events[currentStepIndex % events.length]?.limb : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-center" role="list" aria-label="Sticking pattern">
        {events.map((event, i) => {
          const isCurrent = i === currentStepIndex;
          const isPast = currentStepIndex >= 0 && i < currentStepIndex;
          return (
            <div
              key={i}
              role="listitem"
              aria-current={isCurrent ? "true" : undefined}
              className={[
                "flex items-center justify-center rounded-lg border-2 font-bold transition-all duration-100",
                large ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg",
                isCurrent
                  ? "scale-110 border-gold-400 bg-gold-500/20 text-gold-300 shadow-[0_0_18px_rgba(216,169,78,0.45)]"
                  : isPast
                    ? "border-charcoal-600 bg-charcoal-800 text-parchment/70"
                    : "border-charcoal-700 bg-charcoal-900 text-parchment/30",
                event.accent && !isCurrent ? "border-gold-600/40" : "",
              ].join(" ")}
              title={LIMB_NAME[event.limb] ?? event.limb}
            >
              {LIMB_LABEL[event.limb] ?? event.limb}
            </div>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {currentLimb ? `Current: ${LIMB_NAME[currentLimb] ?? currentLimb}` : "Stopped"}
      </p>
    </div>
  );
}
