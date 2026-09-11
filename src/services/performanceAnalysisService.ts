import { getDb, mutate, newId, type AttemptResultStatus } from "../lib/localDb";
import { getExercise, assertCanAccessExercise, recomputeUnlocks } from "./curriculumService";
import { evaluateMastery } from "./masteryService";
import { suggestNextBpm } from "./bpmProgressionService";
import { Errors } from "../lib/errors";

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
  result: AttemptResultStatus;
  recommendation: string;
  newProgressStatus: string;
  consecutiveCleanCount: number;
  requiredConsecutiveCleanAttempts: number;
  suggestedNextBpm: number;
  exerciseMastered: boolean;
  wasDuplicate: boolean;
}

// The single place the "practice -> measure -> analyze -> adjust" loop
// actually runs. Never trust a caller's claim of mastery — everything here
// is recomputed from the exercise's stored criteria every time.
export function recordAttempt(input: RecordAttemptInput): RecordAttemptResult {
  const existing = getDb().attempts.find((a) => a.clientAttemptId === input.clientAttemptId);
  if (existing) {
    return {
      attemptId: existing.id,
      result: existing.result,
      recommendation: existing.recommendation,
      newProgressStatus: existing.result === "MASTERED" ? "MASTERED" : existing.result,
      consecutiveCleanCount: 0,
      requiredConsecutiveCleanAttempts: 0,
      suggestedNextBpm: existing.cleanBpm,
      exerciseMastered: existing.result === "MASTERED",
      wasDuplicate: true,
    };
  }

  assertCanAccessExercise(input.exerciseId);

  const exercise = getExercise(input.exerciseId);
  if (!exercise) throw Errors.notFound("Exercise");

  const progress = getDb().progress[input.exerciseId];
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

  let result: AttemptResultStatus;
  let newProgressStatus: string;
  let recommendation: string;

  if (!evaluation.accuracyPassed) {
    result = input.accuracy < 50 ? "FAILED" : "REPEAT";
    newProgressStatus = "REPEAT";
    recommendation = `Repeat this drill. Drop to about ${bpmSuggestion.nextBpm} BPM until accuracy is back above ${exercise.minimumAccuracy}%. ${bpmSuggestion.rationale}`;
  } else if (!evaluation.bpmPassed) {
    result = "PASSED";
    newProgressStatus = "IN_PROGRESS";
    recommendation = `Accuracy is solid. Keep the current sticking and gradually raise tempo — try ${bpmSuggestion.nextBpm} BPM next.`;
  } else if (evaluation.mastered) {
    result = "MASTERED";
    newProgressStatus = "MASTERED";
    recommendation = `Mastery requirement completed. You held ${exercise.minimumAccuracy}%+ accuracy at ${input.cleanBpm} BPM across ${evaluation.newConsecutiveCleanCount} consecutive clean attempts.`;
  } else {
    result = "PASSED";
    newProgressStatus = "IN_PROGRESS";
    recommendation = `Clean attempt ${evaluation.newConsecutiveCleanCount} of ${exercise.requiredConsecutiveCleanAttempts}. One more clean pass at or above ${exercise.targetBpm} BPM to master this exercise.`;
  }

  const newBestAccuracy = Math.max(progress.bestAccuracy, input.accuracy);
  const newCleanBpm = evaluation.isCleanAttempt ? Math.max(progress.cleanBpm, input.cleanBpm) : progress.cleanBpm;
  const attemptId = newId();
  const nowIso = new Date().toISOString();

  mutate((db) => {
    db.attempts.push({
      id: attemptId,
      clientAttemptId: input.clientAttemptId,
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
      createdAt: nowIso,
    });

    const p = db.progress[input.exerciseId];
    p.status = newProgressStatus as typeof p.status;
    p.cleanBpm = newCleanBpm;
    p.bestAccuracy = newBestAccuracy;
    p.consecutiveCleanCount = evaluation.newConsecutiveCleanCount;
    p.attemptsCount += 1;
    p.updatedAt = nowIso;
    if (result === "MASTERED") p.masteredAt = nowIso;

    db.bpmRecords.push({
      id: newId(),
      exerciseId: input.exerciseId,
      cleanBpm: input.cleanBpm,
      accuracy: input.accuracy,
      recordedAt: nowIso,
    });
  });

  if (result === "MASTERED") {
    recomputeUnlocks();
  }

  return {
    attemptId,
    result,
    recommendation,
    newProgressStatus,
    consecutiveCleanCount: evaluation.newConsecutiveCleanCount,
    requiredConsecutiveCleanAttempts: exercise.requiredConsecutiveCleanAttempts,
    suggestedNextBpm: bpmSuggestion.nextBpm,
    exerciseMastered: result === "MASTERED",
    wasDuplicate: false,
  };
}
