import { prisma } from "../db.js";
import { ExerciseProgressStatus } from "../domain/types.js";
import { Errors } from "../lib/errors.js";

// The curriculum engine is the heart of the product (section 112): it is the
// single source of truth for what a drummer is allowed to touch. Every rule
// here is enforced server-side — the frontend's lock icons are a courtesy,
// not the actual gate (section 75).

/** Ensures a UserExerciseProgress row exists (as LOCKED) for every exercise. */
export async function ensureProgressInitialized(userId: string): Promise<void> {
  const exercises = await prisma.exercise.findMany({ select: { id: true } });
  const existing = await prisma.userExerciseProgress.findMany({
    where: { userId },
    select: { exerciseId: true },
  });
  const existingIds = new Set(existing.map((e) => e.exerciseId));
  const missing = exercises.filter((e) => !existingIds.has(e.id));

  if (missing.length > 0) {
    await prisma.userExerciseProgress.createMany({
      data: missing.map((e) => ({ userId, exerciseId: e.id, status: ExerciseProgressStatus.LOCKED })),
    });
  }

  await recomputeUnlocks(userId);
}

/**
 * Server-side gate for any endpoint that lets a user act on an exercise
 * (section 43/75). LOCKED and unknown-progress states are both denied.
 */
export async function canAccessExercise(userId: string, exerciseId: string): Promise<boolean> {
  const progress = await prisma.userExerciseProgress.findUnique({
    where: { userId_exerciseId: { userId, exerciseId } },
  });
  if (!progress) return false;
  return progress.status !== ExerciseProgressStatus.LOCKED;
}

export async function assertCanAccessExercise(userId: string, exerciseId: string): Promise<void> {
  const allowed = await canAccessExercise(userId, exerciseId);
  if (!allowed) throw Errors.exerciseLocked();
}

/** A phase unlocks once every exercise in the previous phase is MASTERED. */
export async function canUnlockPhase(userId: string, phaseId: string): Promise<boolean> {
  const phase = await prisma.curriculumPhase.findUnique({ where: { id: phaseId } });
  if (!phase) throw Errors.notFound("Phase");
  if (phase.number === 1) return true;

  const previousPhase = await prisma.curriculumPhase.findUnique({ where: { number: phase.number - 1 } });
  if (!previousPhase) return true;

  const prevExercises = await prisma.exercise.findMany({
    where: { phaseId: previousPhase.id },
    select: { id: true },
  });
  if (prevExercises.length === 0) return true;

  const progress = await prisma.userExerciseProgress.findMany({
    where: { userId, exerciseId: { in: prevExercises.map((e) => e.id) } },
  });
  const masteredCount = progress.filter((p) => p.status === ExerciseProgressStatus.MASTERED).length;
  return masteredCount === prevExercises.length;
}

/**
 * Walks every exercise and flips LOCKED -> AVAILABLE for anything whose
 * prerequisites (including the implicit phase-level gate) are now satisfied.
 * Safe to call repeatedly; it never downgrades a status.
 */
export async function recomputeUnlocks(userId: string): Promise<void> {
  const exercises = await prisma.exercise.findMany({
    include: { prerequisitesOf: true },
    orderBy: [{ phase: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  const progressRows = await prisma.userExerciseProgress.findMany({ where: { userId } });
  const progressByExercise = new Map(progressRows.map((p) => [p.exerciseId, p]));

  for (const exercise of exercises) {
    const progress = progressByExercise.get(exercise.id);
    if (!progress || progress.status !== ExerciseProgressStatus.LOCKED) continue;

    const phaseUnlocked = await canUnlockPhase(userId, exercise.phaseId);
    if (!phaseUnlocked) continue;

    const prereqIds = exercise.prerequisitesOf.map((p) => p.prerequisiteId);
    const masteredPrereqs = prereqIds.every(
      (id) => progressByExercise.get(id)?.status === ExerciseProgressStatus.MASTERED
    );

    if (masteredPrereqs) {
      await prisma.userExerciseProgress.update({
        where: { userId_exerciseId: { userId, exerciseId: exercise.id } },
        data: { status: ExerciseProgressStatus.AVAILABLE },
      });
      progressByExercise.set(exercise.id, { ...progress, status: ExerciseProgressStatus.AVAILABLE });
    }
  }
}

/** Deterministic "what should this drummer work on right now" pick. */
export async function getNextAvailableExercise(userId: string) {
  await ensureProgressInitialized(userId);

  const progressRows = await prisma.userExerciseProgress.findMany({
    where: {
      userId,
      status: { in: [ExerciseProgressStatus.REPEAT, ExerciseProgressStatus.IN_PROGRESS, ExerciseProgressStatus.AVAILABLE] },
    },
    include: { exercise: { include: { phase: true } } },
  });

  if (progressRows.length === 0) return null;

  const priorityOrder: Record<string, number> = {
    [ExerciseProgressStatus.REPEAT]: 0,
    [ExerciseProgressStatus.IN_PROGRESS]: 1,
    [ExerciseProgressStatus.AVAILABLE]: 2,
  };

  progressRows.sort((a, b) => {
    const pa = priorityOrder[a.status] ?? 99;
    const pb = priorityOrder[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    if (a.exercise.phase.sortOrder !== b.exercise.phase.sortOrder) {
      return a.exercise.phase.sortOrder - b.exercise.phase.sortOrder;
    }
    return a.exercise.sortOrder - b.exercise.sortOrder;
  });

  return progressRows[0];
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

export async function getCurriculumState(userId: string): Promise<CurriculumStateDto> {
  await ensureProgressInitialized(userId);

  const phases = await prisma.curriculumPhase.findMany({
    orderBy: { sortOrder: "asc" },
    include: { exercises: { select: { id: true } } },
  });
  const progressRows = await prisma.userExerciseProgress.findMany({ where: { userId } });
  const progressByExercise = new Map(progressRows.map((p) => [p.exerciseId, p.status]));

  let currentPhaseNumber = 1;
  let totalMastered = 0;
  let totalExercises = 0;

  const phaseDtos = await Promise.all(
    phases.map(async (phase) => {
      const total = phase.exercises.length;
      const mastered = phase.exercises.filter(
        (e) => progressByExercise.get(e.id) === ExerciseProgressStatus.MASTERED
      ).length;
      totalMastered += mastered;
      totalExercises += total;

      const unlocked = await canUnlockPhase(userId, phase.id);
      const isComplete = total > 0 && mastered === total;
      const status: "CURRENT" | "LOCKED" | "COMPLETE" = !unlocked
        ? "LOCKED"
        : isComplete
          ? "COMPLETE"
          : "CURRENT";

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
    })
  );

  const nextExercise = await getNextAvailableExercise(userId);

  return {
    currentPhaseNumber,
    currentExerciseId: nextExercise?.exerciseId ?? null,
    phases: phaseDtos,
    overallProgress: totalExercises === 0 ? 0 : Math.round((totalMastered / totalExercises) * 100),
  };
}

/** Marks an exercise MASTERED and cascades unlocks. Called only from PerformanceAnalysisService. */
export async function masterExercise(userId: string, exerciseId: string): Promise<void> {
  await prisma.userExerciseProgress.update({
    where: { userId_exerciseId: { userId, exerciseId } },
    data: { status: ExerciseProgressStatus.MASTERED, masteredAt: new Date() },
  });
  await recomputeUnlocks(userId);
}

export async function unlockNextExercise(userId: string): Promise<void> {
  await recomputeUnlocks(userId);
}
