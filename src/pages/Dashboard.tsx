import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlayCircle,
  Flame,
  Gauge,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getCurriculumState, getNextAvailableExercise } from "../services/curriculumService";
import { getProgressSummary } from "../services/progressService";
import { generateTodayLesson, readTodayLesson } from "../services/practicePlannerService";
import { shouldShowAccountPrompt, dismissAccountPrompt } from "../services/settingsService";
import { getExercise } from "../data/curriculum";
import { ProgressBar } from "../components/ProgressBar";
import { AccountSheet } from "../components/account/AccountSheet";

function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let timeGreeting = "Good evening";
  if (hour < 12) timeGreeting = "Good morning";
  else if (hour < 17) timeGreeting = "Good afternoon";

  return name ? `${timeGreeting}, ${name}` : `${timeGreeting}, Drummer`;
}

export function Dashboard() {
  const { user } = useAppContext();
  const { cloudAvailable, user: cloudUser } = useAuth();
  const timezone = user?.timezone || "UTC";

  useEffect(() => {
    generateTodayLesson(timezone);
  }, [timezone]);

  useLocalDbVersion();
  const state = getCurriculumState();
  const progress = getProgressSummary(timezone);
  const lesson = readTodayLesson(timezone);
  const next = getNextAvailableExercise();
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);

  const currentPhase = state.phases.find((p) => p.number === state.currentPhaseNumber) ?? state.phases[0];

  const showAccountPrompt =
    cloudAvailable &&
    !cloudUser &&
    shouldShowAccountPrompt() &&
    (progress.masteredExercises >= 1 || progress.streak.currentStreak >= 3);

  const activeExercise = next ? next.exercise : (lesson?.lessonParts[0] ? getExercise(lesson.lessonParts[0].exerciseId) : undefined);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 animate-in fade-in">
      {/* Top Greeting & Status Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-parchment md:text-3xl">
            {getGreeting(user?.name)}
          </h1>
          <p className="text-xs text-parchment/60 md:text-sm">
            {progress.masteredExercises > 0
              ? `${progress.masteredExercises} lessons mastered. One journey, one step at a time.`
              : "Welcome to your drumming journey. Here is exactly what you should learn next."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 rounded-full border border-gold-600/40 bg-gold-500/10 px-3.5 py-1.5 text-xs font-bold text-gold-300">
            <Flame className="h-4 w-4 text-amber-400" />
            <span>{progress.streak.currentStreak} DAY STREAK</span>
          </div>
          <div className="rounded-full border border-charcoal-700 bg-charcoal-800 px-3.5 py-1.5 text-xs font-bold text-parchment/80">
            STAGE {currentPhase?.number ?? 0} OF 10
          </div>
        </div>
      </div>

      {/* TODAY'S PRACTICE PLAN */}
      <section className="rounded-3xl border border-charcoal-700 bg-charcoal-900/60 p-6 md:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
              Today's Routine (25 min total)
            </span>
          </div>
          <span className="text-xs text-parchment/50">Guided Practice</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Step 1: Warm Up */}
          <div className="rounded-2xl border border-charcoal-800 bg-charcoal-950/60 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-parchment/50">1. Warm Up</div>
            <div className="mt-1 text-sm font-bold text-parchment">Relaxed Rebound & Fulcrum</div>
            <div className="mt-1 text-xs text-gold-400 font-semibold">5 min &middot; 60 BPM</div>
          </div>

          {/* Step 2: Next Lesson */}
          <div className="rounded-2xl border border-gold-500/40 bg-gold-500/10 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gold-400">2. Core Lesson</div>
            <div className="mt-1 text-sm font-bold text-parchment truncate">
              {activeExercise?.name ?? "Hand Technique"}
            </div>
            <div className="mt-1 text-xs text-gold-400 font-semibold">
              10 min &middot; Target {activeExercise?.targetBpm ?? 80} BPM
            </div>
          </div>

          {/* Step 3: Application */}
          <div className="rounded-2xl border border-charcoal-800 bg-charcoal-950/60 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-parchment/50">3. Musical Application</div>
            <div className="mt-1 text-sm font-bold text-parchment">Kit / Groove Translation</div>
            <div className="mt-1 text-xs text-gold-400 font-semibold">10 min &middot; Full Kit</div>
          </div>
        </div>
      </section>

      {/* HERO: NEXT LESSON (The Single Primary Action) */}
      <section className="relative overflow-hidden rounded-3xl border border-gold-500/50 bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-charcoal-950 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gold-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-300">
                Continue Your Journey
              </span>
              <span className="text-xs text-parchment/50">
                {currentPhase?.title}
              </span>
            </div>

            <h2 className="text-2xl font-black text-parchment md:text-3xl">
              {activeExercise?.name ?? "Double Stroke Roll — Open/Close/Open"}
            </h2>

            <p className="text-xs text-parchment/70 max-w-lg leading-relaxed">
              {activeExercise?.description ?? "Develop clean diddle rebound and smooth tempo modulation."}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-parchment/70">
              <span className="flex items-center gap-1.5 font-semibold">
                <Gauge className="h-4 w-4 text-gold-400" />
                Target: <strong className="text-parchment">{activeExercise?.targetBpm ?? 80} BPM</strong>
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Clock className="h-4 w-4 text-gold-400" />
                Duration: <strong className="text-parchment">{activeExercise?.durationMinutes ?? 5} min</strong>
              </span>
            </div>
          </div>

          <Link
            to={activeExercise?.id ? `/curriculum/${activeExercise.id}` : "/learn"}
            className="flex min-h-[56px] min-w-[200px] items-center justify-center gap-3 rounded-2xl bg-gold-500 px-8 py-4 text-base font-black text-charcoal-950 hover:bg-gold-400 shadow-xl active:scale-95 transition-transform"
          >
            <PlayCircle className="h-6 w-6 fill-current" /> Start Lesson
          </Link>
        </div>
      </section>

      {/* STAGE PROGRESS & ROADMAP ACCESS */}
      <section className="rounded-3xl border border-charcoal-700 bg-charcoal-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-parchment">{currentPhase?.title}</h3>
            <p className="text-xs text-parchment/60">{currentPhase?.subtitle}</p>
          </div>
          <Link
            to="/learn"
            className="text-xs font-bold text-gold-400 hover:text-gold-300 flex items-center gap-1"
          >
            View Full Journey <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-parchment/60 font-semibold">
            <span>Stage Progress</span>
            <span>{currentPhase?.progress ?? 0}%</span>
          </div>
          <ProgressBar value={currentPhase?.progress ?? 0} />
        </div>
      </section>

      {/* Account Backup Prompt if eligible */}
      {showAccountPrompt && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/30 p-4 flex items-center justify-between gap-4">
          <div className="text-xs text-parchment/80">
            <strong className="text-blue-300">Protect your practice streak:</strong> Sign in with Google to back up your progress across devices.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAccountSheetOpen(true)}
              className="rounded-xl bg-blue-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-400"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={dismissAccountPrompt}
              className="text-xs text-parchment/40 hover:text-parchment"
            >
              Later
            </button>
          </div>
        </div>
      )}

      <AccountSheet open={accountSheetOpen} onClose={() => setAccountSheetOpen(false)} />
    </div>
  );
}
