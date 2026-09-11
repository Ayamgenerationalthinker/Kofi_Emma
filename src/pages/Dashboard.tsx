import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PlayCircle, Flame, Gauge, Percent, Clock, Trophy, Lock } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getCurriculumState } from "../services/curriculumService";
import { getExercise } from "../data/curriculum";
import { getProgressSummary } from "../services/progressService";
import { generateTodayLesson, readTodayLesson } from "../services/practicePlannerService";
import { ProgressBar } from "../components/ProgressBar";
import type { ProgressSummary, DailyLesson } from "../lib/types";

function buildCoachMessage(progress: ProgressSummary, lesson: DailyLesson | null): string {
  if (lesson?.wasRecoverySession) {
    return "Yesterday's session was missed. Today includes a short recovery review — the curriculum stays exactly where you left it.";
  }
  if (!progress.hasAnyData) {
    return "Today's lesson is ready. Clean first. Fast later.";
  }
  if (progress.averageAccuracy >= 92) {
    return "Your accuracy is excellent. Keep pushing tempo gradually while holding that consistency.";
  }
  if (progress.averageAccuracy < 80) {
    return "Speed is ahead of control right now. Drop 5 BPM on your next attempt and rebuild consistency.";
  }
  return "Your timing is stabilizing. Keep the pocket and let tempo rise on its own.";
}

export function Dashboard() {
  const { user } = useAppContext();
  const timezone = user!.timezone;

  useEffect(() => {
    generateTodayLesson(timezone);
  }, [timezone]);

  useLocalDbVersion();
  const state = getCurriculumState();
  const progress = getProgressSummary(timezone);
  const lesson = readTodayLesson(timezone);
  const currentExercise = state.currentExerciseId ? getExercise(state.currentExerciseId) : null;
  const currentPhase = state.phases.find((p) => p.number === state.currentPhaseNumber);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gold-600/30 bg-gradient-to-br from-charcoal-900 to-charcoal-800 p-6">
        <p className="text-xs uppercase tracking-widest text-gold-400">Phase {currentPhase?.number ?? 1}</p>
        <h1 className="mt-1 text-2xl font-black">{currentPhase?.title ?? "The Foundation & Highlife Pocket"}</h1>
        <p className="mt-3 max-w-2xl text-parchment/70">{buildCoachMessage(progress, lesson)}</p>

        <Link
          to="/practice"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-500 px-6 py-3 font-bold text-charcoal-950 hover:bg-gold-400"
        >
          <PlayCircle className="h-5 w-5" />
          START TODAY'S PRACTICE
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Curriculum Progress</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {state.phases.map((phase) => (
            <div key={phase.id} className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">
                  Phase {phase.number}: {phase.title}
                </span>
                {phase.status === "LOCKED" && <Lock className="h-4 w-4 text-parchment/40" aria-label="Locked" />}
              </div>
              <ProgressBar value={phase.progress} label={`${phase.masteredExercises}/${phase.totalExercises} mastered`} />
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={<Gauge className="h-5 w-5" />} label="Best BPM" value={progress.bestBpm || "—"} />
        <StatTile icon={<Percent className="h-5 w-5" />} label="Accuracy" value={progress.hasAnyData ? `${progress.averageAccuracy}%` : "—"} />
        <StatTile icon={<Flame className="h-5 w-5" />} label="Streak" value={`${progress.streak.currentStreak}d`} />
        <StatTile icon={<Clock className="h-5 w-5" />} label="Minutes" value={progress.totalMinutesPracticed} />
        <StatTile icon={<Trophy className="h-5 w-5" />} label="Mastered" value={progress.masteredExercises} />
        <StatTile icon={<Lock className="h-5 w-5" />} label="Locked" value={progress.lockedExercises} />
      </section>

      {currentExercise && (
        <section className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
          <h2 className="text-sm uppercase tracking-widest text-parchment/50">Next Milestone</h2>
          <p className="mt-1 text-xl font-bold">{currentExercise.name}</p>
          <p className="mt-1 text-sm text-parchment/60">
            Target: {currentExercise.targetBpm} BPM &middot; Minimum accuracy: {currentExercise.minimumAccuracy}%
          </p>
          <Link to={`/curriculum/${currentExercise.id}`} className="mt-3 inline-block text-sm font-medium text-gold-400 hover:underline">
            View exercise details →
          </Link>
        </section>
      )}
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-3 text-center">
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-800 text-gold-400">{icon}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-parchment/50">{label}</div>
    </div>
  );
}
