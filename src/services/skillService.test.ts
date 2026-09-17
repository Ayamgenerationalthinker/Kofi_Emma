import { describe, it, expect, beforeEach } from "vitest";
import { getSkillProgress, getWeakestSkill, getStrongestSkill } from "./skillService";
import { ensureProgressInitialized, masterExercise } from "./curriculumService";
import { mutate } from "../lib/localDb";

describe("skillService", () => {
  beforeEach(() => {
    ensureProgressInitialized();
  });

  it("reports no data for every skill before any practice happens", () => {
    const progress = getSkillProgress();
    expect(progress.every((p) => p.hasData === false)).toBe(true);
    expect(getWeakestSkill(progress)).toBeNull();
    expect(getStrongestSkill(progress)).toBeNull();
  });

  it("never reports a fabricated percentage for a skill with no real attempts", () => {
    masterExercise("S1-E01");
    const groove = getSkillProgress().find((p) => p.skill === "Groove")!;
    expect(groove.hasData).toBe(false);
  });

  it("gains real data for a skill once an exercise developing it has been attempted", () => {
    mutate((db) => {
      db.progress["S1-E01"].attemptsCount = 1;
      db.progress["S1-E01"].status = "MASTERED";
    });
    const progress = getSkillProgress();
    const timing = progress.find((p) => p.skill === "Timing")!;
    const chops = progress.find((p) => p.skill === "Chops")!;
    expect(timing.hasData).toBe(true);
    expect(chops.hasData).toBe(true);
    expect(timing.percentage).toBeGreaterThan(0);
  });

  it("identifies the weakest and strongest skill only among skills with real data", () => {
    mutate((db) => {
      db.progress["S1-E01"].attemptsCount = 1;
      db.progress["S1-E01"].status = "MASTERED";
    });
    const progress = getSkillProgress();
    const weakest = getWeakestSkill(progress);
    const strongest = getStrongestSkill(progress);
    expect(weakest).not.toBeNull();
    expect(strongest).not.toBeNull();
    // Independence/Groove/Speed still have zero data and must be excluded.
    expect(["Timing", "Chops"]).toContain(weakest!.skill);
    expect(["Timing", "Chops"]).toContain(strongest!.skill);
  });
});
