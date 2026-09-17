import { describe, it, expect, beforeEach } from "vitest";
import { checkAndUnlockAchievements, isAchievementUnlocked, getUnlockedAchievements } from "./achievementService";
import { ensureProgressInitialized, masterExercise } from "./curriculumService";
import { mutate, newId } from "../lib/localDb";

const TZ = "Africa/Accra";
const STAGE_0_EXERCISE_IDS = ["S0-E01", "S0-E02", "S0-E03", "S0-E04", "S0-E05"];

function addCompletedSession(dateKey: string): void {
  mutate((db) => {
    db.sessions.push({
      id: newId(),
      date: dateKey,
      status: "COMPLETED",
      totalMinutes: 25,
      startedAt: `${dateKey}T07:00:00.000Z`,
      completedAt: `${dateKey}T07:25:00.000Z`,
      dailyLessonId: null,
    });
  });
}

describe("achievementService", () => {
  beforeEach(() => {
    ensureProgressInitialized();
  });

  it("unlocks nothing when there is no real activity", () => {
    const unlocked = checkAndUnlockAchievements(TZ);
    expect(unlocked).toEqual([]);
    expect(getUnlockedAchievements()).toEqual([]);
  });

  it("unlocks first_practice only after a real completed session, not before", () => {
    expect(checkAndUnlockAchievements(TZ)).not.toContain("first_practice");
    addCompletedSession("2026-01-01");
    expect(checkAndUnlockAchievements(TZ)).toContain("first_practice");
    expect(isAchievementUnlocked("first_practice")).toBe(true);
  });

  it("unlocks first_groove and clean-bpm achievements only once real mastery/bpm exists", () => {
    expect(checkAndUnlockAchievements(TZ)).not.toContain("first_groove");
    masterExercise("S0-E01");
    mutate((db) => {
      db.progress["S0-E01"].cleanBpm = 65;
    });
    const unlocked = checkAndUnlockAchievements(TZ);
    expect(unlocked).toContain("first_groove");
    expect(unlocked).toContain("first_clean_bpm");
    expect(unlocked).toContain("clean_bpm_60");
    expect(unlocked).not.toContain("clean_bpm_80");
  });

  it("unlocks level_0_complete only once every stage-0 exercise is mastered", () => {
    for (const id of STAGE_0_EXERCISE_IDS.slice(0, -1)) masterExercise(id);
    expect(checkAndUnlockAchievements(TZ)).not.toContain("level_0_complete");

    masterExercise(STAGE_0_EXERCISE_IDS[STAGE_0_EXERCISE_IDS.length - 1]);
    expect(checkAndUnlockAchievements(TZ)).toContain("level_0_complete");
  });

  it("unlocks practice_3_days from 3 distinct practiced dates, not 3 sessions on one day", () => {
    addCompletedSession("2026-01-01");
    addCompletedSession("2026-01-01");
    expect(checkAndUnlockAchievements(TZ)).not.toContain("practice_3_days");

    addCompletedSession("2026-01-02");
    addCompletedSession("2026-01-03");
    expect(checkAndUnlockAchievements(TZ)).toContain("practice_3_days");
  });

  it("unlocks streak_7 from 7 consecutive completed-session days", () => {
    for (let i = 1; i <= 7; i++) {
      addCompletedSession(`2026-01-${String(i).padStart(2, "0")}`);
    }
    const unlocked = checkAndUnlockAchievements(TZ);
    expect(unlocked).toContain("streak_7");
    expect(unlocked).not.toContain("streak_30");
  });

  it("is idempotent — never unlocks the same achievement twice", () => {
    addCompletedSession("2026-01-01");
    const first = checkAndUnlockAchievements(TZ);
    expect(first).toContain("first_practice");

    const second = checkAndUnlockAchievements(TZ);
    expect(second).not.toContain("first_practice");
    expect(second).toEqual([]);

    const unlockedRecords = getUnlockedAchievements().filter((a) => a.achievementId === "first_practice");
    expect(unlockedRecords).toHaveLength(1);
  });
});
