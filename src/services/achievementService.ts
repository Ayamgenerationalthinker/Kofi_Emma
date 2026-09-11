// Achievement checking and unlock persistence — the one place achievement
// conditions are evaluated, so logic never gets scattered across
// components. Every condition is derived from real stored practice data
// (db.sessions/progress/attempts), never from "a screen was opened."

import { getDb, mutate, type AchievementUnlockRecord } from "../lib/localDb";
import { ACHIEVEMENTS, type AchievementId } from "../data/achievements";
import { getStreak } from "./progressService";
import { getCurriculumState } from "./curriculumService";

const LEVEL_ACHIEVEMENT_BY_NUMBER: Record<number, AchievementId> = {
  0: "level_0_complete",
  1: "level_1_complete",
  2: "level_2_complete",
  3: "level_3_complete",
};

const CLEAN_BPM_THRESHOLDS: { id: AchievementId; bpm: number }[] = [
  { id: "clean_bpm_60", bpm: 60 },
  { id: "clean_bpm_80", bpm: 80 },
  { id: "clean_bpm_100", bpm: 100 },
  { id: "clean_bpm_120", bpm: 120 },
  { id: "clean_bpm_140", bpm: 140 },
];

export function isAchievementUnlocked(id: AchievementId): boolean {
  return Boolean(getDb().achievements[id]);
}

/** Returns every unlocked achievement, newest first. */
export function getUnlockedAchievements(): AchievementUnlockRecord[] {
  return Object.values(getDb().achievements).sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt));
}

/**
 * Idempotent: does nothing if `id` is already unlocked. Returns true only
 * when this call actually unlocked it (i.e. it's newly earned), which is
 * what callers use to decide whether to show "just unlocked" feedback.
 */
function unlock(id: AchievementId): boolean {
  if (isAchievementUnlocked(id)) return false;
  let didUnlock = false;
  mutate((db) => {
    if (db.achievements[id]) return; // re-check inside the mutation for safety
    db.achievements[id] = { achievementId: id, unlockedAt: new Date().toISOString() };
    didUnlock = true;
  });
  return didUnlock;
}

/**
 * Evaluates every achievement condition against the current real state and
 * unlocks whichever are newly satisfied. Safe (and cheap) to call after any
 * meaningful practice event — completing a session, mastering an exercise
 * — since already-unlocked achievements are skipped instantly. Must NOT be
 * called merely on screen open with no real activity behind it; callers
 * are the practice-completion flow, not page-view effects.
 *
 * Returns the achievement ids newly unlocked by this specific call.
 */
export function checkAndUnlockAchievements(timezone: string): AchievementId[] {
  const db = getDb();
  const newlyUnlocked: AchievementId[] = [];

  function evaluate(id: AchievementId, conditionMet: boolean) {
    if (conditionMet && unlock(id)) newlyUnlocked.push(id);
  }

  const completedSessions = db.sessions.filter((s) => s.status === "COMPLETED");
  const progressValues = Object.values(db.progress);
  const bestCleanBpm = progressValues.reduce((max, p) => Math.max(max, p.cleanBpm), 0);
  const masteredCount = progressValues.filter((p) => p.status === "MASTERED").length;
  const uniquePracticeDays = new Set(completedSessions.map((s) => s.date)).size;
  // Use the historical peak (longestStreak), not the current live streak —
  // an achievement earned by once reaching 7/30 days must stay earned even
  // after the streak later resets, and checking the peak makes the unlock
  // robust to exactly when this function happens to run.
  const { longestStreak } = getStreak(timezone);
  const curriculum = getCurriculumState();

  evaluate("first_practice", completedSessions.length > 0);
  evaluate("first_groove", masteredCount > 0);
  evaluate("first_clean_bpm", bestCleanBpm > 0);
  evaluate("practice_3_days", uniquePracticeDays >= 3);
  evaluate("streak_7", longestStreak >= 7);
  evaluate("streak_30", longestStreak >= 30);

  for (const [numberStr, achievementId] of Object.entries(LEVEL_ACHIEVEMENT_BY_NUMBER)) {
    const phase = curriculum.phases.find((p) => p.number === Number(numberStr));
    evaluate(achievementId, phase?.status === "COMPLETE");
  }

  for (const { id, bpm } of CLEAN_BPM_THRESHOLDS) {
    evaluate(id, bestCleanBpm >= bpm);
  }

  return newlyUnlocked;
}

export { ACHIEVEMENTS };
