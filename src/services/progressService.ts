import { getDb } from "../lib/localDb";
import { EXERCISES } from "../data/curriculum";
import { localDateKey, todayKey, addDaysToDateKey } from "../lib/dates";
import type { ProgressSummary } from "../lib/types";

// Streaks and charts are always derived from real completed sessions and
// attempts — never fabricated, and callers distinguish an empty state ("no
// data yet") from a genuine zero value.

export function getStreak(timezone: string) {
  const db = getDb();
  const completedDateKeys = new Set(db.sessions.filter((s) => s.status === "COMPLETED").map((s) => s.date));
  const sortedKeys = Array.from(completedDateKeys).sort().reverse();

  let currentStreak = 0;
  let cursor = todayKey(timezone);
  if (!completedDateKeys.has(cursor)) {
    cursor = addDaysToDateKey(cursor, -1); // allow "today not yet practiced" to not break the streak
  }
  while (completedDateKeys.has(cursor)) {
    currentStreak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }

  let longestStreak = 0;
  let running = 0;
  let prevKey: string | null = null;
  for (const key of [...sortedKeys].reverse()) {
    if (prevKey && addDaysToDateKey(prevKey, 1) === key) {
      running += 1;
    } else {
      running = 1;
    }
    longestStreak = Math.max(longestStreak, running);
    prevKey = key;
  }

  const weekAgo = addDaysToDateKey(todayKey(timezone), -6);
  const thisWeekSessions = sortedKeys.filter((k) => k >= weekAgo).length;

  return { currentStreak, longestStreak, thisWeekSessions };
}

export function getProgressSummary(timezone: string): ProgressSummary {
  const db = getDb();
  const progressRows = Object.values(db.progress);
  const completedSessions = db.sessions.filter((s) => s.status === "COMPLETED");

  const masteredExercises = progressRows.filter((p) => p.status === "MASTERED").length;
  const lockedExercises = progressRows.filter((p) => p.status === "LOCKED").length;
  const totalMinutesPracticed = completedSessions.reduce((sum, s) => sum + s.totalMinutes, 0);
  const bestBpm = progressRows.reduce((max, p) => Math.max(max, p.cleanBpm), 0);
  const avgAccuracy =
    db.attempts.length === 0 ? 0 : Math.round(db.attempts.reduce((sum, a) => sum + a.accuracy, 0) / db.attempts.length);

  return {
    masteredExercises,
    lockedExercises,
    totalExercises: EXERCISES.length,
    totalMinutesPracticed,
    totalSessionsCompleted: completedSessions.length,
    bestBpm,
    averageAccuracy: avgAccuracy,
    streak: getStreak(timezone),
    hasAnyData: db.attempts.length > 0 || completedSessions.length > 0,
  };
}

export interface RangeFilter {
  days: number | "all";
}

function rangeStartIso(days: number | "all"): string | null {
  if (days === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function getBpmHistory(range: RangeFilter) {
  const start = rangeStartIso(range.days);
  const db = getDb();
  const exerciseNameById = new Map(EXERCISES.map((e) => [e.id, e.name]));

  return db.bpmRecords
    .filter((r) => !start || r.recordedAt >= start)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .map((r) => ({
      date: r.recordedAt,
      cleanBpm: r.cleanBpm,
      accuracy: r.accuracy,
      exerciseName: exerciseNameById.get(r.exerciseId) ?? r.exerciseId,
    }));
}

export function getAccuracyHistory(range: RangeFilter) {
  const start = rangeStartIso(range.days);
  const db = getDb();
  const exerciseNameById = new Map(EXERCISES.map((e) => [e.id, e.name]));

  return db.attempts
    .filter((a) => !start || a.createdAt >= start)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((a) => ({
      date: a.createdAt,
      accuracy: a.accuracy,
      cleanBpm: a.cleanBpm,
      result: a.result,
      exerciseName: exerciseNameById.get(a.exerciseId) ?? a.exerciseId,
    }));
}

export { localDateKey };
