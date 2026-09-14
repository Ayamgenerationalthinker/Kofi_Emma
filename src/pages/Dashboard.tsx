import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PlayCircle,
  Flame,
  Gauge,
  Clock,
  Lock,
  Cloud,
  ArrowRight,
  Sparkles,
  BookOpen,
  Church,
  Sliders,
  Layers,
  FastForward,
  Headphones,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getCurriculumState } from "../services/curriculumService";
import { getProgressSummary } from "../services/progressService";
import { generateTodayLesson, readTodayLesson } from "../services/practicePlannerService";
import { shouldShowAccountPrompt, dismissAccountPrompt } from "../services/settingsService";
import { ProgressBar } from "../components/ProgressBar";
import { AccountSheet } from "../components/account/AccountSheet";
import { getSkillProgress, getWeakestSkill } from "../services/skillService";
import type { ProgressSummary, DailyLesson } from "../lib/types";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

const COACHING_WISDOM = [
  "Today, focus on consistency rather than speed. Speed is a byproduct of relaxed control.",
  "If you lose the groove, reduce the tempo by 10 BPM and rebuild the pocket from scratch.",
  "Leave space. A mature church drummer does not fill every gap—they let the vocals and bass speak.",
  "Lock your kick drum with the bass guitar. When hands and feet unify, the groove moves the room.",
  "Your backbeat is the pulse of the congregation. Place beat 2 and 4 with immense conviction.",
  "In 6/8 worship, feel the spiritual sway. Avoid stiff straight subdivisions.",
];

