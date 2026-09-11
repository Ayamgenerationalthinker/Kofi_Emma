import { prisma } from "../db.js";
import { ExerciseProgressStatus, PracticeSessionStatus } from "../domain/types.js";
import { getNextAvailableExercise, ensureProgressInitialized } from "./curriculumService.js";
import { buildBpmLadder } from "./bpmProgressionService.js";
import { localDateKey, localDateKeyToUtcMidnight, todayKey, yesterdayKey } from "../lib/dates.js";

const APPLICATION_CATEGORIES = ["HIGH_LIFE", "PRAISE", "WORSHIP", "SIX_EIGHT", "TWELVE_EIGHT", "TRANSITION"];

export interface LessonPart {
  part: 1 | 2 | 3 | 4;
  title: string;
  duration: number;
  exerciseId: string;
  exerciseName: string;
  instructions: string;
  sticking: string;
  targetBpm: number;
  category: string;
}

export interface DailyLessonDto {
  date: string;
  totalMinutes: number;
  phaseTitle: string;
  wasRecoverySession: boolean;
  lessonParts: LessonPart[];
  coachMessage: string;
}

async function findAccessibleExerciseByCategories(
  userId: string,
  categories: string[],
  excludeExerciseId: string
) {
  const rows = await prisma.userExerciseProgress.findMany({
    where: {
      userId,
      status: { in: [ExerciseProgressStatus.AVAILABLE, ExerciseProgressStatus.IN_PROGRESS, ExerciseProgressStatus.REPEAT] },
      exercise: { category: { in: categories } },
      exerciseId: { not: excludeExerciseId },
    },
    include: { exercise: { include: { phase: true } } },
    orderBy: [{ exercise: { phase: { sortOrder: "asc" } } }, { exercise: { sortOrder: "asc" } }],
  });
  return rows[0]?.exercise ?? null;
}

/** Was yesterday's planned session left uncompleted? Drives the recovery-session branch (section 53). */
async function wasYesterdayMissed(userId: string, timezone: string): Promise<boolean> {
  const yKey = yesterdayKey(timezone);
  const session = await prisma.practiceSession.findFirst({
    where: { userId, date: localDateKeyToUtcMidnight(yKey) },
  });
  if (!session) return false;
  return session.status !== PracticeSessionStatus.COMPLETED;
}

export async function generateTodayLesson(userId: string, timezone: string): Promise<DailyLessonDto> {
  await ensureProgressInitialized(userId);

  const dateKey = todayKey(timezone);
  const existing = await prisma.dailyLesson.findUnique({
    where: { userId_date: { userId, date: localDateKeyToUtcMidnight(dateKey) } },
  });

  if (existing) {
    const phase = await prisma.curriculumPhase.findUnique({ where: { id: existing.phaseId } });
    return {
      date: dateKey,
      totalMinutes: existing.totalMinutes,
      phaseTitle: phase?.title ?? "",
      wasRecoverySession: existing.wasRecoverySession,
      lessonParts: JSON.parse(existing.lessonPartsJson) as LessonPart[],
      coachMessage: buildCoachMessage(existing.wasRecoverySession),
    };
  }

  const current = await getNextAvailableExercise(userId);
  if (!current) {
    throw new Error("No available exercise found. The curriculum may not be seeded.");
  }
  const currentExercise = current.exercise;
  const isRecovery = await wasYesterdayMissed(userId, timezone);

  // Part 1: Rudiment Isolation & Technique — the active drill in isolation, at a controlled tempo.
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

  // Part 2: Kofi Emma Independence Matrix — a coordination-focused exercise near the current one.
  const independenceExercise =
    (await findAccessibleExerciseByCategories(userId, ["INDEPENDENCE"], currentExercise.id)) ?? currentExercise;
  const part2: LessonPart = {
    part: 2,
    title: "Kofi Emma Independence Matrix",
    duration: 15,
    exerciseId: independenceExercise.id,
    exerciseName: independenceExercise.name,
    instructions: `Build the pattern one limb at a time: hands alone, then add the kick, then add the hi-hat foot. Only combine limbs once each layer is steady on its own. ${independenceExercise.techniqueNotes}`,
    sticking: independenceExercise.stickingPattern,
    targetBpm: Math.max(independenceExercise.minimumBpm, Math.round(independenceExercise.targetBpm * 0.85)),
    category: "INDEPENDENCE",
  };

  // Part 3: Gospel Song Application — orchestrate the vocabulary musically.
  const applicationExercise =
    (await findAccessibleExerciseByCategories(userId, APPLICATION_CATEGORIES, currentExercise.id)) ?? currentExercise;
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

  // Part 4: Speed & Endurance — a BPM ladder built from the drummer's actual clean tempo.
  const recentAttempts = await prisma.exerciseAttempt.findMany({
    where: { userId, exerciseId: currentExercise.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  const recentAccuracyDropped = recentAttempts.length >= 2 && recentAttempts[0].accuracy < recentAttempts[1].accuracy - 5;
  const baseCleanBpm = current.cleanBpm > 0 ? current.cleanBpm : currentExercise.minimumBpm;
  const ladder = buildBpmLadder({
    cleanBpm: baseCleanBpm,
    recentAccuracyDropped,
    maximumBpm: currentExercise.maximumBpm,
  });
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

  await prisma.dailyLesson.create({
    data: {
      userId,
      date: localDateKeyToUtcMidnight(dateKey),
      totalMinutes: 55,
      phaseId: currentExercise.phaseId,
      wasRecoverySession: isRecovery,
      lessonPartsJson: JSON.stringify(lessonParts),
    },
  });

  await prisma.practiceSession.create({
    data: {
      userId,
      date: localDateKeyToUtcMidnight(dateKey),
      status: PracticeSessionStatus.PLANNED,
      totalMinutes: 55,
      dailyLessonId: (await prisma.dailyLesson.findUnique({
        where: { userId_date: { userId, date: localDateKeyToUtcMidnight(dateKey) } },
      }))!.id,
    },
  });

  const phase = await prisma.curriculumPhase.findUnique({ where: { id: currentExercise.phaseId } });

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

export { localDateKey };
