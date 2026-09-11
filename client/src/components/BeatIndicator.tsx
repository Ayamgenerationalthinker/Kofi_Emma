// A plain click-track pulse display for the standalone metronome (no
// sticking pattern attached) — distinct from StickingVisualizer, which
// labels specific limbs.
export function BeatIndicator({ stepCount, groupSize, currentStepIndex }: { stepCount: number; groupSize: number; currentStepIndex: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-2" role="list" aria-label="Beat pulse">
      {Array.from({ length: stepCount }).map((_, i) => {
        const isAccent = i % groupSize === 0;
        const isCurrent = i === currentStepIndex;
        return (
          <div
            key={i}
            role="listitem"
            aria-current={isCurrent ? "true" : undefined}
            className={[
              "rounded-full transition-all duration-100",
              isAccent ? "h-5 w-5" : "h-3.5 w-3.5",
              isCurrent
                ? "scale-125 bg-gold-400 shadow-[0_0_14px_rgba(216,169,78,0.6)]"
                : isAccent
                  ? "bg-charcoal-500"
                  : "bg-charcoal-700",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}
