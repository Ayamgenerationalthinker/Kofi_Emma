import { describe, it, expect, beforeEach } from "vitest";
import {
  ensureProgressInitialized,
  canAccessExercise,
  canUnlockPhase,
  getCurriculumState,
  masterExercise,
} from "./curriculumService";
import { getDb } from "../lib/localDb";

// These tests exercise the real, full 40-exercise curriculum (no test
// fixture) — this is the same content the shipped app uses, so the tests
// double as a check that the curriculum's own prerequisite graph behaves
// as intended.
describe("curriculumService locking", () => {
  beforeEach(() => {
    ensureProgressInitialized();
  });

  it("starts with only the prerequisite-free exercise in phase 1 unlocked", () => {
    expect(canAccessExercise("P1-E01")).toBe(true);
    expect(canAccessExercise("P1-E02")).toBe(false);
    expect(canAccessExercise("P2-E01")).toBe(false);
  });

  it("keeps phase 2 locked until every phase 1 exercise is mastered", () => {
    expect(canUnlockPhase("phase-2")).toBe(false);
  });

  it("unlocks the next exercise only after its prerequisite is mastered", () => {
    expect(canAccessExercise("P1-E02")).toBe(false);
    masterExercise("P1-E01");
    expect(canAccessExercise("P1-E02")).toBe(true);
  });

  it("unlocks phase 2 only once all of phase 1 is mastered, cascading to its first exercise", () => {
    const phase1Ids = ["P1-E01", "P1-E02", "P1-E03", "P1-E04", "P1-E05", "P1-E06", "P1-E07", "P1-E08", "P1-E09"];
    for (const id of phase1Ids) masterExercise(id);

    expect(canUnlockPhase("phase-2")).toBe(false);
    expect(canAccessExercise("P2-E01")).toBe(false);

    masterExercise("P1-E10");

    expect(canUnlockPhase("phase-2")).toBe(true);
    expect(canAccessExercise("P2-E01")).toBe(true);
  });

  it("reports curriculum state progress percentages derived from mastered counts", () => {
    masterExercise("P1-E01");
    const state = getCurriculumState();
    const phase1 = state.phases.find((p) => p.number === 1)!;
    expect(phase1.masteredExercises).toBe(1);
    expect(phase1.progress).toBe(10); // 1 of 10 phase-1 exercises mastered

    expect(getDb().progress["P1-E01"].status).toBe("MASTERED");
  });
});
