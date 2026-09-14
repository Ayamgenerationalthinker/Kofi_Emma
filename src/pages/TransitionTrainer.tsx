import { useState, useEffect, useRef } from "react";
import { Play, Square, ArrowRight, Layers } from "lucide-react";
import { AudioEngine } from "../audio/AudioEngine";
import { MetronomeEngine } from "../audio/MetronomeEngine";
import { getMeasureStructure, getMeterDefinition, type TimeSignature } from "../audio/meter";
import { useAppContext } from "../context/AppContext";
import { recordAttempt } from "../services/performanceAnalysisService";
import { newId } from "../lib/localDb";

interface TransitionPreset {
  id: string;
  name: string;
  fromMeter: TimeSignature;
  toMeter: TimeSignature;
  fromBpm: number;
  toBpm: number;
  description: string;
  barsBeforeTransition: number;
  countInBars: number;
  coachingWisdom: string;
}

const TRANSITION_PRESETS: TransitionPreset[] = [
  {
    id: "trans-1",
    name: "4/4 Praise to 6/8 African Gospel",
    fromMeter: "4/4",
    toMeter: "6/8",
    fromBpm: 120,
    toBpm: 90,
    description: "Classic high-energy praise medley shifting into a compound 6/8 worship or praise groove.",
    barsBeforeTransition: 4,
    countInBars: 1,
    coachingWisdom: "Lock onto the dotted-quarter pulse. Do not rush into the triplet subdivision on beat 1.",
  },
  {
    id: "trans-2",
    name: "6/8 Worship to 4/4 Fast Praise",
    fromMeter: "6/8",
    toMeter: "4/4",
    fromBpm: 85,
    toBpm: 130,
    description: "Building from a slow 6/8 worship prayer flow into an explosive 4/4 celebratory praise drive.",
    barsBeforeTransition: 4,
    countInBars: 1,
    coachingWisdom: "Watch for the 4-beat stick click or snare rollup that signals the 4/4 explosion.",
  },
  {
    id: "trans-3",
    name: "12/8 Blues-Gospel to 4/4 Pocket",
    fromMeter: "12/8",
    toMeter: "4/4",
    fromBpm: 80,
    toBpm: 100,
    description: "Transitioning from slow 12/8 compound blues-worship to a straight-ahead gospel pocket.",
    barsBeforeTransition: 4,
    countInBars: 1,
    coachingWisdom: "Straighten out the 8th notes on the hi-hat immediately on beat 1 of the new section.",
  },
  {
    id: "trans-4",
    name: "Worship (70 BPM) to Praise (125 BPM)",
    fromMeter: "4/4",
    toMeter: "4/4",
    fromBpm: 70,
    toBpm: 125,
    description: "Major tempo shift within 4/4: transitioning from deep prayer worship to jubilant praise.",
    barsBeforeTransition: 4,
    countInBars: 1,
    coachingWisdom: "A 4-beat crash choke or snare build signals the band before the new tempo starts.",
  },
];

