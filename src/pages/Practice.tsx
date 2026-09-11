import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { useImmersive } from "../context/ImmersiveContext";
import { generateTodayLesson, readTodayLesson, startTodaySession, completeSession } from "../services/practicePlannerService";
import { getProgressSummary } from "../services/progressService";
import { LessonPartRunner } from "../components/LessonPartRunner";
import { useWakeLock } from "../hooks/useWakeLock";
import type { RecordAttemptResult } from "../services/performanceAnalysisService";

type Stage = "intro" | number | "summary"; // number = active part index (0-3)

// The guided session flow. Everything — instructions, metronome, sticking
// visualization, and the performance log — happens on this one page; the
// user never has to navigate away to record a result. Section 110: while a
// lesson part is active, the app switches to an immersive fullscreen-style
// mode (no header/bottom nav) via ImmersiveContext.
export function Practice() {
  const { user } = useAppContext();
  const timezone = user!.timezone;
  const wakeLock = useWakeLock();
  const { setImmersive } = useImmersive();

  useEffect(() => {
    generateTodayLesson(timezone);
  }, [timezone]);

  useLocalDbVersion();
  const lesson = readTodayLesson(timezone);

  const [stage, setStage] = useState<Stage>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [results, setResults] = useState<RecordAttemptResult[]>([]);

  useEffect(() => {
    setImmersive(typeof stage === "number");
  }, [stage, setImmersive]);

  useEffect(() => {
    return () => setImmersive(false);
  }, [setImmersive]);

  function beginSession() {
    const id = startTodaySession(timezone);
    setSessionId(id);
    wakeLock.request();
    setStage(0);
  }

  function handlePartComplete(result: RecordAttemptResult) {
    setResults((prev) => [...prev, result]);
    const currentIndex = typeof stage === "number" ? stage : 0;
    if (currentIndex < 3) {
      setStage(currentIndex + 1);
    } else {
      finishSession();
    }
  }

  function finishSession() {
    if (sessionId) completeSession(sessionId);
    wakeLock.release();
    setStage("summary");
  }

  function exitPractice() {
    wakeLock.release();
    setStage("intro");
  }

  if (!lesson) return null;

  if (stage === "intro") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold-400">{lesson.phaseTitle}</p>
          <h1 className="text-2xl font-black">Today's 55-Minute Session</h1>
          <p className="mt-2 text-parchment/70">{lesson.coachMessage}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {lesson.lessonParts.map((part) => (
            <div key={part.part} className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
              <p className="text-xs uppercase tracking-widest text-parchment/50">
                Part {part.part} &middot; {part.duration} min
              </p>
              <p className="font-bold">{part.title}</p>
              <p className="text-sm text-parchment/60">{part.exerciseName}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={beginSession}
          className="w-full rounded-full bg-gold-500 py-4 text-lg font-bold text-charcoal-950 hover:bg-gold-400 sm:w-auto sm:px-10"
        >
          Begin Session
        </button>
      </div>
    );
  }

  if (stage === "summary") {
    const masteredCount = results.filter((r) => r.exerciseMastered).length;
    return <SessionSummary totalMinutes={lesson.totalMinutes} exerciseCount={lesson.lessonParts.length} masteredCount={masteredCount} />;
  }

  const activePart = lesson.lessonParts[stage];
  if (!activePart) return null;

  return (
    <div>
      <button
        type="button"
        onClick={exitPractice}
        className="mb-4 flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-parchment/60 hover:text-parchment"
      >
        <X className="h-4 w-4" /> Exit Practice
      </button>
      <LessonPartRunner key={activePart.exerciseId + stage} part={activePart} sessionId={sessionId} onComplete={handlePartComplete} />
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
      <div className="text-2xl font-black tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wide text-parchment/50">{label}</div>
    </div>
  );
}

// Real, computed-fresh-every-render numbers only — never a client-side
// estimate that could drift from what's actually stored.
function SessionSummary({
  totalMinutes,
  exerciseCount,
  masteredCount,
}: {
  totalMinutes: number;
  exerciseCount: number;
  masteredCount: number;
}) {
  const { user } = useAppContext();
  useLocalDbVersion();
  const progress = getProgressSummary(user!.timezone);

  return (
    <div className="space-y-6 text-center">
      <Flame className="mx-auto h-10 w-10 text-gold-400" />
      <h1 className="text-2xl font-black">Session Complete</h1>
      <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
        <SummaryTile label="Minutes" value={totalMinutes} />
        <SummaryTile label="Exercises" value={exerciseCount} />
        <SummaryTile label="Mastered" value={masteredCount} />
        <SummaryTile label="Avg Accuracy" value={progress.hasAnyData ? `${progress.averageAccuracy}%` : "—"} />
        <SummaryTile label="Best BPM" value={progress.bestBpm || "—"} />
        <SummaryTile label="Streak" value={`${progress.streak.currentStreak}d`} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <Link to="/" className="rounded-full bg-gold-500 px-8 py-3 font-bold text-charcoal-950 hover:bg-gold-400">
          Back to Dashboard
        </Link>
        <Link to="/progress" className="text-sm text-parchment/60 hover:text-parchment">
          View your progress →
        </Link>
      </div>
    </div>
  );
}
