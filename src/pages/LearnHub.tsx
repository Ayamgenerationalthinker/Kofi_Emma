import { Link } from "react-router-dom";
import { BookOpen, Drum, Footprints, BookOpenCheck, ChevronRight } from "lucide-react";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getCurriculumState } from "../services/curriculumService";
import { PAS_RUDIMENTS } from "../data/rudiments";
import { DOUBLE_BASS_EXERCISES } from "../data/doubleBassExercises";
import { getDb } from "../lib/localDb";

export function LearnHub() {
  useLocalDbVersion();
  const db = getDb();
  const state = getCurriculumState();

  const masteredRudiments = PAS_RUDIMENTS.filter(
    (r) => db.progress[r.id]?.status === "MASTERED"
  ).length;

  const masteredCurriculum = Object.values(db.progress).filter(
    (p) => p.status === "MASTERED" && p.exerciseId.startsWith("P")
  ).length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-gold-600/30 bg-gold-950/30 px-3 py-1 text-xs font-semibold text-gold-400">
          <BookOpen className="h-3.5 w-3.5" /> Comprehensive Academy
        </div>
        <h1 className="mt-2 text-2xl font-black md:text-3xl text-parchment">Drum Learning Academy</h1>
        <p className="mt-1 text-sm text-parchment/70">
          Master the Ghanaian gospel pocket, 40 PAS rudiments, and double bass foot mechanics with structured curricula.
        </p>
      </div>

      {/* Academy Pathways */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 1. Core 8-Level Curriculum */}
        <Link
          to="/curriculum"
          className="group flex flex-col justify-between rounded-3xl border border-charcoal-700 bg-charcoal-900/70 p-6 transition-all hover:border-gold-500/50 hover:bg-charcoal-900 shadow-xl"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-gold-600/40 bg-gold-950/40 px-2.5 py-0.5 text-xs font-bold text-gold-300">
                Level {state.currentPhaseNumber} Active
              </span>
            </div>

            <h2 className="mt-4 text-xl font-bold text-parchment group-hover:text-gold-300 transition-colors">
              Core Drum Curriculum
            </h2>
            <p className="mt-1 text-xs text-parchment/60 leading-relaxed">
              8 progressive levels and 80 structured exercises from foundation grip and timekeeping to advanced Ghanaian 6/8 polyrhythms and live church mastery.
            </p>
          </div>

          <div className="mt-6 border-t border-charcoal-800/80 pt-4 flex items-center justify-between text-xs font-bold text-gold-400">
            <span>{masteredCurriculum} / 80 Mastered</span>
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Curriculum <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* 2. 40 PAS Official Rudiments */}
        <Link
          to="/rudiments"
          className="group flex flex-col justify-between rounded-3xl border border-charcoal-700 bg-charcoal-900/70 p-6 transition-all hover:border-gold-500/50 hover:bg-charcoal-900 shadow-xl"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-400">
                <Drum className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-charcoal-700 bg-charcoal-800 px-2.5 py-0.5 text-xs font-bold text-parchment/80">
                40 Official PAS
              </span>
            </div>

            <h2 className="mt-4 text-xl font-bold text-parchment group-hover:text-gold-300 transition-colors">
              40 PAS Rudiments School
            </h2>
            <p className="mt-1 text-xs text-parchment/60 leading-relaxed">
              The authoritative Percussive Arts Society rudiments (Rolls, Paradiddles, Flams, Drags) with interactive synthesized audio, sticking guides, and Open-Close-Open method.
            </p>
          </div>

          <div className="mt-6 border-t border-charcoal-800/80 pt-4 flex items-center justify-between text-xs font-bold text-gold-400">
            <span>{masteredRudiments} / 40 Mastered</span>
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Explore Rudiments <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* 3. Double Bass / Pedal School */}
        <Link
          to="/double-bass"
          className="group flex flex-col justify-between rounded-3xl border border-charcoal-700 bg-charcoal-900/70 p-6 transition-all hover:border-gold-500/50 hover:bg-charcoal-900 shadow-xl"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-400">
                <Footprints className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-charcoal-700 bg-charcoal-800 px-2.5 py-0.5 text-xs font-bold text-parchment/80">
                4 Progressive Levels
              </span>
            </div>

            <h2 className="mt-4 text-xl font-bold text-parchment group-hover:text-gold-300 transition-colors">
              Double Bass & Pedal School
            </h2>
            <p className="mt-1 text-xs text-parchment/60 leading-relaxed">
              Ergonomic throne setup, heel-toe and slide double strokes, metric subdivision pyramids, and high-velocity RLKK gospel fills.
            </p>
          </div>

          <div className="mt-6 border-t border-charcoal-800/80 pt-4 flex items-center justify-between text-xs font-bold text-gold-400">
            <span>{DOUBLE_BASS_EXERCISES.length} Structured Pedal Drills</span>
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Start Footwork <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* 4. Knowledge Base & Musicianship */}
        <Link
          to="/library"
          className="group flex flex-col justify-between rounded-3xl border border-charcoal-700 bg-charcoal-900/70 p-6 transition-all hover:border-gold-500/50 hover:bg-charcoal-900 shadow-xl"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-400">
                <BookOpenCheck className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-charcoal-700 bg-charcoal-800 px-2.5 py-0.5 text-xs font-bold text-parchment/80">
                Theory & Video
              </span>
            </div>

            <h2 className="mt-4 text-xl font-bold text-parchment group-hover:text-gold-300 transition-colors">
              Knowledge Base & Masterclasses
            </h2>
            <p className="mt-1 text-xs text-parchment/60 leading-relaxed">
              Musicianship guides on dynamics, listening to bass & keys, recovering from live mistakes, Ghanaian heritage, and verified video lessons.
            </p>
          </div>

          <div className="mt-6 border-t border-charcoal-800/80 pt-4 flex items-center justify-between text-xs font-bold text-gold-400">
            <span>Musicianship & Masterclasses</span>
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Browse Library <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
