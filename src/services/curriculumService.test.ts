import { describe, it, expect, beforeEach } from "vitest";
import {
  ensureProgressInitialized,
  canAccessExercise,
  canUnlockPhase,
  getCurriculumState,
  masterExercise,
} from "./curriculumService";
import { getDb } from "../lib/localDb";

describe("curriculumService locking", () => {
  beforeEach(() => {
    ensureProgressInitialized();
  });

  it("starts with only the prerequisite-free exercise in stage 0 unlocked", () => {
    expect(canAccessExercise("S0-E01")).toBe(true);
    expect(canAccessExercise("S0-E02")).toBe(false);
    expect(canAccessExercise("S1-E01")).toBe(false);
  });

  it("keeps stage 1 locked until every stage 0 exercise is mastered", () => {
    expect(canUnlockPhase("phase-1")).toBe(false);
  });

  it("unlocks the next exercise only after its prerequisite is mastered", () => {
    expect(canAccessExercise("S0-E02")).toBe(false);
    masterExercise("S0-E01");
    expect(canAccessExercise("S0-E02")).toBe(true);
  });

  it("unlocks stage 1 only once all of stage 0 is mastered, cascading to its first exercise", () => {
    const stage0Ids = ["S0-E01", "S0-E02", "S0-E03", "S0-E04"];
    for (const id of stage0Ids) masterExercise(id);

    expect(canUnlockPhase("phase-1")).toBe(false);
    expect(canAccessExercise("S1-E01")).toBe(false);

    masterExercise("S0-E05");

    expect(canUnlockPhase("phase-1")).toBe(true);
    expect(canAccessExercise("S1-E01")).toBe(true);
  });

  it("reports curriculum state progress percentages derived from mastered counts", () => {
    masterExercise("S0-E01");
    const state = getCurriculumState();
    const stage0 = state.phases.find((p) => p.number === 0)!;
    expect(stage0.masteredExercises).toBe(1);
    expect(stage0.progress).toBe(20); // 1 of 5 stage-0 exercises mastered

    expect(getDb().progress["S0-E01"].status).toBe("MASTERED");
  });
});
