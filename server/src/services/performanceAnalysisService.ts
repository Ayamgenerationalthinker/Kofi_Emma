import { prisma } from "../db.js";
import { AttemptResult, ExerciseProgressStatus } from "../domain/types.js";
import { assertCanAccessExercise, recomputeUnlocks } from "./curriculumService.js";
import { evaluateMastery } from "./masteryService.js";
import { suggestNextBpm } from "./bpmProgressionService.js";
import { Errors } from "../lib/errors.js";

export interface RecordAttemptInput {
  clientAttemptId: string;
  exerciseId: string;
  sessionId?: string | null;
  cleanBpm: number;
  maximumBpm?: number | null;
  accuracy: number;
  durationMinutes: number;
  perceivedDifficulty?: number;
  notes?: string | null;
}

export interface RecordAttemptResult {
  attemptId: string;
  result: string;
  recommendation: string;
  newProgressStatus: string;
  consecutiveCleanCount: number;
  requiredConsecutiveCleanAttempts: number;
  suggestedNextBpm: number;
  exerciseMastered: boolean;
  wasDuplicate: boolean;
}

// The single place the "practice -> measure -> analyze -> adjust" loop
// (section 112) actually runs. Never trust a client claim of mastery
// (section 43/75) — everything here is recomputed from stored criteria.
export async function recordAttempt(userId: string, input: RecordAttemptInput): Promise<RecordAttemptResult> {
  const existing = await prisma.exerciseAttempt.findUnique({ where: { clientAttemptId: input.clientAttemptId } });
  if (existing) {
    return {
      attemptId: existing.id,
      result: existing.result,
      recommendation: existing.recommendation,
      newProgressStatus: existing.result === AttemptResult.MASTERED ? ExerciseProgressStatus.MASTERED : existing.result,
      consecutiveCleanCount: 0,
      requiredConsecutiveCleanAttempts: 0,
      suggestedNextBpm: existing.cleanBpm,
      exerciseMastered: existing.result === AttemptResult.MASTERED,
      wasDuplicate: true,
    };
  }

  await assertCanAccessExercise(userId, input.exerciseId);

  const exercise = await prisma.exercise.findUnique({ where: { id: input.exerciseId } });
  if (!exercise) throw Errors.notFound("Exercise");

  const progress = await prisma.userExerciseProgress.findUnique({
    where: { userId_exerciseId: { userId, exerciseId: input.exerciseId } },
  });
  if (!progress) throw Errors.notFound("Progress record");

  if (input.maximumBpm != null && input.cleanBpm > input.maximumBpm) {
    throw Errors.validation("Clean BPM cannot exceed maximum BPM.");
  }

  const evaluation = evaluateMastery({
    accuracy: input.accuracy,
    cleanBpm: input.cleanBpm,
    priorConsecutiveCleanCount: progress.consecutiveCleanCount,
    criteria: {
      minimumAccuracy: exercise.minimumAccuracy,
      targetBpm: exercise.targetBpm,
      requiredConsecutiveCleanAttempts: exercise.requiredConsecutiveCleanAttempts,
    },
  });

  const bpmSuggestion = suggestNextBpm({
    currentBpm: input.cleanBpm,
    accuracy: input.accuracy,
    minimumBpm: exercise.minimumBpm,
    maximumBpm: exercise.maximumBpm,
  });

  let result: string;
  let newProgressStatus: string;
  let recommendation: string;

  if (!evaluation.accuracyPassed) {
    result = input.accuracy < 50 ? AttemptResult.FAILED : AttemptResult.REPEAT;
    newProgressStatus = ExerciseProgressStatus.REPEAT;
    recommendation = `Repeat this drill. Drop to about ${bpmSuggestion.nextBpm} BPM until accuracy is back above ${exercise.minimumAccuracy}%. ${bpmSuggestion.rationale}`;
  } else if (!evaluation.bpmPassed) {
    result = AttemptResult.PASSED;
    newProgressStatus = ExerciseProgressStatus.IN_PROGRESS;
    recommendation = `Accuracy is solid. Keep the current sticking and gradually raise tempo — try ${bpmSuggestion.nextBpm} BPM next.`;
  } else if (evaluation.mastered) {
    result = AttemptResult.MASTERED;
    newProgressStatus = ExerciseProgressStatus.MASTERED;
    recommendation = `Mastery requirement completed. You held ${exercise.minimumAccuracy}%+ accuracy at ${input.cleanBpm} BPM across ${evaluation.newConsecutiveCleanCount} consecutive clean attempts.`;
  } else {
    result = AttemptResult.PASSED;
    newProgressStatus = ExerciseProgressStatus.IN_PROGRESS;
    recommendation = `Clean attempt ${evaluation.newConsecutiveCleanCount} of ${exercise.requiredConsecutiveCleanAttempts}. One more clean pass at or above ${exercise.targetBpm} BPM to master this exercise.`;
  }

  const newBestAccuracy = Math.max(progress.bestAccuracy, input.accuracy);
  const newCleanBpm = evaluation.isCleanAttempt ? Math.max(progress.cleanBpm, input.cleanBpm) : progress.cleanBpm;

  const attempt = await prisma.$transaction(async (tx) => {
    const created = await tx.exerciseAttempt.create({
      data: {
        clientAttemptId: input.clientAttemptId,
        userId,
        exerciseId: input.exerciseId,
        sessionId: input.sessionId ?? null,
        targetBpm: exercise.targetBpm,
        cleanBpm: input.cleanBpm,
        maximumBpm: input.maximumBpm ?? null,
        accuracy: input.accuracy,
        durationMinutes: input.durationMinutes,
        perceivedDifficulty: input.perceivedDifficulty ?? 3,
        notes: input.notes ?? null,
        result,
        recommendation,
      },
    });

    await tx.userExerciseProgress.update({
      where: { userId_exerciseId: { userId, exerciseId: input.exerciseId } },
      data: {
        status: newProgressStatus,
        cleanBpm: newCleanBpm,
        bestAccuracy: newBestAccuracy,
        consecutiveCleanCount: evaluation.newConsecutiveCleanCount,
        attemptsCount: { increment: 1 },
        masteredAt: result === AttemptResult.MASTERED ? new Date() : undefined,
      },
    });

    await tx.bpmRecord.create({
      data: {
        userId,
        exerciseId: input.exerciseId,
        cleanBpm: input.cleanBpm,
        accuracy: input.accuracy,
      },
    });

    return created;
  });

  if (result === AttemptResult.MASTERED) {
    await recomputeUnlocks(userId);
  }

  return {
    attemptId: attempt.id,
    result,
    recommendation,
    newProgressStatus,
    consecutiveCleanCount: evaluation.newConsecutiveCleanCount,
    requiredConsecutiveCleanAttempts: exercise.requiredConsecutiveCleanAttempts,
    suggestedNextBpm: bpmSuggestion.nextBpm,
    exerciseMastered: result === AttemptResult.MASTERED,
    wasDuplicate: false,
  };
}