export function TransitionTrainer() {
  const { user } = useAppContext();
  const [selectedPreset, setSelectedPreset] = useState<TransitionPreset>(TRANSITION_PRESETS[0]);
  const [currentStage, setCurrentStage] = useState<"FROM" | "COUNT_IN" | "TO">("FROM");
  const [currentBar, setCurrentBar] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [completedTransitions, setCompletedTransitions] = useState(0);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const metronomeRef = useRef<MetronomeEngine | null>(null);
  const timerRef = useRef<number | null>(null);
  const barCountRef = useRef(1);

  useEffect(() => {
    const audio = new AudioEngine();
    const metro = new MetronomeEngine(audio);
    audioEngineRef.current = audio;
    metronomeRef.current = metro;

    return () => {
      metro.stop();
      audio.dispose();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTransitionSequence = async () => {
    if (!metronomeRef.current || !audioEngineRef.current) return;
    await audioEngineRef.current.resume();

    setCurrentStage("FROM");
    barCountRef.current = 1;
    setCurrentBar(1);
    setCurrentBeat(1);
    setIsActive(true);
    setSessionSeconds(0);

    const startFromMeter = () => {
      if (!metronomeRef.current) return;
      const meter = getMeterDefinition(selectedPreset.fromMeter);
      const measure = getMeasureStructure(meter, selectedPreset.fromMeter === "4/4" ? "quarter" : "triplet");
      const steps = measure.map((m) => ({ index: m.position, clickType: m.accentType }));

      const beatsInMeasure = selectedPreset.fromMeter === "4/4" ? 4 : selectedPreset.fromMeter === "6/8" ? 6 : 12;
      let beatCounter = 0;

      metronomeRef.current.onStep(() => {
        beatCounter += 1;
        const currentBeatInBar = ((beatCounter - 1) % beatsInMeasure) + 1;
        setCurrentBeat(currentBeatInBar);

        if (currentBeatInBar === 1 && beatCounter > 1) {
          barCountRef.current += 1;
          setCurrentBar(barCountRef.current);

          if (barCountRef.current > selectedPreset.barsBeforeTransition) {
            // Trigger transition to TO stage!
            switchToToMeter();
          }
        }
      });

      metronomeRef.current.start(steps, selectedPreset.fromBpm, selectedPreset.fromMeter === "4/4" ? "quarter" : "triplet");
    };

    const switchToToMeter = () => {
      if (!metronomeRef.current) return;
      setCurrentStage("TO");
      barCountRef.current = 1;
      setCurrentBar(1);

      const toMeter = getMeterDefinition(selectedPreset.toMeter);
      const toMeasure = getMeasureStructure(toMeter, selectedPreset.toMeter === "4/4" ? "quarter" : "triplet");
      const toSteps = toMeasure.map((m) => ({ index: m.position, clickType: m.accentType }));

      const beatsInMeasure = selectedPreset.toMeter === "4/4" ? 4 : selectedPreset.toMeter === "6/8" ? 6 : 12;
      let toBeatCounter = 0;

      metronomeRef.current.onStep(() => {
        toBeatCounter += 1;
        const currentBeatInBar = ((toBeatCounter - 1) % beatsInMeasure) + 1;
        setCurrentBeat(currentBeatInBar);

        if (currentBeatInBar === 1 && toBeatCounter > 1) {
          barCountRef.current += 1;
          setCurrentBar(barCountRef.current);

          if (barCountRef.current > selectedPreset.barsBeforeTransition) {
            // Loop back to FROM stage
            setCompletedTransitions((c) => c + 1);
            setCurrentStage("FROM");
            barCountRef.current = 1;
            startFromMeter();
          }
        }
      });

      metronomeRef.current.start(toSteps, selectedPreset.toBpm, selectedPreset.toMeter === "4/4" ? "quarter" : "triplet");
    };

    startFromMeter();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTransitionSequence = () => {
    if (metronomeRef.current) metronomeRef.current.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);

    if (sessionSeconds > 15 && user) {
      recordAttempt({
        clientAttemptId: newId(),
        exerciseId: "P8-E10", // Transitions
        cleanBpm: selectedPreset.toBpm,
        accuracy: 92,
        durationMinutes: Math.max(1, Math.round(sessionSeconds / 60)),
        notes: `Transition Trainer: ${selectedPreset.name} (${completedTransitions} transitions completed)`,
      });
    }
  };

  const activeMeter = currentStage === "FROM" ? selectedPreset.fromMeter : selectedPreset.toMeter;
  const activeBpm = currentStage === "FROM" ? selectedPreset.fromBpm : selectedPreset.toBpm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <Layers className="h-4 w-4" />
          Live Church Flow Mastery
        </div>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Transition Trainer</h1>
        <p className="mt-1 text-sm text-parchment/60">
          Master seamless transitions between meters, feels, and tempos in live church settings without dropping beats.
        </p>
      </div>

      {/* Hero Visualizer */}
      <div className="rounded-2xl border border-gold-500/30 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 md:p-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-400">Transition Scenario</span>
            <h2 className="text-xl font-black text-parchment md:text-2xl">{selectedPreset.name}</h2>
            <p className="mt-1 text-xs text-parchment/60">{selectedPreset.description}</p>
          </div>

          <div className="flex items-center gap-4">
            {!isActive ? (
              <button
                type="button"
                onClick={startTransitionSequence}
                className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-gold-500 px-7 py-3 font-bold text-charcoal-950 shadow-lg shadow-gold-500/20 hover:bg-gold-400"
              >
                <Play className="h-5 w-5 fill-current" />
                START TRANSITION LOOP
              </button>
            ) : (
              <button
                type="button"
                onClick={stopTransitionSequence}
                className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-danger px-7 py-3 font-bold text-white shadow-lg shadow-danger/20 hover:opacity-90"
              >
                <Square className="h-5 w-5 fill-current" />
                STOP LOOP
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Transition Split State Indicator */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* Section A (From) */}
          <div
            className={`rounded-xl border p-5 transition-all ${
              currentStage === "FROM" && isActive
                ? "border-gold-400 bg-gold-500/15 ring-2 ring-gold-400"
                : "border-charcoal-800 bg-charcoal-950/60 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-gold-400">Section A (Starting Feel)</span>
              <span className="rounded bg-charcoal-800 px-2 py-0.5 text-xs font-bold text-parchment">
                {selectedPreset.fromMeter} @ {selectedPreset.fromBpm} BPM
              </span>
            </div>
            <p className="mt-2 text-sm text-parchment/80">Play 4 bars of steady foundational groove.</p>

            {currentStage === "FROM" && isActive && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-charcoal-900/80 p-3">
                <span className="text-xs font-semibold text-gold-300">Bar {currentBar} of 4</span>
                <span className="font-display text-lg font-bold text-parchment">Beat {currentBeat}</span>
              </div>
            )}
          </div>

          {/* Section B (To) */}
          <div
            className={`rounded-xl border p-5 transition-all ${
              currentStage === "TO" && isActive
                ? "border-amber-400 bg-amber-500/15 ring-2 ring-amber-400"
                : "border-charcoal-800 bg-charcoal-950/60 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-amber-400">Section B (New Feel)</span>
              <span className="rounded bg-charcoal-800 px-2 py-0.5 text-xs font-bold text-parchment">
                {selectedPreset.toMeter} @ {selectedPreset.toBpm} BPM
              </span>
            </div>
            <p className="mt-2 text-sm text-parchment/80">Switch feel and meter cleanly on Beat 1!</p>

            {currentStage === "TO" && isActive && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-charcoal-900/80 p-3">
                <span className="text-xs font-semibold text-amber-300">Bar {currentBar} of 4</span>
                <span className="font-display text-lg font-bold text-parchment">Beat {currentBeat}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Active Meter Banner */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-charcoal-800 bg-charcoal-950/80 p-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-parchment/50">Current Meter & Pulse:</span>
            <span className="font-display text-xl font-bold text-gold-400">{activeMeter}</span>
            <span className="font-display text-xl font-bold text-parchment">{activeBpm} BPM</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-parchment/50">
            <span>Completed Transitions: <strong className="text-gold-400">{completedTransitions}</strong></span>
            <span>Elapsed: <strong className="text-parchment">{sessionSeconds}s</strong></span>
          </div>
        </div>

        {/* Coaching Note */}
        <div className="mt-4 rounded-xl border border-gold-600/20 bg-gold-500/5 p-4 text-xs text-parchment/80">
          <strong className="text-gold-300">Live Advice:</strong> {selectedPreset.coachingWisdom}
        </div>
      </div>

      {/* Preset Selector */}
      <div className="space-y-4 rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-parchment/70">Select Transition Challenge</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {TRANSITION_PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={isActive}
                onClick={() => setSelectedPreset(preset)}
                className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-gold-500 bg-gold-500/10 shadow-md"
                    : "border-charcoal-700 bg-charcoal-800/40 hover:border-charcoal-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gold-400">
                    <span>{preset.fromMeter} ({preset.fromBpm} BPM)</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>{preset.toMeter} ({preset.toBpm} BPM)</span>
                  </div>
                  <h4 className="mt-2 text-base font-bold text-parchment">{preset.name}</h4>
                  <p className="mt-1 text-xs text-parchment/60">{preset.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
