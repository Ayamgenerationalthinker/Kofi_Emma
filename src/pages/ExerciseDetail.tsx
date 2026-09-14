import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Lock, ArrowLeft, Play, Square, Sparkles, HelpCircle } from "lucide-react";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getDb } from "../lib/localDb";
import { getExercise, getPhase, type CurriculumExercise } from "../data/curriculum";
import { canAccessExercise } from "../services/curriculumService";
import { StatusBadge } from "../components/StatusBadge";
import { StickingVisualizer } from "../components/StickingVisualizer";
import { EmptyState } from "../components/StatusStates";
import { AudioEngine } from "../audio/AudioEngine";
import { MetronomeEngine, clampBpm } from "../audio/MetronomeEngine";
import { getMeasureStructure, getMeterDefinition } from "../audio/meter";

export function ExerciseDetail() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  useLocalDbVersion();

  const exercise = exerciseId ? getExercise(exerciseId) : undefined;
  if (!exercise) {
    return <EmptyState message="This exercise doesn't exist." />;
  }

  return <ExerciseDetailView exercise={exercise} />;
}

function ExerciseDetailView({ exercise }: { exercise: CurriculumExercise }) {
  const db = getDb();
  const progress = db.progress[exercise.id];
  const accessible = canAccessExercise(exercise.id);
  const phase = getPhase(exercise.phaseId);

  // Metronome & Audio preview
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(exercise.targetBpm);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const metronomeRef = useRef<MetronomeEngine | null>(null);

  useEffect(() => {
    const audio = new AudioEngine();
    const metro = new MetronomeEngine(audio);
    audioEngineRef.current = audio;
    metronomeRef.current = metro;

    return () => {
      metro.stop();
      audio.dispose();
    };
  }, []);

  if (!accessible) {
    const prerequisites = exercise.prerequisiteIds.map((id) => getExercise(id)).filter((e): e is NonNullable<typeof e> => !!e);
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-charcoal-700 bg-charcoal-900/50 p-10 text-center">
          <Lock className="h-10 w-10 text-parchment/40" />
          <h1 className="text-xl font-bold">{exercise.name}</h1>
          <p className="text-parchment/60">
            This exercise is locked.
            {prerequisites.length > 0 && <> Master {prerequisites.map((p) => p.name).join(", ")} first.</>}
          </p>
        </div>
      </div>
    );
  }

  const stickingTokens = exercise.stickingPattern.split(" ").filter(Boolean);
  const countLabels = buildCountLabels(stickingTokens.length, exercise.subdivision, exercise.timeSignature);

  const togglePlayback = async () => {
    if (!metronomeRef.current || !audioEngineRef.current) return;

    if (isPlaying) {
      metronomeRef.current.stop();
      setIsPlaying(false);
      setCurrentStepIndex(-1);
    } else {
      await audioEngineRef.current.resume();
      const meter = getMeterDefinition(exercise.timeSignature as any);
      const measure = getMeasureStructure(meter, exercise.subdivision as any);
      const steps = measure.map((m) => ({ index: m.position, clickType: m.accentType }));

      metronomeRef.current.onStep((step) => {
        setCurrentStepIndex(step.index % stickingTokens.length);
      });

      metronomeRef.current.start(steps, currentBpm, exercise.subdivision);
      setIsPlaying(true);
    }
  };

  const handleBpmChange = (newBpm: number) => {
    const clamped = clampBpm(newBpm);
    setCurrentBpm(clamped);
    if (isPlaying && metronomeRef.current) {
      metronomeRef.current.setBpm(clamped);
    }
  };

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <header className="rounded-2xl border border-gold-500/30 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-gold-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-gold-400">
              {phase?.title}
            </span>
            <span className="text-xs text-parchment/50">&middot; {exercise.styleLabel}</span>
          </div>
          <StatusBadge status={progress?.status ?? "AVAILABLE"} />
        </div>

        <h1 className="mt-2 text-2xl font-black md:text-3xl">{exercise.name}</h1>
        <p className="mt-2 text-sm text-parchment/80 leading-relaxed">{exercise.description}</p>

        {/* Quick Parameters */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoTile label="Time Signature" value={exercise.timeSignature} />
          <InfoTile label="Subdivision" value={exercise.subdivision} />
          <InfoTile label="Target BPM" value={`${exercise.targetBpm} BPM`} />
          <InfoTile label="Min. Accuracy" value={`${exercise.minimumAccuracy}%`} />
        </div>
      </header>

      {/* WHY IT MATTERS & WHAT YOU WILL LEARN */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-gold-400">
            <Sparkles className="h-4 w-4" />
            What You Will Learn
          </div>
          <p className="mt-2 text-sm text-parchment/80 leading-relaxed">{exercise.purpose}</p>
        </div>

        <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-gold-400">
            <HelpCircle className="h-4 w-4" />
            Why It Matters in Church
          </div>
          <p className="mt-2 text-sm text-parchment/80 leading-relaxed">{exercise.techniqueNotes}</p>
        </div>
      </section>

      {/* INTERACTIVE LISTEN & RHYTHM GRID VISUALIZER */}
      <section className="rounded-2xl border border-charcoal-800 bg-charcoal-900/70 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black text-parchment">Interactive Rhythm Grid & Audio</h2>
            <p className="text-xs text-parchment/50">Listen to the metronome click and follow the active beat cursor.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayback}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition-all ${
                isPlaying
                  ? "bg-danger text-white hover:opacity-90"
                  : "bg-gold-500 text-charcoal-950 hover:bg-gold-400"
              }`}
            >
              {isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              {isPlaying ? "STOP AUDIO" : "HEAR PATTERN"}
            </button>
          </div>
        </div>

        {/* BPM Quick Speed Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-charcoal-800 pt-4">
          <span className="text-xs font-semibold text-parchment/60">Practice Tempo:</span>
          {[60, 70, 80, 90, 100, 110, 120, 130, 140, 150].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleBpmChange(t)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                currentBpm === t
                  ? "bg-gold-500 text-charcoal-950"
                  : "border border-charcoal-700 bg-charcoal-800 text-parchment/70 hover:text-parchment"
              }`}
            >
              {t}
            </button>
          ))}
          <span className="ml-auto font-display text-sm font-bold text-gold-400">{currentBpm} BPM</span>
        </div>

        {/* Sticking Visualizer */}
        <div className="mt-6">
          <StickingVisualizer events={exercise.patternEvents.events} currentStepIndex={currentStepIndex} />
        </div>

        {/* Orchestration Grid */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal-700">
          <table className="w-full min-w-[500px] text-center text-sm">
            <tbody>
              <tr className="border-b border-charcoal-800 bg-charcoal-950/60">
                <th scope="row" className="px-3 py-2.5 text-left font-semibold text-parchment/50 text-xs uppercase">
                  Count
                </th>
                {countLabels.map((label, i) => (
                  <td
                    key={i}
                    className={`px-3 py-2.5 tabular-nums text-xs font-bold transition-colors ${
                      currentStepIndex === i ? "bg-gold-500/20 text-gold-300" : "text-parchment/70"
                    }`}
                  >
                    {label}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-charcoal-800">
                <th scope="row" className="px-3 py-2.5 text-left font-semibold text-parchment/50 text-xs uppercase">
                  Limb
                </th>
                {stickingTokens.map((t, i) => (
                  <td
                    key={i}
                    className={`px-3 py-2.5 font-bold transition-colors ${
                      currentStepIndex === i ? "bg-gold-500 text-charcoal-950 scale-105" : "text-gold-400"
                    }`}
                  >
                    {t}
                  </td>
                ))}
              </tr>
              <tr className="bg-charcoal-950/40">
                <th scope="row" className="px-3 py-2.5 text-left font-semibold text-parchment/50 text-xs uppercase">
                  Voice
                </th>
                {exercise.orchestration.map((step, i) => (
                  <td
                    key={i}
                    className={`px-3 py-2.5 text-xs transition-colors ${
                      currentStepIndex === i ? "bg-gold-500/20 text-parchment font-bold" : "text-parchment/60"
                    }`}
                  >
                    {step.voice}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* COMMON MISTAKES & FIXES */}
      <section className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-6">
        <h2 className="text-base font-bold text-parchment">Common Pitfalls & How to Fix Them</h2>
        <ul className="mt-3 space-y-2">
          {exercise.commonMistakes.map((mistake, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-parchment/80">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-danger/20 font-bold text-danger">
                &times;
              </span>
              <span>
                <strong>Mistake:</strong> {mistake} &mdash; <span className="text-gold-300">Fix: Slow down by 10 BPM and focus on dynamic consistency.</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* MASTERY CRITERIA */}
      <section className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-6">
        <h2 className="text-base font-bold text-parchment">Mastery Standard</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-charcoal-700 bg-charcoal-800/40 p-3">
            <span className="text-parchment/50">Required Accuracy</span>
            <p className="mt-1 font-display text-lg font-bold text-gold-400">{exercise.minimumAccuracy}%</p>
          </div>
          <div className="rounded-xl border border-charcoal-700 bg-charcoal-800/40 p-3">
            <span className="text-parchment/50">Target Tempo</span>
            <p className="mt-1 font-display text-lg font-bold text-gold-400">{exercise.targetBpm} BPM</p>
          </div>
          <div className="rounded-xl border border-charcoal-700 bg-charcoal-800/40 p-3">
            <span className="text-parchment/50">Clean Repetitions</span>
            <p className="mt-1 font-display text-lg font-bold text-gold-400">{exercise.requiredConsecutiveCleanAttempts} in a row</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-charcoal-800 pt-4 sm:flex-row sm:items-center">
          <div className="text-xs text-parchment/60">
            Your stats: {progress?.attemptsCount ?? 0} attempts &middot; {progress?.bestAccuracy ?? 0}% best accuracy &middot;{" "}
            {progress?.cleanBpm ?? 0} BPM clean
          </div>

          <Link
            to={`/practice?exerciseId=${exercise.id}`}
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 py-2.5 text-xs font-bold text-charcoal-950 hover:bg-gold-400"
          >
            <Play className="h-4 w-4 fill-current" />
            PRACTICE THIS LESSON
          </Link>
        </div>
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/curriculum" className="inline-flex items-center gap-1.5 text-xs font-bold text-parchment/60 hover:text-gold-400">
      <ArrowLeft className="h-4 w-4" /> Back to curriculum
    </Link>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/60 p-3 text-center">
      <div className="font-display text-sm font-bold text-parchment">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-parchment/50">{label}</div>
    </div>
  );
}

function buildCountLabels(length: number, subdivision: string, timeSignature: string): string[] {
  if (timeSignature === "6/8") {
    const syllables = ["1", "la", "le", "2", "la", "le"];
    return Array.from({ length }, (_, i) => syllables[i % 6] ?? String(i + 1));
  }
  if (timeSignature === "12/8") {
    const syllables = ["1", "la", "le", "2", "la", "le", "3", "la", "le", "4", "la", "le"];
    return Array.from({ length }, (_, i) => syllables[i % 12] ?? String(i + 1));
  }
  if (subdivision === "16th") {
    const syllables = ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a"];
    return Array.from({ length }, (_, i) => syllables[i % 16] ?? String(i + 1));
  }
  if (subdivision === "8th") {
    const syllables = ["1", "&", "2", "&", "3", "&", "4", "&"];
    return Array.from({ length }, (_, i) => syllables[i % 8] ?? String(i + 1));
  }
  return Array.from({ length }, (_, i) => String(i + 1));
}
