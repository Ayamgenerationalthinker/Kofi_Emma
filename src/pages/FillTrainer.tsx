import { useState, useEffect, useRef } from "react";
import { Play, Square, Sparkles, Volume2, VolumeX, CheckCircle, ArrowRight, Music, RefreshCw } from "lucide-react";
import { AudioEngine } from "../audio/AudioEngine";
import { MetronomeEngine, clampBpm } from "../audio/MetronomeEngine";
import { getMeasureStructure, getMeterDefinition } from "../audio/meter";
import { useAppContext } from "../context/AppContext";
import { recordAttempt } from "../services/performanceAnalysisService";
import { newId } from "../lib/localDb";

interface FillPattern {
  id: string;
  name: string;
  category: "1-beat" | "2-beat" | "4-beat" | "snare" | "toms" | "gospel-linear" | "praise-burst";
  durationBeats: number;
  sticking: string;
  notation: string;
  coachingTip: string;
  defaultBpm: number;
}

const FILL_LIBRARY: FillPattern[] = [
  {
    id: "fill-1",
    name: "1-Beat Snare Flurry",
    category: "1-beat",
    durationBeats: 1,
    sticking: "R L R L",
    notation: "Beat 4: Snare 16ths -> Beat 1 Crash & Kick",
    coachingTip: "Keep it brief. Don't rush into beat 4; let the fill explode from the pocket.",
    defaultBpm: 100,
  },
  {
    id: "fill-2",
    name: "2-Beat Tom Cascade",
    category: "2-beat",
    durationBeats: 2,
    sticking: "R L R L R L K K",
    notation: "Beats 3-4: High Tom, Mid Tom, Floor Tom, Double Kick -> Crash",
    coachingTip: "Land the double kick with authority so the return crash feels massive.",
    defaultBpm: 110,
  },
  {
    id: "fill-3",
    name: "4-Beat Gospel Linear Chops",
    category: "gospel-linear",
    durationBeats: 4,
    sticking: "R L K K R L K K R L R L K K R L",
    notation: "Full Bar 4: Hand-Hand-Foot-Foot linear matrix across kit",
    coachingTip: "Even spacing is king. No overlapping strokes between hands and feet.",
    defaultBpm: 105,
  },
  {
    id: "fill-4",
    name: "2-Beat Praise Snare & Cymbal Choke",
    category: "praise-burst",
    durationBeats: 2,
    sticking: "R L R L K R L REST",
    notation: "Beats 3-4: Accented snare roll, syncopated kick hit, choke",
    coachingTip: "Great for building praise tension before dropping right back into verse 1.",
    defaultBpm: 125,
  },
  {
    id: "fill-5",
    name: "1-Beat Triplet Flam Drop",
    category: "snare",
    durationBeats: 1,
    sticking: "R L R",
    notation: "Beat 4: Triplet snare burst landing hard on 1",
    coachingTip: "Count 'trip-le-let ONE'. The return to groove must be rock solid.",
    defaultBpm: 95,
  },
  {
    id: "fill-6",
    name: "4-Beat Afro-Gospel Medley Fill",
    category: "praise-burst",
    durationBeats: 4,
    sticking: "K R L K R L K R L R L R K K R L",
    notation: "Full Bar 4: Continuous kick and tom roll for high-energy song change",
    coachingTip: "Keep your eyes up on the music director while your limbs execute the pattern.",
    defaultBpm: 120,
  },
];