export function Dashboard() {
  const { user } = useAppContext();
  const { cloudAvailable, user: cloudUser } = useAuth();
  const navigate = useNavigate();
  const timezone = user!.timezone;

  useEffect(() => {
    generateTodayLesson(timezone);
  }, [timezone]);

  useLocalDbVersion();
  const state = getCurriculumState();
  const progress = getProgressSummary(timezone);
  const lesson = readTodayLesson(timezone);
  const currentPhase = state.phases.find((p) => p.number === state.currentPhaseNumber);
  const skills = getSkillProgress();
  const weakest = getWeakestSkill(skills);

  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [coachingIndex, setCoachingIndex] = useState(() => Math.floor(Math.random() * COACHING_WISDOM.length));

  const showAccountPrompt =
    cloudAvailable && !cloudUser && shouldShowAccountPrompt() && (progress.masteredExercises >= 1 || progress.streak.currentStreak >= 3);

  const currentExercise = lesson?.lessonParts[0];

  return (
    <div className="space-y-8">
      {/* Top Section Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest text-gold-400">
            {greeting()}, {user!.name}
          </h1>
          <p className="mt-0.5 text-xs text-parchment/50">Your practice starts here. Slow first, clean first.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-gold-600/40 bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-300">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>{progress.streak.currentStreak} DAY STREAK</span>
          </div>
          <div className="rounded-full border border-charcoal-700 bg-charcoal-800 px-3 py-1 text-xs font-bold text-parchment/80">
            LEVEL {state.currentPhaseNumber}
          </div>
        </div>
      </div>

      {/* TODAY'S PRACTICE HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-gold-500/40 bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-charcoal-950 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-gold-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-gold-400">
                Today's Practice
              </span>
              <span className="text-xs text-parchment/50">
                Level {currentPhase?.number ?? 0} &middot; {currentPhase?.title ?? "Foundations"}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-black text-parchment md:text-3xl">
              {currentExercise?.exerciseName ?? "Gospel Groove Fundamentals"}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-parchment/70">
              <span className="flex items-center gap-1 font-semibold">
                <Gauge className="h-4 w-4 text-gold-400" />
                Target: <strong className="text-parchment">{currentExercise?.targetBpm ?? 100} BPM</strong>
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="h-4 w-4 text-gold-400" />
                Duration: <strong className="text-parchment">{lesson ? `${lesson.totalMinutes} min` : "15 min"}</strong>
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Mastery: <strong className="text-parchment">{progress.masteredExercises} / {state.totalExercises}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/practice"
              className="flex min-h-[54px] items-center justify-center gap-3 rounded-2xl bg-gold-500 px-8 py-3.5 text-base font-black text-charcoal-950 shadow-lg shadow-gold-500/20 transition-all hover:bg-gold-400 active:scale-95"
            >
              <PlayCircle className="h-6 w-6" />
              START SHED
            </Link>

            {currentExercise && (
              <Link
                to={`/curriculum/${currentExercise.exerciseId}`}
                className="flex items-center justify-center rounded-2xl border border-charcoal-700 bg-charcoal-800/80 px-6 py-3 text-xs font-bold text-parchment hover:border-gold-500/40"
              >
                VIEW LESSON
              </Link>
            )}
          </div>
        </div>

        {/* Lesson Progress Sub-bar */}
        <div className="mt-8 border-t border-charcoal-800 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-parchment/60">Curriculum Progress</span>
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

      {/* DAILY COACH WISDOM CARD */}
      <section className="rounded-2xl border border-gold-600/30 bg-gold-500/5 p-5">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400">Daily Coach Wisdom</span>
            <p className="mt-1 text-sm font-semibold text-parchment leading-relaxed">
              "{COACHING_WISDOM[coachingIndex]}"
            </p>
          </div>
        </div>
      </section>

      {/* QUICK PRACTICE 1-TAP CHIPS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-parchment/60">Quick Practice</h3>
          <span className="text-xs text-parchment/40">1-Tap Instant Launch</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {[
            { label: "Gospel", path: "/practice?style=Gospel" },
            { label: "Praise", path: "/practice?style=Praise" },
            { label: "Worship", path: "/practice?style=Worship" },
            { label: "Highlife", path: "/practice?style=Highlife" },
            { label: "6/8", path: "/practice?style=6/8" },
            { label: "12/8", path: "/practice?style=12/8" },
            { label: "Fills", path: "/fills" },
            { label: "Transitions", path: "/transitions" },
          ].map((chip) => (
            <Link
              key={chip.label}
              to={chip.path}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-charcoal-800 bg-charcoal-900/60 px-3 py-2 text-xs font-bold text-parchment/90 transition-all hover:border-gold-500/50 hover:bg-gold-500/10 hover:text-gold-300 active:scale-95"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </section>

      {/* YOUR CURRENT FOCUS */}
      <section className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-400">Your Current Focus</span>
            <h3 className="mt-1 text-lg font-bold text-parchment">
              {weakest?.hasData ? `${weakest.skill} Coordination` : "Rhythm & Timing Consistency"}
            </h3>
            <p className="mt-1 text-xs text-parchment/60">
              {weakest?.hasData
                ? `Your recent session logs show that ${weakest.skill} needs more repetition.`
                : "Build raw stroke consistency before introducing complex fills."}
            </p>
          </div>
          <Link
            to="/practice"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-charcoal-800 px-6 py-2.5 text-xs font-bold text-gold-400 hover:bg-charcoal-700"
          >
            <span>Practice Focus</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* INTERACTIVE TRAINERS HUB */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-parchment/60">Interactive Laboratories</h3>
          <span className="text-xs text-parchment/40">Musician's Suite</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/live-church"
            className="group rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5 transition-all hover:border-gold-500/40 hover:bg-charcoal-900"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 group-hover:bg-gold-500/20">
                <Church className="h-5 w-5" />
              </div>
              <span className="rounded bg-gold-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-300">
                Signature
              </span>
            </div>
            <h4 className="mt-3 text-base font-bold text-parchment group-hover:text-gold-300">Live Church Simulator</h4>
            <p className="mt-1 text-xs text-parchment/60">
              Praise starts, worship drops, MD cues, and clean endings in a full church service scenario.
            </p>
          </Link>

          <Link
            to="/tempo-builder"
            className="group rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5 transition-all hover:border-gold-500/40 hover:bg-charcoal-900"
          >
            <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 group-hover:bg-gold-500/20 w-fit">
              <FastForward className="h-5 w-5" />
            </div>
            <h4 className="mt-3 text-base font-bold text-parchment group-hover:text-gold-300">Tempo Builder</h4>
            <p className="mt-1 text-xs text-parchment/60">
              Automated tempo ramps to build speed, stamina, and clean control without tensing up.
            </p>
          </Link>

          <Link
            to="/fills"
            className="group rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5 transition-all hover:border-gold-500/40 hover:bg-charcoal-900"
          >
            <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 group-hover:bg-gold-500/20 w-fit">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="mt-3 text-base font-bold text-parchment group-hover:text-gold-300">Fill Trainer</h4>
            <p className="mt-1 text-xs text-parchment/60">
              Master the critical loop: Groove &rarr; Fill &rarr; Return to Groove with phrase turnarounds.
            </p>
          </Link>

          <Link
            to="/transitions"
            className="group rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5 transition-all hover:border-gold-500/40 hover:bg-charcoal-900"
          >
            <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 group-hover:bg-gold-500/20 w-fit">
              <Layers className="h-5 w-5" />
            </div>
            <h4 className="mt-3 text-base font-bold text-parchment group-hover:text-gold-300">Transition Trainer</h4>
            <p className="mt-1 text-xs text-parchment/60">
              Seamless 4/4 to 6/8 and worship-to-praise energy transitions.
            </p>
          </Link>

          <Link
            to="/call-and-response"
            className="group rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5 transition-all hover:border-gold-500/40 hover:bg-charcoal-900"
          >
            <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 group-hover:bg-gold-500/20 w-fit">
              <Headphones className="h-5 w-5" />
            </div>
            <h4 className="mt-3 text-base font-bold text-parchment group-hover:text-gold-300">Call & Response</h4>
            <p className="mt-1 text-xs text-parchment/60">
              Ear-training ear recall: listen to the coach's phrase and reproduce it instantly.
            </p>
          </Link>

          <Link
            to="/library"
            className="group rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5 transition-all hover:border-gold-500/40 hover:bg-charcoal-900"
          >
            <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 group-hover:bg-gold-500/20 w-fit">
              <BookOpen className="h-5 w-5" />
            </div>
            <h4 className="mt-3 text-base font-bold text-parchment group-hover:text-gold-300">Drummer's Library</h4>
            <p className="mt-1 text-xs text-parchment/60">
              Articles on listening in church, dynamic space, glossary, and Ghanaian heritage.
            </p>
          </Link>
        </div>
      </section>

      {/* STATS ROW */}
      <section>
        <p className="mb-3 text-xs uppercase tracking-widest text-parchment/50">Your Work This Week</p>
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={<Gauge className="h-5 w-5" />} label="Clean BPM" value={progress.bestBpm || "—"} />
          <StatTile icon={<Flame className="h-5 w-5" />} label="Streak" value={`${progress.streak.currentStreak}d`} />
          <StatTile icon={<Clock className="h-5 w-5" />} label="Practice" value={`${progress.totalMinutesPracticed}m`} />
        </div>
      </section>

      {/* CURRICULUM JOURNEY OVERVIEW */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-parchment/70">8-Level Curriculum Journey</h2>
          <Link to="/curriculum" className="text-xs font-bold text-gold-400 hover:text-gold-300">
            View All 80 Lessons &rarr;
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {state.phases.map((phase) => (
            <div key={phase.id} className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold">
                  L{phase.number}: {phase.title.replace(/^Level \d+ — /, "")}
                </span>
                {phase.status === "LOCKED" && <Lock className="h-3.5 w-3.5 text-parchment/40" aria-label="Locked" />}
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
          className="flex w-full items-center gap-3 rounded-xl border border-gold-600/40 bg-gold-500/5 p-4 text-left hover:bg-gold-500/10"
        >
          <Cloud className="h-6 w-6 shrink-0 text-gold-400" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-gold-300">Keep your practice logs safe</span>
            <span className="block text-xs text-parchment/60">
              Sync progress across devices and preserve your practice history with optional cloud backup.
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-3 text-center sm:p-4">
      <div className="text-gold-400">{icon}</div>
      <p className="mt-1 font-display text-lg font-black text-parchment sm:text-2xl">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-parchment/50 sm:text-xs">{label}</p>
    </div>
  );
}
