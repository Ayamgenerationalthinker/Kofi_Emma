import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlayCircle,
  Flame,
  Gauge,
  Clock,
  Lock,
  Cloud,
  Sparkles,
  Drum,
  Timer,
  Footprints,
  FastForward,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getCurriculumState, getNextAvailableExercise } from "../services/curriculumService";
import { getProgressSummary } from "../services/progressService";
import { generateTodayLesson, readTodayLesson } from "../services/practicePlannerService";
import { shouldShowAccountPrompt, dismissAccountPrompt } from "../services/settingsService";
import { ProgressBar } from "../components/ProgressBar";
import { AccountSheet } from "../components/account/AccountSheet";

function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let timeGreeting = "Good evening";
  if (hour < 12) timeGreeting = "Good morning";
  else if (hour < 17) timeGreeting = "Good afternoon";

  return name ? `${timeGreeting}, ${name}` : `${timeGreeting}, Drummer`;
}

const COACHING_WISDOM = [
  "Focus on consistency rather than speed. Speed is a byproduct of relaxed control.",
  "If you lose the groove, reduce tempo by 10 BPM and rebuild the pocket cleanly.",
  "Leave space. A mature church drummer lets the vocals and bass guitar breathe.",
  "Lock your kick drum with the bass player for a unified, heavy rhythm section.",
  "Your backbeat is the pulse of the congregation. Strike beats 2 and 4 with conviction.",
  "In 6/8 worship, lean into the compound pulse. Feel the flow before adding fills.",
];

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
  const currentPhase = state.phases.find((p) => p.number === state.currentPhaseNumber);
  const nextExercise = getNextAvailableExercise();

  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [wisdomIndex] = useState(() => Math.floor(Math.random() * COACHING_WISDOM.length));

  const showAccountPrompt =
    cloudAvailable && !cloudUser && shouldShowAccountPrompt() && (progress.masteredExercises >= 1 || progress.streak.currentStreak >= 3);

  const currentExercise = lesson?.lessonParts[0];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Greeting & Status Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black text-parchment md:text-2xl">
            {getGreeting(user?.name)}
          </h1>
          <p className="text-xs text-parchment/60">
            {progress.masteredExercises > 0
              ? `${progress.masteredExercises} exercises mastered. Clean first, fast later.`
              : "Start your first practice session to build your gospel pocket."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 rounded-full border border-gold-600/40 bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-300">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>{progress.streak.currentStreak} DAY STREAK</span>
          </div>
          <div className="rounded-full border border-charcoal-700 bg-charcoal-800 px-3 py-1 text-xs font-bold text-parchment/80">
            LEVEL {state.currentPhaseNumber}
          </div>
        </div>
      </div>

      {/* 1. TODAY'S PRACTICE HERO CARD */}
      <section className="relative overflow-hidden rounded-3xl border border-gold-500/40 bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-charcoal-950 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gold-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-gold-400">
                Today's Practice
              </span>
              <span className="text-xs text-parchment/50">
                Level {currentPhase?.number ?? 1} &middot; {currentPhase?.title ?? "Foundations"}
              </span>
            </div>

            <h2 className="text-2xl font-black text-parchment md:text-3xl">
              {currentExercise?.exerciseName ?? "Gospel Groove Fundamentals"}
            </h2>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-parchment/70 sm:gap-5">
              <span className="flex items-center gap-1 font-semibold">
                <Gauge className="h-4 w-4 text-gold-400" />
                Target: <strong className="text-parchment">{currentExercise?.targetBpm ?? 90} BPM</strong>
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="h-4 w-4 text-gold-400" />
                Duration: <strong className="text-parchment">{lesson ? `${lesson.totalMinutes} min` : "20 min"}</strong>
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Mastery: <strong className="text-parchment">{progress.masteredExercises} / {state.totalExercises}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/practice"
              className="flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-gold-500 px-8 py-3.5 text-base font-black text-charcoal-950 shadow-lg shadow-gold-500/20 transition-all hover:bg-gold-400 active:scale-95"
            >
              <PlayCircle className="h-5 w-5" />
              START SHED
            </Link>

            {currentExercise && (
              <Link
                to={`/curriculum/${currentExercise.exerciseId}`}
                className="flex min-h-[52px] items-center justify-center rounded-2xl border border-charcoal-700 bg-charcoal-800/80 px-5 py-3 text-xs font-bold text-parchment hover:border-gold-500/40"
              >
                LESSON DETAILS
              </Link>
            )}
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-6 border-t border-charcoal-800 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-parchment/60">Curriculum Mastery ({progress.masteredExercises} of {state.totalExercises} exercises)</span>
            <span className="font-bold text-gold-400">
              {Math.round((progress.masteredExercises / Math.max(1, state.totalExercises)) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-charcoal-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500"
              style={{
                width: `${Math.round((progress.masteredExercises / Math.max(1, state.totalExercises)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. CONTINUE LEARNING NEXT LESSON */}
      {nextExercise && (
        <section className="rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">Next Unlocked Lesson</span>
              <h3 className="mt-0.5 text-base font-bold text-parchment">{nextExercise.exercise.name}</h3>
              <p className="text-xs text-parchment/60">
                Sticking: <strong className="font-mono text-gold-300">{nextExercise.exercise.stickingPattern}</strong> &middot; Target: <strong className="text-parchment">{nextExercise.exercise.targetBpm} BPM</strong>
              </p>
            </div>
            <Link
              to={`/curriculum/${nextExercise.exercise.id}`}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-charcoal-800 px-4 py-2 text-xs font-bold text-gold-400 hover:bg-charcoal-700 shrink-0"
            >
              <span>Learn Exercise</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* 3. QUICK INSTRUMENT TOOLS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-parchment/70">Quick Practice Tools</h3>
          <span className="text-xs text-parchment/40">Direct Instruments</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            to="/metronome"
            className="group flex flex-col items-center justify-center rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-4 text-center transition hover:border-gold-500/40 hover:bg-charcoal-900 shadow-md"
          >
            <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 group-hover:scale-110 transition-transform">
              <Timer className="h-5 w-5" />
            </div>
            <h4 className="mt-2 text-sm font-bold text-parchment group-hover:text-gold-300">Metronome</h4>
            <p className="text-[11px] text-parchment/50">Audio click & tap</p>
          </Link>

          <Link
            to="/rudiments"
            className="group flex flex-col items-center justify-center rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-4 text-center transition hover:border-gold-500/40 hover:bg-charcoal-900 shadow-md"
          >
            <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 group-hover:scale-110 transition-transform">
              <Drum className="h-5 w-5" />
            </div>
            <h4 className="mt-2 text-sm font-bold text-parchment group-hover:text-gold-300">40 Rudiments</h4>
            <p className="text-[11px] text-parchment/50">PAS official school</p>
          </Link>

          <Link
            to="/double-bass"
            className="group flex flex-col items-center justify-center rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-4 text-center transition hover:border-gold-500/40 hover:bg-charcoal-900 shadow-md"
          >
            <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 group-hover:scale-110 transition-transform">
              <Footprints className="h-5 w-5" />
            </div>
            <h4 className="mt-2 text-sm font-bold text-parchment group-hover:text-gold-300">Double Bass</h4>
            <p className="text-[11px] text-parchment/50">Pedal speed lab</p>
          </Link>

          <Link
            to="/tempo-builder"
            className="group flex flex-col items-center justify-center rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-4 text-center transition hover:border-gold-500/40 hover:bg-charcoal-900 shadow-md"
          >
            <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 group-hover:scale-110 transition-transform">
              <FastForward className="h-5 w-5" />
            </div>
            <h4 className="mt-2 text-sm font-bold text-parchment group-hover:text-gold-300">Tempo Builder</h4>
            <p className="text-[11px] text-parchment/50">Automated ramps</p>
          </Link>
        </div>
      </section>

      {/* 4. PROGRESS & CONSISTENCY SNAPSHOT */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-parchment/60 font-bold">Your Consistency Snapshot</p>
          <Link to="/progress" className="text-xs font-bold text-gold-400 hover:text-gold-300">
            View Analytics &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={<Gauge className="h-5 w-5" />} label="Clean BPM" value={progress.bestBpm > 0 ? `${progress.bestBpm}` : "—"} />
          <StatTile icon={<Flame className="h-5 w-5 text-amber-400" />} label="Streak" value={`${progress.streak.currentStreak}d`} />
          <StatTile icon={<Clock className="h-5 w-5 text-blue-400" />} label="Total Shed" value={`${progress.totalMinutesPracticed}m`} />
        </div>
      </section>

      {/* 5. COACHING WISDOM BANNER */}
      <section className="rounded-2xl border border-gold-600/30 bg-gold-500/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-gold-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">Coach Thought for Today</span>
            <p className="mt-0.5 text-xs font-medium text-parchment/90 leading-relaxed">
              "{COACHING_WISDOM[wisdomIndex]}"
            </p>
          </div>
        </div>
      </section>

      {/* 6. CURRICULUM ROADMAP OVERVIEW */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase font-bold tracking-widest text-parchment/70">8-Level Curriculum Roadmap</h2>
          <Link to="/curriculum" className="text-xs font-bold text-gold-400 hover:text-gold-300">
            All 80 Lessons &rarr;
          </Link>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {state.phases.map((phase) => (
            <div key={phase.id} className="rounded-2xl border border-charcoal-800 bg-charcoal-900/50 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-parchment truncate">
                  L{phase.number}: {phase.title.replace(/^Level \d+ — /, "")}
                </span>
                {phase.status === "LOCKED" && <Lock className="h-3 w-3 text-parchment/40 shrink-0" aria-label="Locked" />}
              </div>
              <ProgressBar value={phase.progress} label={`${phase.masteredExercises}/${phase.totalExercises} mastered`} />
            </div>
          ))}
        </div>
      </section>

      {showAccountPrompt && (
        <button
          type="button"
          onClick={() => setAccountSheetOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-gold-600/40 bg-gold-500/5 p-4 text-left hover:bg-gold-500/10"
        >
          <Cloud className="h-6 w-6 shrink-0 text-gold-400" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-gold-300">Preserve Your Practice Logs</span>
            <span className="block text-xs text-parchment/60">
              Optional cloud sync saves your streaks and BPM achievements across all your devices.
            </span>
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              dismissAccountPrompt();
            }}
            className="ml-auto shrink-0 self-start text-xs text-parchment/40 hover:text-parchment/70"
          >
            Dismiss
          </span>
        </button>
      )}

      {accountSheetOpen && <AccountSheet open={accountSheetOpen} onClose={() => setAccountSheetOpen(false)} />}
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-3 text-center sm:p-4 shadow-sm">
      <div className="text-gold-400">{icon}</div>
      <p className="mt-1 font-display text-lg font-black text-parchment sm:text-2xl">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-parchment/50 sm:text-xs">{label}</p>
    </div>
  );
}
