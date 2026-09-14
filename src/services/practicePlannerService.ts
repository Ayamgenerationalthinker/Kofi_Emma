import { EXERCISES, getPhase, type CurriculumExercise } from "../data/curriculum";
import { getDb, mutate, newId } from "../lib/localDb";
import { getNextAvailableExercise, ensureProgressInitialized } from "./curriculumService";
import { buildBpmLadder } from "./bpmProgressionService";
import { todayKey, yesterdayKey } from "../lib/dates";
import type { DailyLesson, LessonPart } from "../lib/types";

const APPLICATION_CATEGORIES = ["HIGH_LIFE", "PRAISE", "WORSHIP", "SIX_EIGHT", "TWELVE_EIGHT", "TRANSITION"];

function findAccessibleExerciseByCategories(categories: string[], excludeExerciseId: string): CurriculumExercise | null {
  const db = getDb();
  const candidates = EXERCISES.filter((e) => {
    const status = db.progress[e.id]?.status;
    return (
      (status === "AVAILABLE" || status === "IN_PROGRESS" || status === "REPEAT") &&
      categories.includes(e.category) &&
      e.id !== excludeExerciseId
    );
  }).sort((a, b) => (a.phaseNumber !== b.phaseNumber ? a.phaseNumber - b.phaseNumber : a.sortOrder - b.sortOrder));
  return candidates[0] ?? null;
}

/** Was yesterday's planned session left uncompleted? Drives the recovery-session branch. */
function wasYesterdayMissed(timezone: string): boolean {
  const yKey = yesterdayKey(timezone);
  const session = getDb().sessions.find((s) => s.date === yKey);
  if (!session) return false;
  return session.status !== "COMPLETED";
}

/** Pure read: returns today's lesson if it has already been generated, without ever mutating the store. Safe to call from a `useLocalDb` selector. */
export function readTodayLesson(timezone: string): DailyLesson | null {
  const dateKey = todayKey(timezone);
  const existing = getDb().dailyLessons[dateKey];
  if (!existing) return null;
  const phase = getPhase(existing.phaseId);
  return {
    date: dateKey,
    totalMinutes: existing.totalMinutes,
    phaseTitle: phase?.title ?? "",
    wasRecoverySession: existing.wasRecoverySession,
    lessonParts: existing.lessonParts,
    coachMessage: buildCoachMessage(existing.wasRecoverySession),
  };
}

