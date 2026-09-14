import { useEffect, useMemo, useState } from "react";
import { useMetronome } from "../hooks/useMetronome";
import { buildMeterSteps } from "../audio/PatternScheduler";
import { getMeterDefinition, formatCountLabel, COMPOUND_GROUPING_OPTIONS, type TimeSignature, type Subdivision } from "../audio/meter";
import { MetronomeControls } from "../components/MetronomeControls";
import { BeatIndicator } from "../components/BeatIndicator";
import { getMetronomePreferences, updateMetronomePreferences } from "../services/settingsService";

const TIME_SIGNATURES: { value: TimeSignature; description: string }[] = [
  { value: "4/4", description: "Fast Praise / Highlife / Gospel" },
  { value: "3/4", description: "Worship Waltz / Ballad" },
  { value: "6/8", description: "West African Compound Feel" },
  { value: "12/8", description: "Traditional Compound Gospel Feel" },
  { value: "7/8", description: "Advanced Odd Meter" },
];

const SUBDIVISIONS: { value: Subdivision; label: string }[] = [
  { value: "quarter", label: "Quarter" },
  { value: "eighth", label: "8th" },
  { value: "16th", label: "16th" },
  { value: "triplet", label: "Triplet" },
];

interface Preset {
  name: string;
  bpm: number;
  timeSignature: TimeSignature;
  grouping?: number[];
}

// Section 43: loadable presets the user can still adjust afterward.
const PRESETS: Preset[] = [
  { name: "Fast Praise", bpm: 140, timeSignature: "4/4" },
  { name: "Highlife Pocket", bpm: 100, timeSignature: "4/4" },
  { name: "West African 6/8", bpm: 90, timeSignature: "6/8" },
  { name: "Compound Gospel", bpm: 110, timeSignature: "12/8" },
  { name: "Advanced Odd Time", bpm: 100, timeSignature: "7/8", grouping: [2, 2, 3] },
];

// A fully meter-aware standalone metronome: 4/4, 6/8, 12/8, and 7/8 (with
// selectable grouping), a crisp beat-1 ping distinct from softer clicks,
// tap tempo, and presets — independent of any curriculum exercise. Every
// setting is restored from LocalStorage on return visits.
export function Metronome() {
  const initial = useMemo(() => getMetronomePreferences(), []);

  const [timeSignature, setTimeSignature] = useState<TimeSignature>(initial.timeSignature);
  const [subdivision, setSubdivision] = useState<Subdivision>(initial.subdivision);
  const [grouping, setGrouping] = useState<number[] | undefined>(initial.grouping ?? undefined);
  const [accentOn, setAccentOn] = useState(initial.accentOn);

  const isCompound = timeSignature !== "4/4";
  // Compound/odd meters always click on a fixed eighth-note grid (section 34) — the subdivision picker only applies to 4/4.
  const effectiveSubdivision: Subdivision = isCompound ? "eighth" : subdivision;

  const meter = useMemo(() => getMeterDefinition(timeSignature, grouping), [timeSignature, grouping]);
  const rawSteps = useMemo(() => buildMeterSteps(timeSignature, effectiveSubdivision, grouping), [timeSignature, effectiveSubdivision, grouping]);
  const steps = useMemo(
    () => (accentOn ? rawSteps : rawSteps.map((s) => ({ ...s, clickType: "SOFT" as const }))),
    [rawSteps, accentOn]
  );
  const countLabel = useMemo(() => formatCountLabel(meter, effectiveSubdivision), [meter, effectiveSubdivision]);

  const metronome = useMetronome({ steps, subdivision: effectiveSubdivision, initialBpm: initial.bpm, initialVolume: initial.volume });

  useEffect(() => {
    updateMetronomePreferences({
      bpm: metronome.bpm,
      timeSignature,
      subdivision,
      grouping: grouping ?? null,
      accentOn,
      volume: metronome.volume,
    });
  }, [metronome.bpm, metronome.volume, timeSignature, subdivision, grouping, accentOn]);

  function loadPreset(preset: Preset) {
    metronome.setBpm(preset.bpm);
    setTimeSignature(preset.timeSignature);
    setGrouping(preset.grouping);
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-black">Metronome</h1>

      <div>
        <h2 className="mb-2 text-center text-xs uppercase tracking-widest text-parchment/50">Presets</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => loadPreset(preset)}
              className="rounded-full border border-charcoal-600 px-3 py-1.5 text-xs font-medium text-parchment/70 hover:border-gold-500 hover:text-gold-300"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-center text-xs uppercase tracking-widest text-parchment/50">Time Signature</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIME_SIGNATURES.map((ts) => (
            <button
              key={ts.value}
              type="button"
              onClick={() => {
                setTimeSignature(ts.value);
                setGrouping(undefined);
              }}
              aria-pressed={timeSignature === ts.value}
              className={[
                "flex flex-col items-center rounded-md border px-2 py-2",
                timeSignature === ts.value ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70",
              ].join(" ")}
            >
              <span className="text-sm font-bold">{ts.value}</span>
              <span className="text-[10px] text-parchment/50">{ts.description}</span>
            </button>
          ))}
        </div>
      </div>

      {timeSignature === "7/8" && (
        <div>
          <h2 className="mb-2 text-center text-xs uppercase tracking-widest text-parchment/50">Grouping</h2>
          <p className="mb-2 text-center text-xs text-parchment/50">7/8 can be grouped differently — no single grouping is universally correct.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {COMPOUND_GROUPING_OPTIONS["7/8"].map((g) => {
              const label = g.join("+");
              const isActive = (grouping ?? COMPOUND_GROUPING_OPTIONS["7/8"][0]).join("+") === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setGrouping(g)}
                  aria-pressed={isActive}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm",
                    isActive ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isCompound && (
        <div>
          <h2 className="mb-2 text-center text-xs uppercase tracking-widest text-parchment/50">Subdivision</h2>
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
        </div>
      )}

      <div className="space-y-2 text-center">
        <p className="font-mono text-sm text-parchment/60">{countLabel}</p>
        <BeatIndicator meter={meter} subdivision={effectiveSubdivision} currentStepIndex={metronome.currentStepIndex} />
      </div>

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
        accentOn={accentOn}
        onToggleAccent={() => setAccentOn((v) => !v)}
        large
      />
    </div>
  );
}
