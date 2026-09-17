import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Drum,
  Footprints,
  ChevronDown,
  ChevronRight,
  Lock,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Flame,
  ArrowRight,
  Award,
} from "lucide-react";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getDb } from "../lib/localDb";
import { PHASES, exercisesForPhase, type CurriculumPhase } from "../data/curriculum";
import { canUnlockPhase, getNextAvailableExercise } from "../services/curriculumService";
import { ProgressBar } from "../components/ProgressBar";
import { StatusBadge } from "../components/StatusBadge";

export function LearnHub() {
  useLocalDbVersion();
  const db = getDb();
  const next = getNextAvailableExercise();

  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(() => {
    if (next) return next.exercise.phaseId;
    return "phase-0";
  });

  const phasesWithStatus = PHASES.map((phase) => {
    const exercises = exercisesForPhase(phase.id);
    const masteredCount = exercises.filter((e) => db.progress[e.id]?.status === "MASTERED").length;
    const isUnlocked = canUnlockPhase(phase.id);
    const isComplete = exercises.length > 0 && masteredCount === exercises.length;
    const isCurrent = isUnlocked && !isComplete;

    return {
      ...phase,
      exercises,
      masteredCount,
      totalCount: exercises.length,
      isUnlocked,
      isComplete,
      isCurrent,
      progressPercent: exercises.length === 0 ? 0 : Math.round((masteredCount / exercises.length) * 100),
    };
  });

  const totalMastered = Object.values(db.progress).filter((p) => p.status === "MASTERED").length;
  const currentActivePhase = phasesWithStatus.find((p) => p.isCurrent) ?? phasesWithStatus[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-600/30 bg-gold-950/30 px-3 py-1 text-xs font-bold text-gold-400">
            <BookOpen className="h-3.5 w-3.5" /> Structured Drum Curriculum
          </div>
          <h1 className="mt-2 text-2xl font-black text-parchment md:text-4xl">Your Learning Journey</h1>
          <p className="mt-1 text-sm text-parchment/70 max-w-xl">
            One clear step at a time. Master foundational grip, timing, and rudiments before advancing to Ghanaian highlife, 6:8 African praise, and live church performance.
          </p>
        </div>

        <div className="rounded-2xl border border-charcoal-700 bg-charcoal-900/80 p-4 text-right">
          <span className="text-[11px] font-bold uppercase tracking-wider text-parchment/50">Current Stage</span>
          <div className="text-base font-black text-gold-400">Stage {currentActivePhase.number} of 10</div>
          <div className="text-xs text-parchment/60">{totalMastered} Lessons Mastered</div>
        </div>
      </div>

      {/* Up Next Banner (If Available) */}
      {next && (
        <section className="relative overflow-hidden rounded-3xl border border-gold-500/50 bg-gradient-to-r from-gold-950/40 via-charcoal-900 to-charcoal-950 p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-gold-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-gold-400">Your Next Lesson</span>
              </div>
              <h2 className="text-xl font-black text-parchment md:text-2xl">{next.exercise.name}</h2>
              <p className="text-xs text-parchment/70">
                {next.exercise.styleLabel} &middot; Target {next.exercise.targetBpm} BPM &middot; {next.exercise.durationMinutes} min
              </p>
            </div>

            <Link
              to={`/curriculum/${next.exercise.id}`}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gold-500 px-6 py-3 text-sm font-black text-charcoal-950 hover:bg-gold-400 shadow-lg active:scale-95 transition-transform"
            >
              <PlayCircle className="h-5 w-5" /> Start Lesson Now
            </Link>
          </div>
        </section>
      )}

      {/* STAGE ROADMAP (Stages 0 to 10) */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-parchment flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold-400" /> Curriculum Roadmap
        </h2>

        <div className="space-y-3">
          {phasesWithStatus.map((phase) => {
            const isOpen = expandedPhaseId === phase.id;

            return (
              <div
                key={phase.id}
                className={[
                  "overflow-hidden rounded-2xl border transition-all",
                  phase.isCurrent
                    ? "border-gold-500/60 bg-charcoal-900/90 shadow-lg"
                    : phase.isComplete
                    ? "border-charcoal-700/80 bg-charcoal-900/40"
                    : "border-charcoal-800 bg-charcoal-950/50 opacity-75",
                ].join(" ")}
              >
                {/* Stage Header Button */}
                <button
                  type="button"
                  onClick={() => phase.isUnlocked && setExpandedPhaseId(isOpen ? null : phase.id)}
                  aria-expanded={isOpen}
                  disabled={!phase.isUnlocked}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs",
                        phase.isComplete
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : phase.isCurrent
                          ? "bg-gold-500 text-charcoal-950 shadow-md"
                          : "bg-charcoal-800 text-parchment/40",
                      ].join(" ")}
                    >
                      {phase.isComplete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : phase.isUnlocked ? (
                        phase.number
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-bold text-parchment">{phase.title}</h3>
                        {phase.isCurrent && (
                          <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-[10px] font-bold text-gold-300">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-parchment/60">{phase.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {phase.isUnlocked ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-parchment/60 hidden sm:inline">
                          {phase.masteredCount} / {phase.totalCount}
                        </span>
                        <div className="w-20 hidden sm:block">
                          <ProgressBar value={phase.progressPercent} />
                        </div>
                        {isOpen ? (
                          <ChevronDown className="h-5 w-5 text-gold-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-parchment/40" />
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-parchment/40 flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5" /> Locked
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded Lessons List */}
                {phase.isUnlocked && isOpen && (
                  <div className="border-t border-charcoal-800 bg-charcoal-950/40 p-3 sm:p-4">
                    <ul className="space-y-2">
                      {phase.exercises.map((exercise) => {
                        const status = db.progress[exercise.id]?.status ?? "LOCKED";
                        const isAccessible = status !== "LOCKED";

                        return (
                          <li key={exercise.id}>
                            <Link
                              to={isAccessible ? `/curriculum/${exercise.id}` : "#"}
                              className={[
                                "flex items-center justify-between gap-3 rounded-xl p-3 transition-all",
                                isAccessible
                                  ? "bg-charcoal-900/60 hover:bg-charcoal-800/80 hover:border-gold-500/30 border border-transparent"
                                  : "opacity-50 cursor-not-allowed",
                              ].join(" ")}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-parchment">
                                      {exercise.name}
                                    </p>
                                    {exercise.source && (
                                      <span className="hidden md:inline rounded bg-charcoal-800 px-1.5 py-0.5 text-[10px] text-parchment/50">
                                        {exercise.source.name.split(" ")[0]}
                                      </span>
                                    )}
                                  </div>
                                  <p className="truncate text-xs text-parchment/50">
                                    {exercise.category.replace(/_/g, " ")} &middot; Target {exercise.targetBpm} BPM &middot; {exercise.durationMinutes} min
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <StatusBadge status={status} />
                                {isAccessible && <ArrowRight className="h-4 w-4 text-parchment/40" />}
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SPECIALIZED SCHOOLS & LIBRARIES (EXPLORATION SPACE) */}
      <section className="space-y-4 pt-4 border-t border-charcoal-800">
        <div>
          <h2 className="text-lg font-bold text-parchment">Specialized Practice Libraries</h2>
          <p className="text-xs text-parchment/60">
            Optional reference schools for non-linear exploration and focused technique workouts.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* 40 PAS Rudiments */}
          <Link
            to="/rudiments"
            className="flex flex-col justify-between rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-5 hover:border-gold-500/50 hover:bg-charcoal-900 transition-all shadow-md"
          >
            <div>
              <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 w-fit">
                <Drum className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-parchment">40 PAS Rudiments School</h3>
              <p className="mt-1 text-xs text-parchment/60">
                The authoritative international rudiments with Open-Close-Open tempo development.
              </p>
            </div>
            <div className="mt-4 text-xs font-bold text-gold-400 flex items-center gap-1">
              Explore Rudiments <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Double Bass School */}
          <Link
            to="/double-bass"
            className="flex flex-col justify-between rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-5 hover:border-gold-500/50 hover:bg-charcoal-900 transition-all shadow-md"
          >
            <div>
              <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 w-fit">
                <Footprints className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-parchment">Double Bass Pedal School</h3>
              <p className="mt-1 text-xs text-parchment/60">
                Foot mechanics, slide doubles, endurance pyramids, and high-velocity gospel chops.
              </p>
            </div>
            <div className="mt-4 text-xs font-bold text-gold-400 flex items-center gap-1">
              Pedal Drills <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Shed Tracks */}
          <Link
            to="/shed-tracks"
            className="flex flex-col justify-between rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-5 hover:border-gold-500/50 hover:bg-charcoal-900 transition-all shadow-md"
          >
            <div>
              <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400 w-fit">
                <Flame className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-parchment">Shed Loops & Play-Alongs</h3>
              <p className="mt-1 text-xs text-parchment/60">
                Praise grooves, slow worship backing tracks, and tempo development tools.
              </p>
            </div>
            <div className="mt-4 text-xs font-bold text-gold-400 flex items-center gap-1">
              Play Along <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