/** Side-effecting: generates and persists today's lesson if it doesn't exist yet. Call from a useEffect, never from a selector. */
export function generateTodayLesson(timezone: string): DailyLesson {
  ensureProgressInitialized();
  const dateKey = todayKey(timezone);

  const existing = getDb().dailyLessons[dateKey];
  if (existing) {
    const phase = getPhase(existing.phaseId);
    return {
      date: dateKey,
      totalMinutes: existing.totalMinutes,
      phaseTitle: phase?.title ?? "",
      wasRecoverySession: existing.wasRecoverySession,
      lessonParts: existing.lessonParts,
      coachMessage: buildCoachMessage(existing.wasRecoverySession),
    };
  }

  const current = getNextAvailableExercise();
  if (!current) {
    throw new Error("No available exercise found. The curriculum failed to initialize.");
  }
  const currentExercise = current.exercise;
  const isRecovery = wasYesterdayMissed(timezone);

  const part1Bpm = Math.max(currentExercise.minimumBpm, Math.round(currentExercise.targetBpm * 0.75));
  const part1: LessonPart = {
    part: 1,
    title: "Rudiment Isolation & Technique",
    duration: 10,
    exerciseId: currentExercise.id,
    exerciseName: currentExercise.name,
    instructions: `${isRecovery ? "Recovery review: " : ""}Play the sticking slowly and cleanly with a relaxed grip. Let the fingers control the rebound; keep the forearm loose. Every stroke should be the same height. ${currentExercise.techniqueNotes}`,
    sticking: currentExercise.stickingPattern,
    targetBpm: part1Bpm,
    category: "TECHNIQUE",
  };

  const independenceExercise = findAccessibleExerciseByCategories(["INDEPENDENCE"], currentExercise.id) ?? currentExercise;
  const part2: LessonPart = {
    part: 2,
    title: "Gospel Independence Matrix (Kofi Emma-inspired)",
    duration: 15,
    exerciseId: independenceExercise.id,
    exerciseName: independenceExercise.name,
    instructions: `Build the pattern one limb at a time: hands alone, then add the kick, then add the hi-hat foot. Only combine limbs once each layer is steady on its own. ${independenceExercise.techniqueNotes}`,
    sticking: independenceExercise.stickingPattern,
    targetBpm: Math.max(independenceExercise.minimumBpm, Math.round(independenceExercise.targetBpm * 0.85)),
    category: "INDEPENDENCE",
  };

  const applicationExercise = findAccessibleExerciseByCategories(APPLICATION_CATEGORIES, currentExercise.id) ?? currentExercise;
  const part3: LessonPart = {
    part: 3,
    title: "Gospel Song Application",
    duration: 20,
    exerciseId: applicationExercise.id,
    exerciseName: applicationExercise.name,
    instructions: `Apply this vocabulary in a musical context: groove for 4 bars, insert the fill for 1 bar, return to the groove for 1 bar. Focus on making the transition seamless. ${applicationExercise.description}`,
    sticking: applicationExercise.stickingPattern,
    targetBpm: applicationExercise.targetBpm,
    category: applicationExercise.category,
  };

  const recentAttempts = getDb()
    .attempts.filter((a) => a.exerciseId === currentExercise.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  const recentAccuracyDropped = recentAttempts.length >= 2 && recentAttempts[0].accuracy < recentAttempts[1].accuracy - 5;
  const baseCleanBpm = current.progress.cleanBpm > 0 ? current.progress.cleanBpm : currentExercise.minimumBpm;
  const ladder = buildBpmLadder({ cleanBpm: baseCleanBpm, recentAccuracyDropped, maximumBpm: currentExercise.maximumBpm });
  const part4: LessonPart = {
    part: 4,
    title: "Speed & Endurance Challenge",
    duration: 10,
    exerciseId: currentExercise.id,
    exerciseName: currentExercise.name,
    instructions: `Climb the tempo ladder: ${ladder.join(" -> ")} BPM. Spend 30-60 seconds per step. Drop back one step immediately if accuracy breaks down.`,
    sticking: currentExercise.stickingPattern,
    targetBpm: ladder[ladder.length - 1],
    category: "SPEED",
  };

  const lessonParts = [part1, part2, part3, part4];
  const dailyLessonId = newId();
  const nowIso = new Date().toISOString();

  mutate((db) => {
    db.dailyLessons[dateKey] = {
      id: dailyLessonId,
      date: dateKey,
      totalMinutes: 55,
      phaseId: currentExercise.phaseId,
      wasRecoverySession: isRecovery,
      lessonParts,
      createdAt: nowIso,
    };
    db.sessions.push({
      id: newId(),
      date: dateKey,
      status: "PLANNED",
      totalMinutes: 55,
      startedAt: null,
      completedAt: null,
      dailyLessonId,
    });
  });

  const phase = getPhase(currentExercise.phaseId);

  return {
    date: dateKey,
    totalMinutes: 55,
    phaseTitle: phase?.title ?? "",
    wasRecoverySession: isRecovery,
    lessonParts,
    coachMessage: buildCoachMessage(isRecovery),
  };
}

function buildCoachMessage(isRecovery: boolean): string {
  if (isRecovery) {
    return "Yesterday's session was missed. Today's plan includes a short recovery review before moving forward — the curriculum stays exactly where you left it.";
  }
  return "Today's lesson is ready. Clean first. Fast later.";
}

/** Starts (or resumes) today's already-planned session, returning its id. */
export function startTodaySession(timezone: string): string {
  generateTodayLesson(timezone); // ensures today's session row exists
  const dateKey = todayKey(timezone);
  const session = getDb().sessions.find((s) => s.date === dateKey);
  if (!session) throw new Error("Today's practice session could not be found.");

  mutate((db) => {
    const s = db.sessions.find((s) => s.id === session.id)!;
    s.status = "IN_PROGRESS";
    s.startedAt = s.startedAt ?? new Date().toISOString();
  });

  return session.id;
}

export function completeSession(sessionId: string, totalMinutes?: number): void {
  mutate((db) => {
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.status = "COMPLETED";
    session.completedAt = new Date().toISOString();
    if (totalMinutes) session.totalMinutes = totalMinutes;
  });
}
