import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { useImmersive } from "../context/ImmersiveContext";
import { generateTodayLesson, readTodayLesson, startTodaySession, completeSession } from "../services/practicePlannerService";
import { getProgressSummary } from "../services/progressService";
import { checkAndUnlockAchievements } from "../services/achievementService";
import { getAchievementDefinition, type AchievementId } from "../data/achievements";
import { LessonPartRunner } from "../components/LessonPartRunner";
import { ActionSheet } from "../components/ui/ActionSheet";
import { useWakeLock } from "../hooks/useWakeLock";
import type { RecordAttemptResult } from "../services/performanceAnalysisService";

type Stage = "intro" | number | "summary"; // number = active part index (0-3)

// The guided session flow. Everything — instructions, metronome, sticking
// visualization, and the performance log — happens on this one page; the
// user never has to navigate away to record a result. While a lesson part
// is active, the app switches to an immersive fullscreen-style mode (no
// header/bottom nav) via ImmersiveContext.
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
  const [startingBestBpm, setStartingBestBpm] = useState(0);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<AchievementId[]>([]);

  useEffect(() => {
    setImmersive(typeof stage === "number");
  }, [stage, setImmersive]);

  useEffect(() => {
    return () => setImmersive(false);
  }, [setImmersive]);

  function beginSession() {
    const id = startTodaySession(timezone);
    setSessionId(id);
    setStartingBestBpm(getProgressSummary(timezone).bestBpm);
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
    setNewlyUnlocked(checkAndUnlockAchievements(timezone));
    wakeLock.release();
    setStage("summary");
  }

  // Section 23 (UX spec): leaving mid-shed is never framed as losing
  // progress — every part already finished stays saved either way (each
  // one is recorded independently by LessonPartRunner as it happens, via
  // recordAttempt, regardless of how the session as a whole ends).
  //
  // The session itself is only marked COMPLETED (which is what the streak
  // and "minutes practiced" stats count) if at least one part was actually
  // finished — bailing out at 0/4 parts must not count as a practiced day,
  // and the minutes recorded reflect only the parts actually done, not the
  // full planned session length.
  function confirmExit() {
    setExitConfirmOpen(false);
    if (sessionId && results.length > 0) {
      const minutesDone = lesson!.lessonParts.slice(0, results.length).reduce((sum, p) => sum + p.duration, 0);
      completeSession(sessionId, minutesDone);
      // Persisted silently here (no popup) — the exit flow is about
      // leaving, not celebrating; the Achievements page reflects the
      // unlock next time it's opened.
      checkAndUnlockAchievements(timezone);
    }
    wakeLock.release();
    setStage("intro");
  }

  if (!lesson) return null;

  if (stage === "intro") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold-400">{lesson.phaseTitle}</p>
          <h1 className="text-2xl font-black">Today's Shed</h1>
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
          START
        </button>
      </div>
    );
  }

  if (stage === "summary") {
    const masteredCount = results.filter((r) => r.exerciseMastered).length;
    return (
      <SessionSummary
        totalMinutes={lesson.totalMinutes}
        exerciseCount={results.length}
        masteredCount={masteredCount}
        startingBestBpm={startingBestBpm}
        newlyUnlocked={newlyUnlocked}
      />
    );
  }

  const activePart = lesson.lessonParts[stage];
  if (!activePart) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExitConfirmOpen(true)}
        className="mb-4 flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-parchment/60 hover:text-parchment"
      >
        <X className="h-4 w-4" /> Exit Shed
      </button>
      <LessonPartRunner key={activePart.exerciseId + stage} part={activePart} sessionId={sessionId} onComplete={handlePartComplete} />

      <ActionSheet open={exitConfirmOpen} onClose={() => setExitConfirmOpen(false)} title="Leave the shed?">
        <div className="space-y-4">
          <p className="text-sm text-parchment/70">Your progress from this session will be saved.</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setExitConfirmOpen(false)}
              className="min-h-[44px] w-full rounded-md bg-gold-500 py-3 font-bold text-charcoal-950 hover:bg-gold-400"
            >
              Keep Shedding
            </button>
            <button
              type="button"
              onClick={confirmExit}
              className="min-h-[44px] w-full rounded-md border border-charcoal-600 py-3 font-semibold text-parchment/70 hover:bg-charcoal-800"
            >
              Save & Exit
            </button>
          </div>
        </div>
      </ActionSheet>
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
// estimate that could drift from what's actually stored. Section 24/25:
// the completion screen names one concrete win rather than only listing
// statistics.
export function SessionSummary({
  totalMinutes,
  exerciseCount,
  masteredCount,
  startingBestBpm,
  newlyUnlocked,
}: {
  totalMinutes: number;
  exerciseCount: number;
  masteredCount: number;
  startingBestBpm: number;
  newlyUnlocked: AchievementId[];
}) {
  const { user } = useAppContext();
  useLocalDbVersion();
  const progress = getProgressSummary(user!.timezone);

  const win =
    masteredCount > 0
      ? `You mastered ${masteredCount} exercise${masteredCount > 1 ? "s" : ""} today. That's real progress.`
      : progress.bestBpm > startingBestBpm
        ? `Your clean BPM improved from ${startingBestBpm || 0} → ${progress.bestBpm}.`
        : "You showed up and put in the work. That's how it's built.";

  return (
    <div className="space-y-6 text-center">
      <Flame className="mx-auto h-10 w-10 text-gold-400" />
      <h1 className="text-2xl font-black">Shed Complete</h1>
      <p className="text-parchment/70">{totalMinutes} minutes</p>

      <div className="mx-auto max-w-md rounded-xl border border-gold-600/40 bg-charcoal-900/60 p-4">
        <p className="text-xs uppercase tracking-widest text-gold-400">Your Win</p>
        <p className="mt-1 text-parchment/80">{win}</p>
      </div>

      {newlyUnlocked.length > 0 && (
        <div className="mx-auto max-w-md space-y-2">
          {newlyUnlocked.map((id) => {
            const def = getAchievementDefinition(id);
            if (!def) return null;
            return (
              <div key={id} className="flex items-center gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-3 text-left">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-500/50 text-gold-300">
                  <Flame className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-gold-400">Achievement Unlocked</p>
                  <p className="text-sm font-bold">{def.title}</p>
                </div>
              </div>
            );
          })}
          {/* This is the one moment an achievement is actually relevant to
              the user, so it's the natural place to point at the full
              Achievements page — not a permanent link on every completion
              screen, which would be clutter on the far-more-common day with
              nothing newly unlocked. */}
          <Link to="/achievements" className="inline-flex items-center gap-1 text-sm font-medium text-gold-400 hover:text-gold-300">
            See all achievements →
          </Link>
        </div>
      )}

      <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
        <SummaryTile label="Exercises" value={exerciseCount} />
        <SummaryTile label="Mastered" value={masteredCount} />
        <SummaryTile label="Avg Accuracy" value={progress.hasAnyData ? `${progress.averageAccuracy}%` : "—"} />
        <SummaryTile label="Streak" value={`${progress.streak.currentStreak}d`} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <Link to="/" className="rounded-full bg-gold-500 px-8 py-3 font-bold text-charcoal-950 hover:bg-gold-400">
          Done
        </Link>
        <Link to="/progress" className="text-sm text-parchment/60 hover:text-parchment">
          View your progress →
        </Link>
      </div>
    </div>
  );
}
