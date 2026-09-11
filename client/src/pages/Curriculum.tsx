import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, ChevronDown, ChevronRight } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { LoadingState, ErrorState } from "../components/StatusStates";
import { ProgressBar } from "../components/ProgressBar";
import { StatusBadge } from "../components/StatusBadge";
import type { CurriculumPhaseSummary } from "../lib/types";

// Section 38: locked phases stay visible with a locked message; their
// exercise lists are never fetched/rendered — the server already omits
// them from the response entirely.
export function Curriculum() {
  const { data, loading, error, refetch } = useFetch<{ phases: CurriculumPhaseSummary[] }>("/curriculum");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) return <LoadingState label="Loading curriculum..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Curriculum</h1>
      <p className="text-parchment/60">Master the foundation before earning the next level.</p>

      <div className="space-y-3">
        {data.phases.map((phase) => {
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
                        <StatusBadge status={exercise.status} />
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
