import { describe, it, expect, beforeEach } from "vitest";
import { cleanDatabase, createTestUser, seedMinimalCurriculum, initProgress } from "../test/dbHelpers.js";
import { recordAttempt } from "./performanceAnalysisService.js";
import { AppError } from "../lib/errors.js";

describe("performanceAnalysisService.recordAttempt", () => {
  beforeEach(cleanDatabase);

  it("rejects an attempt against a locked exercise", async () => {
    const user = await createTestUser();
    const { e2 } = await seedMinimalCurriculum();
    await initProgress(user.id);

    await expect(
      recordAttempt(user.id, {
        clientAttemptId: "attempt-locked-1",
        exerciseId: e2.id,
        cleanBpm: 110,
        accuracy: 95,
        durationMinutes: 10,
      })
    ).rejects.toThrow();

    try {
      await recordAttempt(user.id, {
        clientAttemptId: "attempt-locked-2",
        exerciseId: e2.id,
        cleanBpm: 110,
        accuracy: 95,
        durationMinutes: 10,
      });
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(403);
      expect((err as AppError).code).toBe("EXERCISE_LOCKED");
    }
  });

  it("repeats the drill when accuracy is below the minimum threshold", async () => {
    const user = await createTestUser();
    const { e1 } = await seedMinimalCurriculum();
    await initProgress(user.id);

    const result = await recordAttempt(user.id, {
      clientAttemptId: "attempt-1",
      exerciseId: e1.id,
      cleanBpm: 100,
      accuracy: 72,
      durationMinutes: 10,
    });

    expect(result.newProgressStatus).toBe("REPEAT");
    expect(result.exerciseMastered).toBe(false);
  });

  it("masters the exercise after two consecutive clean attempts and unlocks the next one", async () => {
    const user = await createTestUser();
    const { e1, e2 } = await seedMinimalCurriculum();
    await initProgress(user.id);

    const first = await recordAttempt(user.id, {
      clientAttemptId: "attempt-clean-1",
      exerciseId: e1.id,
      cleanBpm: 100,
      accuracy: 92,
      durationMinutes: 10,
    });
    expect(first.exerciseMastered).toBe(false);
    expect(first.newProgressStatus).toBe("IN_PROGRESS");

    const second = await recordAttempt(user.id, {
      clientAttemptId: "attempt-clean-2",
      exerciseId: e1.id,
      cleanBpm: 100,
      accuracy: 94,
      durationMinutes: 10,
    });
    expect(second.exerciseMastered).toBe(true);
    expect(second.newProgressStatus).toBe("MASTERED");

    // e2's only prerequisite (e1) is now mastered, so it should be reachable.
    const unlockedAttempt = await recordAttempt(user.id, {
      clientAttemptId: "attempt-e2-1",
      exerciseId: e2.id,
      cleanBpm: 60,
      accuracy: 50,
      durationMinutes: 5,
    });
    expect(unlockedAttempt.wasDuplicate).toBe(false);
  });

  it("is idempotent: replaying the same clientAttemptId never double-writes progress", async () => {
    const user = await createTestUser();
    const { e1 } = await seedMinimalCurriculum();
    await initProgress(user.id);

    const input = {
      clientAttemptId: "attempt-dup-1",
      exerciseId: e1.id,
      cleanBpm: 100,
      accuracy: 96,
      durationMinutes: 10,
    };

    const first = await recordAttempt(user.id, input);
    const second = await recordAttempt(user.id, input);

    expect(second.wasDuplicate).toBe(true);
    expect(second.attemptId).toBe(first.attemptId);
  });
});
