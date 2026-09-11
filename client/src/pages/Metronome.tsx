import { useMemo, useState } from "react";
import { useMetronome } from "../hooks/useMetronome";
import { buildPlainMetronomeSteps } from "../audio/PatternScheduler";
import { MetronomeControls } from "../components/MetronomeControls";
import { BeatIndicator } from "../components/BeatIndicator";

const TIME_SIGNATURES = ["4/4", "6/8", "12/8"] as const;
const SUBDIVISIONS = [
  { value: "quarter", label: "Quarter" },
  { value: "8th", label: "8th" },
  { value: "16th", label: "16th" },
  { value: "triplet", label: "Triplet" },
];

// Section 18/50/51: a fully standalone metronome, independent of any
// curriculum exercise — accurate scheduling, tap tempo, subdivision and
// time-signature selection.
export function Metronome() {
  const [timeSignature, setTimeSignature] = useState<(typeof TIME_SIGNATURES)[number]>("4/4");
  const [subdivision, setSubdivision] = useState("16th");

  const steps = useMemo(() => buildPlainMetronomeSteps(timeSignature, subdivision), [timeSignature, subdivision]);
  const groupSize = useMemo(() => {
    if (timeSignature === "6/8" || timeSignature === "12/8") {
      return subdivision === "16th" ? 6 : 3;
    }
    return subdivision === "16th" ? 4 : subdivision === "triplet" ? 3 : subdivision === "8th" ? 2 : 1;
  }, [timeSignature, subdivision]);

  const metronome = useMetronome({ steps, subdivision, initialBpm: 100 });

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-black">Metronome</h1>

      <div className="flex flex-wrap justify-center gap-2">
        {TIME_SIGNATURES.map((ts) => (
          <button
            key={ts}
            type="button"
            onClick={() => setTimeSignature(ts)}
            aria-pressed={timeSignature === ts}
            className={[
              "rounded-md border px-4 py-2 text-sm font-semibold",
              timeSignature === ts ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70",
            ].join(" ")}
          >
            {ts}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {SUBDIVISIONS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSubdivision(s.value)}
            aria-pressed={subdivision === s.value}
            className={[
              "rounded-md border px-3 py-1.5 text-sm",
              subdivision === s.value ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70",
            ].join(" ")}
          >
            {s.label}
          </button>
        ))}
      </div>

      <BeatIndicator stepCount={steps.length} groupSize={groupSize} currentStepIndex={metronome.currentStepIndex} />

      <MetronomeControls
        bpm={metronome.bpm}
        minBpm={metronome.minBpm}
        maxBpm={metronome.maxBpm}
        setBpm={metronome.setBpm}
        isRunning={metronome.isRunning}
        onToggle={metronome.toggle}
        volume={metronome.volume}
        setVolume={metronome.setVolume}
        onTap={metronome.tapTempo}
        tapDetectedBpm={metronome.tapDetectedBpm}
        onAcceptTap={metronome.acceptTapTempo}
        large
      />
    </div>
  );
}
