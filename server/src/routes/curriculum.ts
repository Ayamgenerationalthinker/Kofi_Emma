import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireLocalUser } from "../lib/singleUser.js";
import { canAccessExercise, canUnlockPhase, getCurriculumState } from "../services/curriculumService.js";
import { Errors } from "../lib/errors.js";
import { ExerciseProgressStatus } from "../domain/types.js";

export const curriculumRouter = Router();

// GET /api/curriculum — section 38: locked phases stay visible but their
// exercises are never sent to the client, only a locked message.
curriculumRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const user = await requireLocalUser();
    const phases = await prisma.curriculumPhase.findMany({
      orderBy: { sortOrder: "asc" },
      include: { exercises: { orderBy: { sortOrder: "asc" } } },
    });
    const progressRows = await prisma.userExerciseProgress.findMany({ where: { userId: user.id } });
    const progressByExercise = new Map(progressRows.map((p) => [p.exerciseId, p]));

    const dto = await Promise.all(
      phases.map(async (phase) => {
        const unlocked = await canUnlockPhase(user.id, phase.id);
        const masteredCount = phase.exercises.filter(
          (e) => progressByExercise.get(e.id)?.status === ExerciseProgressStatus.MASTERED
        ).length;

        return {
          id: phase.id,
          number: phase.number,
          title: phase.title,
          subtitle: phase.subtitle,
          description: phase.description,
          unlocked,
          progress: phase.exercises.length === 0 ? 0 : Math.round((masteredCount / phase.exercises.length) * 100),
          lockedMessage: unlocked
            ? null
            : `Master all Phase ${phase.number - 1} prerequisites to unlock ${phase.title}.`,
          exercises: unlocked
            ? phase.exercises.map((e) => ({
                id: e.id,
                name: e.name,
                slug: e.slug,
                category: e.category,
                difficulty: e.difficulty,
                targetBpm: e.targetBpm,
                status: progressByExercise.get(e.id)?.status ?? ExerciseProgressStatus.LOCKED,
              }))
            : [],
        };
      })
    );

    res.json({ phases: dto });
  })
);

curriculumRouter.get(
  "/state",
  asyncHandler(async (_req, res) => {
    const user = await requireLocalUser();
    const state = await getCurriculumState(user.id);
    res.json(state);
  })
);

curriculumRouter.get(
  "/phases/:phaseId",
  asyncHandler(async (req, res) => {
    const user = await requireLocalUser();
    const phase = await prisma.curriculumPhase.findUnique({
      where: { id: req.params.phaseId },
      include: { exercises: { orderBy: { sortOrder: "asc" } } },
    });
    if (!phase) throw Errors.notFound("Phase");

    const unlocked = await canUnlockPhase(user.id, phase.id);
    if (!unlocked) {
      res.json({
        id: phase.id,
        number: phase.number,
        title: phase.title,
        unlocked: false,
        lockedMessage: `Master all Phase ${phase.number - 1} prerequisites to unlock ${phase.title}.`,
        exercises: [],
      });
      return;
    }

    const progressRows = await prisma.userExerciseProgress.findMany({
      where: { userId: user.id, exerciseId: { in: phase.exercises.map((e) => e.id) } },
    });
    const progressByExercise = new Map(progressRows.map((p) => [p.exerciseId, p]));

    res.json({
      id: phase.id,
      number: phase.number,
      title: phase.title,
      subtitle: phase.subtitle,
      description: phase.description,
      unlocked: true,
      lockedMessage: null,
      exercises: phase.exercises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        category: e.category,
        difficulty: e.difficulty,
        targetBpm: e.targetBpm,
        status: progressByExercise.get(e.id)?.status ?? ExerciseProgressStatus.LOCKED,
      })),
    });
  })
);

curriculumRouter.get(
  "/exercises/:exerciseId",
  asyncHandler(async (req, res) => {
    await exerciseDetailHandler(req.params.exerciseId, res);
  })
);

export const exercisesRouter = Router();
exercisesRouter.get(
  "/:exerciseId",
  asyncHandler(async (req, res) => {
    await exerciseDetailHandler(req.params.exerciseId, res);
  })
);

async function exerciseDetailHandler(exerciseId: string, res: import("express").Response) {
  const user = await requireLocalUser();
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      phase: true,
      prerequisitesOf: { include: { prerequisite: { select: { id: true, name: true } } } },
    },
  });
  if (!exercise) throw Errors.notFound("Exercise");

  const accessible = await canAccessExercise(user.id, exerciseId);
  const progress = await prisma.userExerciseProgress.findUnique({
    where: { userId_exerciseId: { userId: user.id, exerciseId } },
  });

  if (!accessible) {
    res.json({
      id: exercise.id,
      name: exercise.name,
      phaseId: exercise.phaseId,
      status: ExerciseProgressStatus.LOCKED,
      locked: true,
      prerequisites: exercise.prerequisitesOf.map((p) => p.prerequisite),
    });
    return;
  }

  res.json({
    id: exercise.id,
    phaseId: exercise.phaseId,
    phaseTitle: exercise.phase.title,
    name: exercise.name,
    slug: exercise.slug,
    description: exercise.description,
    purpose: exercise.purpose,
    category: exercise.category,
    timeSignature: exercise.timeSignature,
    subdivision: exercise.subdivision,
    stickingPattern: exercise.stickingPattern,
    orchestration: JSON.parse(exercise.orchestrationJson),
    patternEvents: JSON.parse(exercise.patternEventsJson),
    techniqueNotes: exercise.techniqueNotes,
    commonMistakes: exercise.commonMistakes.split("\n").filter(Boolean),
    targetBpm: exercise.targetBpm,
    minimumBpm: exercise.minimumBpm,
    maximumBpm: exercise.maximumBpm,
    minimumAccuracy: exercise.minimumAccuracy,
    requiredConsecutiveCleanAttempts: exercise.requiredConsecutiveCleanAttempts,
    durationMinutes: exercise.durationMinutes,
    difficulty: exercise.difficulty,
    styleLabel: exercise.styleLabel,
    locked: false,
    status: progress?.status ?? ExerciseProgressStatus.AVAILABLE,
    cleanBpm: progress?.cleanBpm ?? 0,
    bestAccuracy: progress?.bestAccuracy ?? 0,
    consecutiveCleanCount: progress?.consecutiveCleanCount ?? 0,
    attemptsCount: progress?.attemptsCount ?? 0,
    prerequisites: exercise.prerequisitesOf.map((p) => p.prerequisite),
  });
}
