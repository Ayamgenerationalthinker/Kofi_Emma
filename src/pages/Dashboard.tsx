import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlayCircle, Flame, Gauge, Clock, Lock, Cloud } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getCurriculumState } from "../services/curriculumService";
import { getProgressSummary } from "../services/progressService";
import { generateTodayLesson, readTodayLesson } from "../services/practicePlannerService";
import { shouldShowAccountPrompt, dismissAccountPrompt } from "../services/settingsService";
import { ProgressBar } from "../components/ProgressBar";
import { AccountSheet } from "../components/account/AccountSheet";
import type { ProgressSummary, DailyLesson } from "../lib/types";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Section 31/32 (UX spec): "today's focus" is coaching language derived
// from real recent performance, never framed as an algorithm decision.
function todaysFocus(progress: ProgressSummary, lesson: DailyLesson | null): { headline: string; body: string } {
  if (lesson?.wasRecoverySession) {
    return { headline: "Welcome back.", body: "Let's get back into the groove — right where you left off." };
  }
  if (!progress.hasAnyData) {
    return { headline: "Keep the pulse steady.", body: "We're starting slowly so your hands and feet can learn together." };
  }
  if (progress.averageAccuracy >= 92) {
    return { headline: "Push your tempo.", body: "Your accuracy is holding at speed — a great time to nudge the BPM up." };
  }
  if (progress.averageAccuracy < 80) {
    return { headline: "Let's tighten your timing.", body: "Speed is ahead of control right now. Slow it down and make it clean." };
  }
  return { headline: "Keep it clean.", body: "Your timing is stabilizing. Hold the pocket and let tempo rise on its own." };
}

// Home is a practice launchpad, not a dashboard: the primary action (START
// SHED) is what the user should see and reach for first, every time.
export function Dashboard() {
  const { user } = useAppContext();
  const { cloudAvailable, user: cloudUser } = useAuth();
  const timezone = user!.timezone;

  useEffect(() => {
    generateTodayLesson(timezone);
  }, [timezone]);

  useLocalDbVersion();
  const state = getCurriculumState();
  const progress = getProgressSummary(timezone);
  const lesson = readTodayLesson(timezone);
  const currentPhase = state.phases.find((p) => p.number === state.currentPhaseNumber);
  const focus = todaysFocus(progress, lesson);

  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const showAccountPrompt =
    cloudAvailable && !cloudUser && shouldShowAccountPrompt() && (progress.masteredExercises >= 1 || progress.streak.currentStreak >= 3);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-parchment/50">{greeting()}, {user!.name}</p>
        <p className="text-xs uppercase tracking-widest text-gold-400/70">Abele Drums Coach</p>
      </div>

      <section className="rounded-2xl border border-gold-600/30 bg-gradient-to-br from-charcoal-900 to-charcoal-800 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">Today's Shed</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-parchment/50">
          Level {currentPhase?.number ?? 0} &middot; {currentPhase?.title ?? "Absolute Beginner"}
        </p>
        <h1 className="mt-2 text-2xl font-black">{lesson?.lessonParts[0]?.exerciseName ?? "Your next groove"}</h1>
        <p className="mt-1 text-sm text-parchment/60">{lesson ? `${lesson.totalMinutes} minutes` : "Preparing your session..."}</p>

        <Link
          to="/practice"
          className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-gold-500 px-8 py-3 text-lg font-bold text-charcoal-950 hover:bg-gold-400"
        >
          <PlayCircle className="h-5 w-5" />
          START SHED
        </Link>
      </section>

      <section>
        <p className="text-xs uppercase tracking-widest text-gold-400">Today's Focus</p>
        <h2 className="mt-1 text-lg font-bold">{focus.headline}</h2>
        <p className="mt-1 text-sm text-parchment/60">{focus.body}</p>
      </section>

      {showAccountPrompt && (
        <button
          type="button"
          onClick={() => setAccountSheetOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-gold-600/40 bg-gold-500/5 p-4 text-left hover:bg-gold-500/10"
        >
          <Cloud className="h-6 w-6 shrink-0 text-gold-400" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-gold-300">Keep your progress safe</span>
            <span className="block text-xs text-parchment/60">
              Create a free account so your sheds, BPM records, and progress follow you across devices.
            </span>
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              dismissAccountPrompt();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                dismissAccountPrompt();
              }
            }}
            className="ml-auto shrink-0 self-start text-xs text-parchment/40 hover:text-parchment/70"
          >
            Not now
          </span>
        </button>
      )}

      <section>
        <p className="mb-3 text-xs uppercase tracking-widest text-parchment/50">Your Progress</p>
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={<Gauge className="h-5 w-5" />} label="Clean BPM" value={progress.bestBpm || "—"} />
          <StatTile icon={<Flame className="h-5 w-5" />} label="Streak" value={`${progress.streak.currentStreak}d`} />
          <StatTile icon={<Clock className="h-5 w-5" />} label="Shed time" value={`${progress.totalMinutesPracticed}m`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-parchment/70">Your Journey</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {state.phases.map((phase) => (
            <div key={phase.id} className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Level {phase.number}: {phase.title}
                </span>
                {phase.status === "LOCKED" && <Lock className="h-4 w-4 text-parchment/40" aria-label="Locked" />}
              </div>
              <ProgressBar value={phase.progress} label={`${phase.masteredExercises}/${phase.totalExercises} mastered`} />
            </div>
          ))}
        </div>
      </section>

      <AccountSheet open={accountSheetOpen} onClose={() => setAccountSheetOpen(false)} />
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
