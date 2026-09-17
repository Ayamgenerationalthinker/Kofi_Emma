import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Lock,
  ArrowLeft,
  Play,
  Square,
  Sparkles,
  HelpCircle,
  Volume2,
  CheckCircle2,
  Layers,
  Flame,
  ArrowRight,
  BookOpen,
  Award,
} from "lucide-react";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getDb } from "../lib/localDb";
import { getExercise, getPhase, type CurriculumExercise } from "../data/curriculum";
import { canAccessExercise, getNextAvailableExercise } from "../services/curriculumService";
import { recordAttempt } from "../services/performanceAnalysisService";
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
    return <EmptyState message="This lesson doesn't exist." />;
  }

  return <ExerciseDetailView exercise={exercise} />;
}

function ExerciseDetailView({ exercise }: { exercise: CurriculumExercise }) {
  const navigate = useNavigate();
  const db = getDb();
  const progress = db.progress[exercise.id];
  const accessible = canAccessExercise(exercise.id);
  const phase = getPhase(exercise.phaseId);

  // Metronome & Audio preview
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(exercise.targetBpm);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [completing, setCompleting] = useState(false);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const metronomeRef = useRef<MetronomeEngine | null>(null);
  const timerRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setPracticeSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  if (!accessible) {
    const prerequisites = exercise.prerequisiteIds
      .map((id) => getExercise(id))
      .filter((e): e is NonNullable<typeof e> => !e);
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-charcoal-700 bg-charcoal-900/50 p-10 text-center shadow-xl">
          <div className="rounded-full bg-charcoal-800 p-4 text-parchment/40">
            <Lock className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-bold text-parchment">{exercise.name}</h1>
          <p className="text-sm text-parchment/60 max-w-md">
            This lesson is locked.
            {prerequisites.length > 0 ? (
              <> Complete <strong>{prerequisites.map((p) => p.name).join(", ")}</strong> first.</>
            ) : (
              " Complete earlier stages in your journey to unlock."
            )}
          </p>
          <Link
            to="/learn"
            className="mt-4 rounded-xl bg-gold-500 px-5 py-2.5 text-xs font-bold text-charcoal-950 hover:bg-gold-400"
          >
            View Journey Roadmap
          </Link>
        </div>
      </div>
    );
  }

  const stickingTokens = exercise.stickingPattern.split(" ").filter(Boolean);

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

  const handleCompleteLesson = () => {
    setCompleting(true);
    try {
      const clientAttemptId = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      recordAttempt({
        exerciseId: exercise.id,
        cleanBpm: currentBpm,
        accuracy: 98,
        durationMinutes: 5,
        clientAttemptId,
      });

      const next = getNextAvailableExercise();
      if (next && next.exercise.id !== exercise.id) {
        navigate(`/curriculum/${next.exercise.id}`);
      } else {
        navigate("/learn");
      }
    } finally {
      setCompleting(false);
    }
  };

  const isMastered = progress?.status === "MASTERED";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in">
      <BackLink />

      {/* Lesson Header */}
      <header className="rounded-3xl border border-gold-500/40 bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-charcoal-950 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-300">
              {phase?.title}
            </span>
            <span className="text-xs text-parchment/50">&middot; {exercise.styleLabel}</span>
          </div>
          <StatusBadge status={progress?.status ?? "AVAILABLE"} />
        </div>

        <h1 className="mt-3 text-2xl font-black text-parchment md:text-4xl">{exercise.name}</h1>
        <p className="mt-2 text-sm text-parchment/80 leading-relaxed">{exercise.description}</p>

        {/* Source Attribution Tag */}
        {exercise.source && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-charcoal-700 bg-charcoal-950/60 px-3 py-1.5 text-xs text-parchment/60">
            <BookOpen className="h-3.5 w-3.5 text-gold-400" />
            <span>
              Source: <strong className="text-parchment/90">{exercise.source.name}</strong>
              {exercise.source.chapter ? ` — ${exercise.source.chapter}` : ""}
              {exercise.source.page ? ` (p. ${exercise.source.page})` : ""}
            </span>
          </div>
        )}
      </header>

      {/* 1. UNDERSTAND & WHY */}
      <section className="rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-6 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <Sparkles className="h-4 w-4" /> 1. Understand & Purpose
        </div>
        <h2 className="mt-1 text-base font-bold text-parchment">Why You Are Learning This</h2>
        <p className="mt-2 text-sm text-parchment/80 leading-relaxed">{exercise.purpose}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {exercise.skills?.map((skill) => (
            <span
              key={skill}
              className="rounded-lg border border-charcoal-700 bg-charcoal-800/80 px-2.5 py-1 text-xs font-medium text-parchment/70"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* 2. LISTEN & VISUALIZE */}
      <section className="rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
            <Volume2 className="h-4 w-4" /> 2. Sticking & Visualizer
          </div>
          <span className="text-xs font-bold text-parchment/60">
            {exercise.timeSignature} &middot; {exercise.subdivision}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-charcoal-800 bg-charcoal-950 p-4">
          <StickingVisualizer
            events={exercise.patternEvents.events}
            currentStepIndex={currentStepIndex}
          />
        </div>

        {/* Voice Orchestration */}
        <div className="mt-4 flex flex-wrap gap-2">
          {exercise.orchestration.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-lg border border-charcoal-800 bg-charcoal-950/80 px-2.5 py-1 text-xs"
            >
              <span className="font-mono font-bold text-gold-400">{step.limb}</span>
              <span className="text-parchment/60">&rarr; {step.voice}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. INTERACTIVE PRACTICE ENGINE */}
      <section className="rounded-3xl border border-gold-500/30 bg-charcoal-900/90 p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
            <Flame className="h-4 w-4 text-amber-400" /> 3. Interactive Practice Engine
          </div>
          {isPlaying && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Practicing {Math.floor(practiceSeconds / 60)}:{(practiceSeconds % 60).toString().padStart(2, "0")}
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Play/Stop Large CTA */}
          <button
            type="button"
            onClick={togglePlayback}
            className={[
              "flex min-h-[56px] min-w-[180px] items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-black shadow-lg transition-all active:scale-95",
              isPlaying
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gold-500 text-charcoal-950 hover:bg-gold-400 hover:shadow-gold-500/20",
            ].join(" ")}
          >
            {isPlaying ? (
              <>
                <Square className="h-5 w-5 fill-current" /> Stop Metronome
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current" /> Start Practice
              </>
            )}
          </button>

          {/* Tempo Controls */}
          <div className="w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-parchment/60">Tempo:</span>
              <span className="text-base font-black text-gold-400">{currentBpm} BPM</span>
            </div>
            <input
              type="range"
              min={exercise.minimumBpm}
              max={exercise.maximumBpm}
              value={currentBpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="w-full accent-gold-500"
            />
            <div className="flex justify-between text-[11px] text-parchment/40">
              <span>Min: {exercise.minimumBpm}</span>
              <span>Target: {exercise.targetBpm}</span>
              <span>Max: {exercise.maximumBpm}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TECHNIQUE & COMMON MISTAKES */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-400">
            <Sparkles className="h-4 w-4" /> Technique Keys
          </div>
          <p className="mt-2 text-xs text-parchment/80 leading-relaxed">{exercise.techniqueNotes}</p>
        </div>

        <div className="rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <HelpCircle className="h-4 w-4" /> Common Mistakes
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-parchment/70 list-disc list-inside leading-relaxed">
            {exercise.commonMistakes.map((mistake, idx) => (
              <li key={idx}>{mistake}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. MUSICAL APPLICATION */}
      {exercise.applications && exercise.applications.length > 0 && (
        <section className="rounded-2xl border border-gold-500/30 bg-charcoal-900/60 p-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
            <Layers className="h-4 w-4" /> 5. Musical Drum Set Application
          </div>
          <h3 className="mt-1 text-sm font-bold text-parchment">Apply It on the Kit</h3>
          <p className="mt-1 text-xs text-parchment/70">
            Take this pattern from the practice pad to the drum set:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {exercise.applications.map((appId) => {
              const appExercise = getExercise(appId);
              if (!appExercise) return null;
              return (
                <Link
                  key={appId}
                  to={`/curriculum/${appId}`}
                  className="flex items-center gap-2 rounded-xl border border-charcoal-700 bg-charcoal-800/80 px-3 py-2 text-xs font-semibold text-gold-300 hover:border-gold-500/50 hover:bg-charcoal-800"
                >
                  <span>{appExercise.name}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. MASTERY CRITERIA & UNLOCK NEXT */}
      <section className="rounded-3xl border border-gold-500/40 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <Award className="h-4 w-4" /> 6. Mastery & Progression
        </div>

        <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-parchment">
              {isMastered ? "Lesson Mastered!" : "Mastery Requirements"}
            </h3>
            <p className="mt-1 text-xs text-parchment/70">
              {isMastered
                ? `You have mastered this exercise at ${progress?.cleanBpm ?? exercise.targetBpm} BPM.`
                : `Play cleanly at target tempo (${exercise.targetBpm} BPM) with consistent dynamic control.`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCompleteLesson}
            disabled={completing}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-black text-charcoal-950 hover:bg-gold-400 shadow-md active:scale-95 disabled:opacity-50"
          >
            {isMastered ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-charcoal-950" /> Continue to Next Lesson
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-charcoal-950" /> Complete & Unlock Next
              </>
            )}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/learn"
      className="inline-flex items-center gap-1.5 text-xs font-bold text-parchment/60 hover:text-gold-400 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Learning Journey
    </Link>
  );
}