export function FillTrainer() {
  const { user } = useAppContext();
  const [selectedFill, setSelectedFill] = useState<FillPattern>(FILL_LIBRARY[0]);
  const [bpm, setBpm] = useState(100);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isActive, setIsActive] = useState(false);
  const [currentBar, setCurrentBar] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const metronomeRef = useRef<MetronomeEngine | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepCountRef = useRef<number>(0);

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

  const handleSelectFill = (fill: FillPattern) => {
    setSelectedFill(fill);
    if (!isActive) {
      setBpm(fill.defaultBpm);
    }
  };

  const startTrainer = async () => {
    if (!metronomeRef.current || !audioEngineRef.current) return;
    await audioEngineRef.current.resume();

    const clamped = clampBpm(bpm);
    const meter = getMeterDefinition("4/4");
    const measure = getMeasureStructure(meter, "quarter");
    const steps = measure.map((m) => ({ index: m.position, clickType: m.accentType }));

    stepCountRef.current = 0;
    setCurrentBar(1);
    setCurrentBeat(1);
    setCompletedCycles(0);
    setSessionSeconds(0);
    setIsActive(true);

    metronomeRef.current.onStep(() => {
      stepCountRef.current += 1;
      const totalBeats = stepCountRef.current;
      const bar = Math.floor((totalBeats - 1) / 4) % 4 + 1;
      const beat = ((totalBeats - 1) % 4) + 1;

      setCurrentBar(bar);
      setCurrentBeat(beat);

      if (bar === 1 && beat === 1 && totalBeats > 1) {
        setCompletedCycles((c) => c + 1);
      }
    });

    metronomeRef.current.start(steps, clamped, "quarter");

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTrainer = () => {
    if (metronomeRef.current) metronomeRef.current.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);

    if (sessionSeconds > 15 && user) {
      recordAttempt({
        clientAttemptId: newId(),
        exerciseId: "P3-E07", // Gospel fills
        cleanBpm: bpm,
        accuracy: 90,
        durationMinutes: Math.max(1, Math.round(sessionSeconds / 60)),
        notes: `Fill Trainer: ${selectedFill.name} (${completedCycles} cycles at ${bpm} BPM)`,
      });
    }
  };

  const filteredFills = categoryFilter === "ALL" ? FILL_LIBRARY : FILL_LIBRARY.filter((f) => f.category === categoryFilter);

  const isFillBar = currentBar === 4;
  const isReturnBar = currentBar === 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <Sparkles className="h-4 w-4" />
          The Return to Groove Loop
        </div>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Fill Trainer</h1>
        <p className="mt-1 text-sm text-parchment/60">
          Train the core loop: <strong>GROOVE (Bars 1-3) &rarr; FILL (Bar 4) &rarr; RETURN (Bar 1)</strong>. The landing is what makes a drummer great.
        </p>
      </div>

      {/* Interactive 4-Bar Phrasing Architecture Card */}
      <div className="rounded-2xl border border-gold-500/30 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 md:p-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-400">Selected Fill Pattern</span>
            <h2 className="text-xl font-black text-parchment md:text-2xl">{selectedFill.name}</h2>
            <p className="mt-1 text-xs text-parchment/60">{selectedFill.notation}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center md:text-right">
              <span className="text-xs text-parchment/50">Tempo</span>
              <p className="font-display text-3xl font-black text-gold-400">{bpm} <span className="text-sm font-bold">BPM</span></p>
            </div>
            {!isActive ? (
              <button
                type="button"
                onClick={startTrainer}
                className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 py-3 font-bold text-charcoal-950 shadow-lg shadow-gold-500/20 hover:bg-gold-400"
              >
                <Play className="h-5 w-5 fill-current" />
                START 4-BAR LOOP
              </button>
            ) : (
              <button
                type="button"
                onClick={stopTrainer}
                className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-danger px-6 py-3 font-bold text-white shadow-lg shadow-danger/20 hover:opacity-90"
              >
                <Square className="h-5 w-5 fill-current" />
                STOP LOOP
              </button>
            )}
          </div>
        </div>

        {/* 4-Bar Cycle Visualizer */}
        <div className="mt-8 grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((barNum) => {
            const isCurrent = isActive && currentBar === barNum;
            const isFill = barNum === 4;

            return (
              <div
                key={barNum}
                className={`relative rounded-xl border p-3.5 transition-all duration-200 ${
                  isCurrent
                    ? isFill
                      ? "border-amber-400 bg-amber-500/20 ring-2 ring-amber-400"
                      : "border-gold-500 bg-gold-500/20 ring-2 ring-gold-500"
                    : "border-charcoal-800 bg-charcoal-950/70 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase ${isFill ? "text-amber-400" : "text-parchment/60"}`}>
                    Bar {barNum}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-parchment/40">
                    {isFill ? "EXECUTE FILL" : "STEADY GROOVE"}
                  </span>
                </div>

                <div className="mt-3 flex justify-between gap-1">
                  {[1, 2, 3, 4].map((beatNum) => {
                    const isBeatActive = isCurrent && currentBeat === beatNum;
                    return (
                      <div
                        key={beatNum}
                        className={`h-7 flex-1 rounded-md text-center text-xs font-bold leading-7 transition-all ${
                          isBeatActive
                            ? isFill
                              ? "bg-amber-400 text-charcoal-950 shadow-md scale-105"
                              : "bg-gold-500 text-charcoal-950 shadow-md scale-105"
                            : "bg-charcoal-800 text-parchment/40"
                        }`}
                      >
                        {beatNum}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Real-Time Status Notification */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-charcoal-800 bg-charcoal-950/60 p-4 sm:flex-row">
          <div className="flex items-center gap-3 text-sm">
            {isFillBar ? (
              <span className="flex items-center gap-2 font-bold text-amber-400 animate-pulse">
                <Sparkles className="h-4 w-4" />
                NOW: Execute "{selectedFill.name}" &rarr; Land on Beat 1!
              </span>
            ) : isReturnBar && isActive ? (
              <span className="flex items-center gap-2 font-bold text-success">
                <CheckCircle className="h-4 w-4" />
                RETURNED TO GROOVE: Lock the pocket immediately on Beat 1.
              </span>
            ) : (
              <span className="text-parchment/70">
                Hold the foundation steady. Prepare for Bar 4 fill turnaround.
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-parchment/50">
            <span>Cycles Completed: <strong className="text-gold-400">{completedCycles}</strong></span>
            <span>Duration: <strong className="text-parchment">{sessionSeconds}s</strong></span>
          </div>
        </div>

        {/* Coaching Wisdom */}
        <div className="mt-4 rounded-xl border border-gold-600/20 bg-gold-500/5 p-4 text-xs text-parchment/80">
          <strong className="text-gold-300">Coaching Note:</strong> {selectedFill.coachingTip}
        </div>
      </div>

      {/* Fill Pattern Selector Library */}
      <div className="space-y-4 rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-parchment/70">Fill Library</h3>
            <p className="text-xs text-parchment/50">Select a pattern to load into the 4-bar trainer</p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {["ALL", "1-beat", "2-beat", "4-beat", "gospel-linear", "praise-burst"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase ${
                  categoryFilter === cat
                    ? "bg-gold-500 text-charcoal-950"
                    : "border border-charcoal-700 bg-charcoal-800/80 text-parchment/60 hover:text-parchment"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Fills */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFills.map((fill) => {
            const isSelected = selectedFill.id === fill.id;
            return (
              <button
                key={fill.id}
                type="button"
                onClick={() => handleSelectFill(fill)}
                className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-gold-500 bg-gold-500/10 shadow-md shadow-gold-500/10"
                    : "border-charcoal-700 bg-charcoal-800/40 hover:border-charcoal-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-charcoal-700/60 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-400">
                      {fill.durationBeats} Beat{fill.durationBeats > 1 ? "s" : ""}
                    </span>
                    <span className="text-[11px] text-parchment/40">{fill.defaultBpm} BPM</span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-parchment">{fill.name}</h4>
                  <p className="mt-1 font-mono text-xs text-gold-300/90">{fill.sticking}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-charcoal-700/50 pt-2 text-[11px] text-parchment/50">
                  <span>{fill.category}</span>
                  <span className="text-gold-400 flex items-center gap-1 font-semibold">Select <ArrowRight className="h-3 w-3" /></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
