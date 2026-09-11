import { useEffect, useState } from "react";
import { CheckCircle2, WifiOff } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { useMetronome } from "../hooks/useMetronome";
import { buildStepsFromPattern } from "../audio/PatternScheduler";
import { StickingVisualizer } from "../components/StickingVisualizer";
import { MetronomeControls } from "../components/MetronomeControls";
import { PerformanceLogForm, type PerformanceLogValues } from "../components/PerformanceLogForm";
import { LoadingState, ErrorState } from "../components/StatusStates";
import { submitAttempt, newClientAttemptId } from "../lib/attempts";
import type { ExerciseDetail, LessonPart } from "../lib/types";
import type { SubmitOutcome } from "../lib/attempts";

type Phase = "countdown" | "play" | "log" | "result";

export function LessonPartRunner({
  part,
  sessionId,
  onComplete,
}: {
  part: LessonPart;
  sessionId: string | null;
  onComplete: (outcome: SubmitOutcome) => void;
}) {
  const exercise = useFetch<ExerciseDetail>(`/exercises/${part.exerciseId}`, [part.exerciseId]);
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const steps = exercise.data ? buildStepsFromPattern(exercise.data.patternEvents.events) : [];
  const metronome = useMetronome({
    steps,
    subdivision: exercise.data?.subdivision ?? "16th",
    initialBpm: part.targetBpm,
  });

  useEffect(() => {
    setPhase("countdown");
    setCountdown(3);
    setOutcome(null);
    setSubmitError(null);
  }, [part.exerciseId]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
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

  async function handleLogSubmit(values: PerformanceLogValues) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitAttempt({
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
      setOutcome(result);
      setPhase("result");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save this attempt.");
    } finally {
      setSubmitting(false);
    }
  }

  if (exercise.loading) return <LoadingState label="Loading exercise..." />;
  if (exercise.error || !exercise.data) return <ErrorState message={exercise.error?.message} onRetry={exercise.refetch} />;

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
          <StickingVisualizer events={exercise.data.patternEvents.events} currentStepIndex={metronome.currentStepIndex} large />
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
        <PerformanceLogForm defaultDuration={part.duration} defaultBpm={part.targetBpm} onSubmit={handleLogSubmit} submitting={submitting} />
      )}
      {submitError && (
        <p role="alert" className="text-sm text-red-400">
          {submitError}
        </p>
      )}

      {phase === "result" && outcome && (
        <div className="space-y-4 rounded-xl border border-gold-600/40 bg-charcoal-900/60 p-5">
          {outcome.queued ? (
            <p className="flex items-center gap-2 text-amber-300">
              <WifiOff className="h-5 w-5" /> Saved offline. Will sync when connection returns.
            </p>
          ) : (
            <>
              <p className="flex items-center gap-2 font-bold text-gold-300">
                <CheckCircle2 className="h-5 w-5" />
                {outcome.result?.exerciseMastered ? "EXERCISE MASTERED" : "Attempt recorded"}
              </p>
              <p className="text-parchment/80">{outcome.result?.recommendation}</p>
              <p className="text-sm text-parchment/50">Suggested next tempo: {outcome.result?.suggestedNextBpm} BPM</p>
            </>
          )}
          <button
            type="button"
            onClick={() => onComplete(outcome)}
            className="w-full rounded-md bg-gold-500 py-3 font-bold text-charcoal-950 hover:bg-gold-400"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
