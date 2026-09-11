import { useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { LoadingState, ErrorState } from "../components/StatusStates";
import { LessonPartRunner } from "../components/LessonPartRunner";
import { useWakeLock } from "../hooks/useWakeLock";
import { api, ApiError } from "../lib/apiClient";
import type { DailyLesson, ProgressSummary } from "../lib/types";
import type { SubmitOutcome } from "../lib/attempts";
import { Flame } from "lucide-react";

type Stage = "intro" | number | "summary"; // number = active part index (0-3)

// Section 17/78-80: the guided session flow. Everything — instructions,
// metronome, sticking visualization, and the performance log — happens on
// this one page; the user never has to navigate away to record a result.
export function Practice() {
  const lesson = useFetch<DailyLesson>("/practice/today");
  const wakeLock = useWakeLock();

  const [stage, setStage] = useState<Stage>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<SubmitOutcome[]>([]);

  async function beginSession() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await api.post<{ session: { id: string } }>("/practice/session");
      setSessionId(res.session.id);
      await wakeLock.request();
      setStage(0);
    } catch (err) {
      setStartError(err instanceof ApiError ? err.message : "Could not start today's session.");
    } finally {
      setStarting(false);
    }
  }

  async function handlePartComplete(outcome: SubmitOutcome) {
    setOutcomes((prev) => [...prev, outcome]);
    const currentIndex = typeof stage === "number" ? stage : 0;
    if (currentIndex < 3) {
      setStage(currentIndex + 1);
    } else {
      await finishSession();
    }
  }

  async function finishSession() {
    if (sessionId) {
      await api.patch(`/practice/session/${sessionId}/complete`, {}).catch(() => null);
    }
    await wakeLock.release();
    setStage("summary");
  }

  if (lesson.loading) return <LoadingState label="Preparing today's session..." />;
  if (lesson.error) return <ErrorState message={lesson.error.message} onRetry={lesson.refetch} />;
  if (!lesson.data) return null;

  if (stage === "intro") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold-400">{lesson.data.phaseTitle}</p>
          <h1 className="text-2xl font-black">Today's 55-Minute Session</h1>
          <p className="mt-2 text-parchment/70">{lesson.data.coachMessage}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {lesson.data.lessonParts.map((part) => (
            <div key={part.part} className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
              <p className="text-xs uppercase tracking-widest text-parchment/50">
                Part {part.part} &middot; {part.duration} min
              </p>
              <p className="font-bold">{part.title}</p>
              <p className="text-sm text-parchment/60">{part.exerciseName}</p>
            </div>
          ))}
        </div>

        {startError && (
          <p role="alert" className="text-sm text-red-400">
            {startError}
          </p>
        )}

        <button
          type="button"
          onClick={beginSession}
          disabled={starting}
          className="w-full rounded-full bg-gold-500 py-4 text-lg font-bold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {starting ? "Starting..." : "Begin Session"}
        </button>
      </div>
    );
  }

  if (stage === "summary") {
    const results = outcomes.map((o) => o.result).filter((r): r is NonNullable<typeof r> => r != null);
    const masteredCount = results.filter((r) => r.exerciseMastered).length;
    return (
      <SessionSummary totalMinutes={lesson.data.totalMinutes} exerciseCount={lesson.data.lessonParts.length} masteredCount={masteredCount} />
    );
  }

  const activePart = lesson.data.lessonParts[stage];
  if (!activePart) return null;

  return <LessonPartRunner key={activePart.exerciseId + stage} part={activePart} sessionId={sessionId} onComplete={handlePartComplete} />;
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
      <div className="text-2xl font-black tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wide text-parchment/50">{label}</div>
    </div>
  );
}

// Section 80: real, server-computed numbers only — never a client-side
// estimate of accuracy or streak.
function SessionSummary({
  totalMinutes,
  exerciseCount,
  masteredCount,
}: {
  totalMinutes: number;
  exerciseCount: number;
  masteredCount: number;
}) {
  const progress = useFetch<ProgressSummary>("/progress");

  return (
    <div className="space-y-6 text-center">
      <Flame className="mx-auto h-10 w-10 text-gold-400" />
      <h1 className="text-2xl font-black">Session Complete</h1>
      <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
        <SummaryTile label="Minutes" value={totalMinutes} />
        <SummaryTile label="Exercises" value={exerciseCount} />
        <SummaryTile label="Mastered" value={masteredCount} />
        <SummaryTile label="Avg Accuracy" value={progress.data?.hasAnyData ? `${progress.data.averageAccuracy}%` : "—"} />
        <SummaryTile label="Best BPM" value={progress.data?.bestBpm || "—"} />
        <SummaryTile label="Streak" value={progress.data ? `${progress.data.streak.currentStreak}d` : "—"} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <Link to="/dashboard" className="rounded-full bg-gold-500 px-8 py-3 font-bold text-charcoal-950 hover:bg-gold-400">
          Back to Dashboard
        </Link>
        <Link to="/progress" className="text-sm text-parchment/60 hover:text-parchment">
          View your progress →
        </Link>
      </div>
    </div>
  );
}
