import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../db.js";
import { cleanDatabase, createTestUser, seedMinimalCurriculum, initProgress } from "../test/dbHelpers.js";
import { canAccessExercise, canUnlockPhase, getCurriculumState, masterExercise } from "./curriculumService.js";
import { ExerciseProgressStatus } from "../domain/types.js";

describe("curriculumService locking", () => {
  beforeEach(cleanDatabase);

  it("starts with only the prerequisite-free exercise in phase 1 unlocked", async () => {
    const user = await createTestUser();
    const { e1, e2, e3 } = await seedMinimalCurriculum();
    await initProgress(user.id);

    expect(await canAccessExercise(user.id, e1.id)).toBe(true);
    expect(await canAccessExercise(user.id, e2.id)).toBe(false);
    expect(await canAccessExercise(user.id, e3.id)).toBe(false);
  });

  it("keeps phase 2 locked until every phase 1 exercise is mastered", async () => {
    const user = await createTestUser();
    const { phase2 } = await seedMinimalCurriculum();
    await initProgress(user.id);

    expect(await canUnlockPhase(user.id, phase2.id)).toBe(false);
  });

  it("unlocks the next exercise only after its prerequisite is mastered", async () => {
    const user = await createTestUser();
    const { e1, e2 } = await seedMinimalCurriculum();
    await initProgress(user.id);

    expect(await canAccessExercise(user.id, e2.id)).toBe(false);
    await masterExercise(user.id, e1.id);
    expect(await canAccessExercise(user.id, e2.id)).toBe(true);
  });

  it("unlocks phase 2 only once all of phase 1 is mastered, cascading to its first exercise", async () => {
    const user = await createTestUser();
    const { e1, e2, e3, phase2 } = await seedMinimalCurriculum();
    await initProgress(user.id);

    await masterExercise(user.id, e1.id);
    expect(await canUnlockPhase(user.id, phase2.id)).toBe(false);
    expect(await canAccessExercise(user.id, e3.id)).toBe(false);

    await masterExercise(user.id, e2.id);
    expect(await canUnlockPhase(user.id, phase2.id)).toBe(true);
    expect(await canAccessExercise(user.id, e3.id)).toBe(true);
  });

  it("reports curriculum state progress percentages derived from mastered counts", async () => {
    const user = await createTestUser();
    const { e1 } = await seedMinimalCurriculum();
    await initProgress(user.id);

    await masterExercise(user.id, e1.id);
    const state = await getCurriculumState(user.id);
    const phase1 = state.phases.find((p) => p.number === 1)!;
    expect(phase1.masteredExercises).toBe(1);
    expect(phase1.progress).toBe(50); // 1 of 2 phase-1 exercises mastered

    const progress = await prisma.userExerciseProgress.findUnique({
      where: { userId_exerciseId: { userId: user.id, exerciseId: e1.id } },
    });
    expect(progress?.status).toBe(ExerciseProgressStatus.MASTERED);
  });
});
