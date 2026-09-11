import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useMetronome } from "../hooks/useMetronome";
import { buildStepsFromPattern } from "../audio/PatternScheduler";
import { StickingVisualizer } from "../components/StickingVisualizer";
import { MetronomeControls } from "../components/MetronomeControls";
import { PerformanceLogForm, type PerformanceLogValues } from "../components/PerformanceLogForm";
import { getExercise } from "../data/curriculum";
import { recordAttempt, type RecordAttemptResult } from "../services/performanceAnalysisService";
import { AppError } from "../lib/errors";
import type { LessonPart } from "../lib/types";

type Phase = "countdown" | "play" | "log" | "result";

function newClientAttemptId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function LessonPartRunner({
  part,
  sessionId,
  onComplete,
}: {
  part: LessonPart;
  sessionId: string | null;
  onComplete: (result: RecordAttemptResult) => void;
}) {
  const exercise = getExercise(part.exerciseId);
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<RecordAttemptResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const steps = exercise ? buildStepsFromPattern(exercise.patternEvents.events) : [];
  const metronome = useMetronome({
    steps,
    subdivision: exercise?.subdivision ?? "16th",
    initialBpm: part.targetBpm,
  });

  // No reset-on-part-change effect here: Practice.tsx keys this component
  // by `activePart.exerciseId + stage`, so a new part is a fresh mount —
  // the useState initializers above already start at "countdown"/3/null/
  // null, which is exactly what a reset would have produced.

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      // This is the countdown timer's own state-machine transition
      // (3-2-1-Go → play), not a "reset state when a prop changed" effect;
      // there's no key-based remount equivalent for a timer reaching zero.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("play");
      return;
    }
    const id = window.setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => window.clearTimeout(id);
  }, [phase, countdown]);

  function handleFinish() {
    metronome.stop();
    setPhase("log");
  }

  function handleLogSubmit(values: PerformanceLogValues) {
    setSubmitError(null);
    try {
      const attemptResult = recordAttempt({
        clientAttemptId: newClientAttemptId(),
        exerciseId: part.exerciseId,
        sessionId,
        cleanBpm: values.cleanBpm,
        maximumBpm: values.maximumBpm,
        accuracy: values.accuracy,
        durationMinutes: values.durationMinutes,
        perceivedDifficulty: values.perceivedDifficulty,
        notes: values.notes || null,
      });
      setResult(attemptResult);
      setPhase("result");
    } catch (err) {
      setSubmitError(err instanceof AppError ? err.message : "Could not save this attempt.");
    }
  }

  if (!exercise) return null;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold-400">
          Part {part.part} &middot; {part.duration} min
        </p>
        <h2 className="text-xl font-bold">{part.title}</h2>
        <p className="text-sm text-parchment/60">{part.exerciseName}</p>
      </div>

      {phase === "countdown" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <span className="text-7xl font-black text-gold-400">{countdown > 0 ? countdown : "Go"}</span>
          <p className="max-w-md text-center text-parchment/70">{part.instructions}</p>
        </div>
      )}

      {phase === "play" && (
        <div className="space-y-6">
          <p className="rounded-lg border border-charcoal-700 bg-charcoal-900/50 p-3 text-sm text-parchment/70">{part.instructions}</p>
          <StickingVisualizer events={exercise.patternEvents.events} currentStepIndex={metronome.currentStepIndex} large />
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
          />
          <button
            type="button"
            onClick={handleFinish}
            className="w-full rounded-md border border-gold-500 py-3 font-bold text-gold-300 hover:bg-gold-500/10"
          >
            Finish & Log Result
          </button>
        </div>
      )}

      {phase === "log" && (
        <PerformanceLogForm defaultDuration={part.duration} defaultBpm={part.targetBpm} onSubmit={handleLogSubmit} submitting={false} />
      )}
      {submitError && (
        <p role="alert" className="text-sm text-red-400">
          {submitError}
        </p>
      )}

      {phase === "result" && result && (
        <div className="space-y-4 rounded-xl border border-gold-600/40 bg-charcoal-900/60 p-5">
          <p className="flex items-center gap-2 font-bold text-gold-300">
            <CheckCircle2 className="h-5 w-5" />
            {result.exerciseMastered ? "EXERCISE MASTERED" : "Attempt recorded"}
          </p>
          <p className="text-parchment/80">{result.recommendation}</p>
          <p className="text-sm text-parchment/50">Suggested next tempo: {result.suggestedNextBpm} BPM</p>
          <button
            type="button"
            onClick={() => onComplete(result)}
            className="w-full rounded-md bg-gold-500 py-3 font-bold text-charcoal-950 hover:bg-gold-400"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
