import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, ChevronDown, ChevronRight } from "lucide-react";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getDb } from "../lib/localDb";
import { PHASES, exercisesForPhase } from "../data/curriculum";
import { canUnlockPhase } from "../services/curriculumService";
import { ProgressBar } from "../components/ProgressBar";
import { StatusBadge } from "../components/StatusBadge";

// Locked phases stay visible with a locked message; their exercise lists
// are never rendered — a discipline that mattered when this had to be
// enforced across a network boundary, and is kept here for consistency.
export function Curriculum() {
  useLocalDbVersion();
  const db = getDb();
  const [expanded, setExpanded] = useState<string | null>(null);

  const phases = PHASES.map((phase) => {
    const exercises = exercisesForPhase(phase.id);
    const mastered = exercises.filter((e) => db.progress[e.id]?.status === "MASTERED").length;
    const unlocked = canUnlockPhase(phase.id);
    return {
      ...phase,
      unlocked,
      progress: exercises.length === 0 ? 0 : Math.round((mastered / exercises.length) * 100),
      lockedMessage: unlocked ? null : `Master all Phase ${phase.number - 1} prerequisites to unlock ${phase.title}.`,
      exercises: unlocked ? exercises : [],
    };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Curriculum</h1>
      <p className="text-parchment/60">Master the foundation before earning the next level.</p>

      <div className="space-y-3">
        {phases.map((phase) => {
          const isOpen = expanded === phase.id;
          return (
            <div key={phase.id} className="overflow-hidden rounded-xl border border-charcoal-700 bg-charcoal-900/50">
              <button
                type="button"
                onClick={() => phase.unlocked && setExpanded(isOpen ? null : phase.id)}
                aria-expanded={isOpen}
                disabled={!phase.unlocked}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  {phase.unlocked ? (
                    isOpen ? (
                      <ChevronDown className="h-5 w-5 text-gold-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gold-400" />
                    )
                  ) : (
                    <Lock className="h-5 w-5 text-parchment/40" aria-hidden="true" />
                  )}
                  <div>
                    <p className="font-bold">
                      Phase {phase.number}: {phase.title}
                    </p>
                    <p className="text-sm text-parchment/60">{phase.subtitle}</p>
                  </div>
                </div>
                {phase.unlocked ? (
                  <div className="w-28 shrink-0">
                    <ProgressBar value={phase.progress} />
                  </div>
                ) : (
                  <span className="shrink-0 text-xs text-parchment/40">Locked</span>
                )}
              </button>

              {!phase.unlocked && (
                <p className="border-t border-charcoal-800 px-4 py-3 text-sm text-parchment/50">{phase.lockedMessage}</p>
              )}

              {phase.unlocked && isOpen && (
                <ul className="divide-y divide-charcoal-800 border-t border-charcoal-800">
                  {phase.exercises.map((exercise) => (
                    <li key={exercise.id}>
                      <Link
                        to={`/curriculum/${exercise.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-charcoal-800/50"
                      >
                        <div>
                          <p className="font-medium">{exercise.name}</p>
                          <p className="text-xs text-parchment/50">
                            {exercise.category.replace(/_/g, " ")} &middot; Target {exercise.targetBpm} BPM
                          </p>
                        </div>
                        <StatusBadge status={db.progress[exercise.id]?.status ?? "LOCKED"} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
