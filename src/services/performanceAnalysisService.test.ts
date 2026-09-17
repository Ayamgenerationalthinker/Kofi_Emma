import { describe, it, expect, beforeEach } from "vitest";
import { ensureProgressInitialized } from "./curriculumService";
import { recordAttempt } from "./performanceAnalysisService";
import { AppError } from "../lib/errors";
import { getExercise } from "../data/curriculum";

describe("performanceAnalysisService.recordAttempt", () => {
  beforeEach(() => {
    ensureProgressInitialized();
  });

  it("rejects an attempt against a locked exercise", () => {
    expect(() =>
      recordAttempt({ clientAttemptId: "attempt-locked-1", exerciseId: "S0-E02", cleanBpm: 100, accuracy: 95, durationMinutes: 10 })
    ).toThrow();

    try {
      recordAttempt({ clientAttemptId: "attempt-locked-2", exerciseId: "S0-E02", cleanBpm: 100, accuracy: 95, durationMinutes: 10 });
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe("EXERCISE_LOCKED");
    }
  });

  it("repeats the drill when accuracy is below the minimum threshold", () => {
    const exercise = getExercise("S0-E01")!;
    const result = recordAttempt({ clientAttemptId: "attempt-1", exerciseId: "S0-E01", cleanBpm: exercise.targetBpm, accuracy: 72, durationMinutes: 10 });
    expect(result.newProgressStatus).toBe("REPEAT");
    expect(result.exerciseMastered).toBe(false);
  });

  it("masters the exercise after required consecutive clean attempts and unlocks the next one", () => {
    const exercise = getExercise("S0-E01")!;

    const first = recordAttempt({ clientAttemptId: "attempt-clean-1", exerciseId: "S0-E01", cleanBpm: exercise.targetBpm, accuracy: 96, durationMinutes: 10 });
    expect(first.exerciseMastered).toBe(true);
    expect(first.newProgressStatus).toBe("MASTERED");

    // S0-E02's only prerequisite (S0-E01) is now mastered, so it should be reachable.
    const unlockedAttempt = recordAttempt({ clientAttemptId: "attempt-e2-1", exerciseId: "S0-E02", cleanBpm: 60, accuracy: 50, durationMinutes: 5 });
    expect(unlockedAttempt.wasDuplicate).toBe(false);
  });

  it("is idempotent: replaying the same clientAttemptId never double-writes progress", () => {
    const exercise = getExercise("S0-E01")!;
    const input = { clientAttemptId: "attempt-dup-1", exerciseId: "S0-E01", cleanBpm: exercise.targetBpm, accuracy: 96, durationMinutes: 10 };

    const first = recordAttempt(input);
    const second = recordAttempt(input);

    expect(second.wasDuplicate).toBe(true);
    expect(second.attemptId).toBe(first.attemptId);
  });
});
