import type { MeterDefinition, Subdivision } from "../audio/meter";
import { getMeasureStructure, groupStartPositions } from "../audio/meter";

// Section 39: a grouping-aware pulse display — dots are visually separated
// into their meter's groups (e.g. "● ● | ● ● | ● ● ●" for 7/8 grouped
// 2+2+3) rather than one undifferentiated row.
export function BeatIndicator({
  meter,
  subdivision,
  currentStepIndex,
}: {
  meter: MeterDefinition;
  subdivision: Subdivision;
  currentStepIndex: number;
}) {
  const structure = getMeasureStructure(meter, subdivision);
  const groupStarts = new Set(meter.timeSignature === "4/4" ? [] : groupStartPositions(meter.grouping));

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5" role="list" aria-label="Beat pulse">
      {structure.map((event, i) => {
        const isCurrent = i === currentStepIndex;
        const showDivider = groupStarts.has(i) && i > 0;
        return (
          <div key={i} className="flex items-center gap-1.5">
            {showDivider && <span className="mx-0.5 h-5 w-px bg-charcoal-600" aria-hidden="true" />}
            <div
              role="listitem"
              aria-current={isCurrent ? "true" : undefined}
              className={[
                "rounded-full transition-all duration-100",
                event.accentType === "PRIMARY" ? "h-6 w-6" : event.accentType === "SECONDARY" ? "h-5 w-5" : "h-3.5 w-3.5",
                isCurrent
                  ? "scale-125 bg-gold-400 shadow-[0_0_14px_rgba(216,169,78,0.6)]"
                  : event.accentType === "PRIMARY"
                    ? "bg-gold-600/70"
                    : event.accentType === "SECONDARY"
                      ? "bg-charcoal-500"
                      : "bg-charcoal-700",
              ].join(" ")}
            />
          </div>
        );
      })}
    </div>
  );
}
