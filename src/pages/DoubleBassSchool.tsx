import { useState, useEffect, useRef } from "react";
import { Play, Square, Footprints, CheckCircle2 } from "lucide-react";
import { DOUBLE_BASS_EXERCISES, type DoubleBassExercise, getDoubleBassExercisesByLevel } from "../data/doubleBassExercises";
import { AudioEngine } from "../audio/AudioEngine";
import { MetronomeEngine, clampBpm } from "../audio/MetronomeEngine";
import { useAppContext } from "../context/AppContext";
import { recordAttempt } from "../services/performanceAnalysisService";
import { newId } from "../lib/localDb";

export function DoubleBassSchool() {
  const { user } = useAppContext();
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | 4>(1);
  const [selectedExercise, setSelectedExercise] = useState<DoubleBassExercise>(DOUBLE_BASS_EXERCISES[0]);
  const [bpm, setBpm] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeFoot, setActiveFoot] = useState<"R" | "L" | null>(null);
  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [sessionLogged, setSessionLogged] = useState(false);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const metronomeRef = useRef<MetronomeEngine | null>(null);
  const timerRef = useRef<number | null>(null);

  const currentLevelExercises = getDoubleBassExercisesByLevel(selectedLevel);

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

  const handleSelectExercise = (ex: DoubleBassExercise) => {
    stopPlayback();
    setSelectedExercise(ex);
    setBpm(ex.targetBpm);
  };

  const startPlayback = async () => {
    if (!audioEngineRef.current || !metronomeRef.current) return;
    await audioEngineRef.current.resume();

    setIsPlaying(true);
    setSessionLogged(false);
    let stepCount = 0;

    metronomeRef.current.onStep(() => {
      stepCount += 1;
      const isRightFoot = stepCount % 2 === 1;
      setActiveFoot(isRightFoot ? "R" : "L");

      if (audioEngineRef.current) {
        audioEngineRef.current.playKick(audioEngineRef.current.currentTime);
      }
    });

    const is16th = selectedExercise.subdivision === "16th";
    const steps = [
      { index: 0, clickType: "PRIMARY" as const },
      { index: 1, clickType: "SOFT" as const },
      { index: 2, clickType: "SECONDARY" as const },
      { index: 3, clickType: "SOFT" as const },
    ];

    metronomeRef.current.start(steps, bpm, is16th ? "16th" : "8th");

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setPracticeSeconds((s) => s + 1);
    }, 1000);
  };

  const stopPlayback = () => {
    if (metronomeRef.current) metronomeRef.current.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setActiveFoot(null);
  };

  const handleBpmChange = (newBpm: number) => {
    const clamped = clampBpm(newBpm);
    setBpm(clamped);
    if (metronomeRef.current) {
      metronomeRef.current.setBpm(clamped);
    }
  };

  const handleLogSession = () => {
    if (!user) return;
    recordAttempt({
      clientAttemptId: newId(),
      exerciseId: "P1-E04",
      cleanBpm: bpm,
      accuracy: 92,
      durationMinutes: Math.max(1, Math.round(practiceSeconds / 60)),
      notes: `Double Bass Lab: ${selectedExercise.name} (Level ${selectedLevel} @ ${bpm} BPM, ${practiceSeconds}s)`,
    });
    setSessionLogged(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <Footprints className="h-4 w-4" />
          Pedal Technique & Foot Control Laboratory
        </div>
        <h1 className="mt-1 text-2xl font-black text-parchment md:text-3xl">Double Bass / Double Kick School</h1>
        <p className="mt-1 text-sm text-parchment/60">
          Progressive foot technique from single-foot balance and throne ergonomics to 16th-note motors and linear fills.
        </p>
      </div>

      {/* Level Tabs */}
      <div className="flex flex-wrap gap-2">
        {([1, 2, 3, 4] as const).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => {
              setSelectedLevel(lvl);
              const firstInLevel = getDoubleBassExercisesByLevel(lvl)[0];
              if (firstInLevel) handleSelectExercise(firstInLevel);
            }}
            className={[
              "min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold transition",
              selectedLevel === lvl
                ? "bg-gold-500 text-charcoal-950 shadow-md"
                : "border border-charcoal-700 bg-charcoal-900/60 text-parchment/70 hover:border-gold-500/40 hover:text-parchment",
            ].join(" ")}
          >
            Level {lvl}: {lvl === 1 ? "Fundamentals" : lvl === 2 ? "Doubles & 16ths" : lvl === 3 ? "Pyramids & Bursts" : "Fills & Application"}
          </button>
        ))}
      </div>

      {/* Main Studio Arena */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Exercise Selector List */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-parchment/50">
            Level {selectedLevel} Workouts
          </span>
          <div className="space-y-2">
            {currentLevelExercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelectExercise(ex)}
                className={[
                  "flex w-full flex-col rounded-2xl border p-4 text-left transition-all",
                  selectedExercise.id === ex.id
                    ? "border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/5"
                    : "border-charcoal-800 bg-charcoal-900/60 hover:border-charcoal-700 hover:bg-charcoal-900",
                ].join(" ")}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-parchment">{ex.name}</span>
                  <span className="font-mono text-gold-400">{ex.targetBpm} BPM</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-parchment/60">{ex.purpose}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Center & Right: Interactive Audio Studio */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-3xl border border-gold-500/40 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-gold-500/20 px-2.5 py-0.5 text-xs font-mono font-bold uppercase text-gold-300">
                {selectedExercise.levelTitle}
              </span>
              <span className="text-xs text-parchment/50">
                {selectedExercise.subdivision} Notes &middot; {selectedExercise.timeSignature}
              </span>
            </div>

            <h2 className="mt-3 text-xl font-black text-parchment md:text-2xl">{selectedExercise.name}</h2>
            <p className="mt-1 text-xs text-parchment/70 leading-relaxed">{selectedExercise.techniqueGuide}</p>

            {/* Alternating Feet Animated Display */}
            <div className="mt-6 flex items-center justify-center gap-6 rounded-2xl border border-charcoal-800 bg-charcoal-950/90 py-6">
              <div
                className={[
                  "flex h-20 w-24 flex-col items-center justify-center rounded-2xl border transition-all duration-100",
                  activeFoot === "R"
                    ? "scale-110 border-gold-400 bg-gold-500/30 text-gold-300 shadow-xl shadow-gold-500/30"
                    : "border-charcoal-700 bg-charcoal-900/50 text-parchment/60",
                ].join(" ")}
              >
                <Footprints className="h-6 w-6" />
                <span className="mt-1 text-xs font-black">RIGHT KICK</span>
              </div>

              <div
                className={[
                  "flex h-20 w-24 flex-col items-center justify-center rounded-2xl border transition-all duration-100",
                  activeFoot === "L"
                    ? "scale-110 border-gold-400 bg-gold-500/30 text-gold-300 shadow-xl shadow-gold-500/30"
                    : "border-charcoal-700 bg-charcoal-900/50 text-parchment/60",
                ].join(" ")}
              >
                <Footprints className="h-6 w-6" />
                <span className="mt-1 text-xs font-black">LEFT KICK</span>
              </div>
            </div>

            {/* Live Tempo Controls */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">Tempo</span>
                  <span className="font-mono text-base font-bold text-gold-400">{bpm} BPM</span>
                </div>
                <input
                  type="range"
                  min={selectedExercise.minBpm}
                  max={selectedExercise.maxBpm}
                  value={bpm}
                  onChange={(e) => handleBpmChange(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-charcoal-800 accent-gold-500"
                />
              </div>

              <div className="flex items-center gap-3">
                {isPlaying ? (
                  <button
                    type="button"
                    onClick={stopPlayback}
                    className="flex min-h-[46px] items-center gap-2 rounded-2xl bg-amber-500 px-6 py-2.5 text-xs font-black text-charcoal-950 shadow-lg hover:bg-amber-400"
                  >
                    <Square className="h-4 w-4 fill-current" />
                    STOP
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startPlayback}
                    className="flex min-h-[46px] items-center gap-2 rounded-2xl bg-gold-500 px-6 py-2.5 text-xs font-black text-charcoal-950 shadow-lg hover:bg-gold-400"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    START WORKOUT
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Drumeo Guidelines & Common Pitfalls */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">Drumeo Technique Rule</h4>
              <p className="mt-2 text-xs text-parchment/80 leading-relaxed">{selectedExercise.drumeoGuideline}</p>
            </div>

            <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Common Pitfalls to Avoid</h4>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-parchment/70">
                {selectedExercise.commonMistakes.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Session Logger */}
          <div className="flex items-center justify-between rounded-2xl border border-charcoal-800 bg-charcoal-900/40 p-4">
            <div className="text-xs text-parchment/60">
              Active timer: <strong className="text-parchment">{Math.floor(practiceSeconds / 60)}m {practiceSeconds % 60}s</strong>
            </div>
            <button
              type="button"
              onClick={handleLogSession}
              disabled={sessionLogged}
              className="flex items-center gap-1.5 rounded-xl bg-gold-500 px-4 py-2 text-xs font-bold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {sessionLogged ? "WORKOUT LOGGED" : "LOG SESSION"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
