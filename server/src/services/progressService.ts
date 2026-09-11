import { prisma } from "../db.js";
import { PracticeSessionStatus, ExerciseProgressStatus } from "../domain/types.js";
import { localDateKey, todayKey, addDaysToDateKey } from "../lib/dates.js";

// Section 27/28: streaks and charts are always derived from real completed
// sessions and attempts — never fabricated, and the caller distinguishes an
// empty state ("no data yet") from a zero value.

export async function getStreak(userId: string, timezone: string) {
  const completedSessions = await prisma.practiceSession.findMany({
    where: { userId, status: PracticeSessionStatus.COMPLETED },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  const dateKeys = new Set(completedSessions.map((s) => localDateKey(s.date, timezone)));
  const sortedKeys = Array.from(dateKeys).sort().reverse();

  let currentStreak = 0;
  let cursor = todayKey(timezone);
  if (!dateKeys.has(cursor)) {
    cursor = addDaysToDateKey(cursor, -1); // allow "today not yet practiced" to not break the streak
  }
  while (dateKeys.has(cursor)) {
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

export async function getProgressSummary(userId: string, timezone: string) {
  const [progressRows, sessions, attempts, streak] = await Promise.all([
    prisma.userExerciseProgress.findMany({ where: { userId }, include: { exercise: true } }),
    prisma.practiceSession.findMany({ where: { userId, status: PracticeSessionStatus.COMPLETED } }),
    prisma.exerciseAttempt.findMany({ where: { userId } }),
    getStreak(userId, timezone),
  ]);

  const masteredExercises = progressRows.filter((p) => p.status === ExerciseProgressStatus.MASTERED).length;
  const lockedExercises = progressRows.filter((p) => p.status === ExerciseProgressStatus.LOCKED).length;
  const totalMinutesPracticed = sessions.reduce((sum, s) => sum + s.totalMinutes, 0);
  const bestBpm = progressRows.reduce((max, p) => Math.max(max, p.cleanBpm), 0);
  const avgAccuracy =
    attempts.length === 0 ? 0 : Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length);

  return {
    masteredExercises,
    lockedExercises,
    totalExercises: progressRows.length,
    totalMinutesPracticed,
    totalSessionsCompleted: sessions.length,
    bestBpm,
    averageAccuracy: avgAccuracy,
    streak,
    hasAnyData: attempts.length > 0 || sessions.length > 0,
  };
}

export interface RangeFilter {
  days: number | "all";
}

function rangeStartDate(days: number | "all"): Date | null {
  if (days === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function getBpmHistory(userId: string, range: RangeFilter) {
  const start = rangeStartDate(range.days);
  const records = await prisma.bpmRecord.findMany({
    where: { userId, ...(start ? { recordedAt: { gte: start } } : {}) },
    orderBy: { recordedAt: "asc" },
    include: { exercise: { select: { name: true } } },
  });
  return records.map((r) => ({
    date: r.recordedAt.toISOString(),
    cleanBpm: r.cleanBpm,
    accuracy: r.accuracy,
    exerciseName: r.exercise.name,
  }));
}

export async function getAccuracyHistory(userId: string, range: RangeFilter) {
  const start = rangeStartDate(range.days);
  const attempts = await prisma.exerciseAttempt.findMany({
    where: { userId, ...(start ? { createdAt: { gte: start } } : {}) },
    orderBy: { createdAt: "asc" },
    include: { exercise: { select: { name: true } } },
  });
  return attempts.map((a) => ({
    date: a.createdAt.toISOString(),
    accuracy: a.accuracy,
    cleanBpm: a.cleanBpm,
    result: a.result,
    exerciseName: a.exercise.name,
  }));
}
