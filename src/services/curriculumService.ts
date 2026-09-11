import { EXERCISES, PHASES, exercisesForPhase, getExercise, type CurriculumExercise } from "../data/curriculum";
import { getDb, mutate, type ProgressRecord } from "../lib/localDb";
import { Errors } from "../lib/errors";

// The curriculum engine is the heart of the product: the single source of
// truth for what a drummer is allowed to touch. It runs entirely in this
// tab against LocalStorage — there is no server to bypass, but the same
// rule still applies: nothing outside `recomputeUnlocks` is allowed to flip
// a status, so a bug in one screen can never let progress skip ahead.

function nowIso(): string {
  return new Date().toISOString();
}

/** Ensures a ProgressRecord exists (as LOCKED) for every exercise, then unlocks whatever is eligible. */
export function ensureProgressInitialized(): void {
  mutate((db) => {
    for (const exercise of EXERCISES) {
      if (!db.progress[exercise.id]) {
        db.progress[exercise.id] = {
          exerciseId: exercise.id,
          status: "LOCKED",
          cleanBpm: 0,
          bestAccuracy: 0,
          consecutiveCleanCount: 0,
          attemptsCount: 0,
          masteredAt: null,
          updatedAt: nowIso(),
        };
      }
    }
  });
  recomputeUnlocks();
}

function getProgress(exerciseId: string): ProgressRecord | undefined {
  return getDb().progress[exerciseId];
}

export function canAccessExercise(exerciseId: string): boolean {
  const progress = getProgress(exerciseId);
  if (!progress) return false;
  return progress.status !== "LOCKED";
}

export function assertCanAccessExercise(exerciseId: string): void {
  if (!canAccessExercise(exerciseId)) throw Errors.exerciseLocked();
}

/** A phase unlocks once every exercise in the previous phase is MASTERED. */
export function canUnlockPhase(phaseId: string): boolean {
  const phase = PHASES.find((p) => p.id === phaseId);
  if (!phase) throw Errors.notFound("Phase");
  if (phase.number === 0) return true;

  const previousPhase = PHASES.find((p) => p.number === phase.number - 1);
  if (!previousPhase) return true;

  const prevExercises = exercisesForPhase(previousPhase.id);
  if (prevExercises.length === 0) return true;

  const db = getDb();
  return prevExercises.every((e) => db.progress[e.id]?.status === "MASTERED");
}

/** Walks every exercise and flips LOCKED -> AVAILABLE for anything whose prerequisites are now satisfied. */
export function recomputeUnlocks(): void {
  mutate((db) => {
    for (const exercise of [...EXERCISES].sort((a, b) => a.sortOrder - b.sortOrder)) {
      const progress = db.progress[exercise.id];
      if (!progress || progress.status !== "LOCKED") continue;

      if (!canUnlockPhaseInternal(db, exercise.phaseId)) continue;

      const prereqsMastered = exercise.prerequisiteIds.every((id) => db.progress[id]?.status === "MASTERED");
      if (prereqsMastered) {
        progress.status = "AVAILABLE";
        progress.updatedAt = nowIso();
      }
    }
  });
}

// Internal variant used while already inside a mutate() callback, operating on the draft directly.
function canUnlockPhaseInternal(db: ReturnType<typeof getDb>, phaseId: string): boolean {
  const phase = PHASES.find((p) => p.id === phaseId);
  if (!phase || phase.number === 0) return true;
  const previousPhase = PHASES.find((p) => p.number === phase.number - 1);
  if (!previousPhase) return true;
  const prevExercises = exercisesForPhase(previousPhase.id);
  if (prevExercises.length === 0) return true;
  return prevExercises.every((e) => db.progress[e.id]?.status === "MASTERED");
}

const PRIORITY_ORDER: Record<string, number> = { REPEAT: 0, IN_PROGRESS: 1, AVAILABLE: 2 };

// Pure read — assumes ensureProgressInitialized() has already run (called
// once from an effect at app start-up). Safe to call from a useLocalDb
// selector, which must never itself trigger a store mutation.
export function getNextAvailableExercise(): { exercise: CurriculumExercise; progress: ProgressRecord } | null {
  const db = getDb();

  const candidates = EXERCISES.filter((e) => {
    const status = db.progress[e.id]?.status;
    return status === "REPEAT" || status === "IN_PROGRESS" || status === "AVAILABLE";
  });
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const pa = PRIORITY_ORDER[db.progress[a.id].status] ?? 99;
    const pb = PRIORITY_ORDER[db.progress[b.id].status] ?? 99;
    if (pa !== pb) return pa - pb;
    if (a.phaseNumber !== b.phaseNumber) return a.phaseNumber - b.phaseNumber;
    return a.sortOrder - b.sortOrder;
  });

  const exercise = candidates[0];
  return { exercise, progress: db.progress[exercise.id] };
}

export interface CurriculumStateDto {
  currentPhaseNumber: number;
  currentExerciseId: string | null;
  phases: Array<{
    id: string;
    number: number;
    title: string;
    subtitle: string;
    status: "CURRENT" | "LOCKED" | "COMPLETE";
    progress: number;
    totalExercises: number;
    masteredExercises: number;
  }>;
  overallProgress: number;
}

// Pure read — same assumption as getNextAvailableExercise() above.
export function getCurriculumState(): CurriculumStateDto {
  const db = getDb();

  let currentPhaseNumber = 0;
  let totalMastered = 0;
  let totalExercises = 0;

  const phaseDtos = PHASES.map((phase) => {
    const exercises = exercisesForPhase(phase.id);
    const total = exercises.length;
    const mastered = exercises.filter((e) => db.progress[e.id]?.status === "MASTERED").length;
    totalMastered += mastered;
    totalExercises += total;

    const unlocked = canUnlockPhase(phase.id);
    const isComplete = total > 0 && mastered === total;
    const status: "CURRENT" | "LOCKED" | "COMPLETE" = !unlocked ? "LOCKED" : isComplete ? "COMPLETE" : "CURRENT";
    if (status === "CURRENT") currentPhaseNumber = phase.number;

    return {
      id: phase.id,
      number: phase.number,
      title: phase.title,
      subtitle: phase.subtitle,
      status,
      progress: total === 0 ? 0 : Math.round((mastered / total) * 100),
      totalExercises: total,
      masteredExercises: mastered,
    };
  });

  const next = getNextAvailableExercise();

  return {
    currentPhaseNumber,
    currentExerciseId: next?.exercise.id ?? null,
    phases: phaseDtos,
    overallProgress: totalExercises === 0 ? 0 : Math.round((totalMastered / totalExercises) * 100),
  };
}

export function masterExercise(exerciseId: string): void {
  mutate((db) => {
    const progress = db.progress[exerciseId];
    if (!progress) return;
    progress.status = "MASTERED";
    progress.masteredAt = nowIso();
    progress.updatedAt = nowIso();
  });
  recomputeUnlocks();
}

export { getExercise };
