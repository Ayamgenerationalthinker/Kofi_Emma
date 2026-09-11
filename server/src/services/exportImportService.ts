import { z } from "zod";
import { prisma } from "../db.js";
import { Errors } from "../lib/errors.js";

// Section 32/104/106: export is a plain data dump; import is never trusted
// blindly — every record is Zod-validated and writes are idempotent on
// natural keys so re-importing the same file twice cannot duplicate rows.

export async function exportUserData(userId: string) {
  const [user, progress, sessions, attempts, bpmRecords, settings, reminderSettings, calendarSettings] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userExerciseProgress.findMany({ where: { userId } }),
      prisma.practiceSession.findMany({ where: { userId } }),
      prisma.exerciseAttempt.findMany({ where: { userId } }),
      prisma.bpmRecord.findMany({ where: { userId } }),
      prisma.userSettings.findUnique({ where: { userId } }),
      prisma.reminderSettings.findUnique({ where: { userId } }),
      prisma.calendarSettings.findUnique({ where: { userId } }),
    ]);

  if (!user) throw Errors.noUser();

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user,
    progress,
    sessions,
    attempts,
    bpmRecords,
    settings,
    reminderSettings,
    calendarSettings,
  };
}

const ImportSchema = z.object({
  schemaVersion: z.literal(1),
  user: z.object({
    id: z.string(),
    name: z.string(),
    experienceLevel: z.string(),
    timezone: z.string(),
  }),
  progress: z.array(
    z.object({
      exerciseId: z.string(),
      status: z.string(),
      cleanBpm: z.number().int().min(0),
      bestAccuracy: z.number().int().min(0).max(100),
      consecutiveCleanCount: z.number().int().min(0),
      attemptsCount: z.number().int().min(0),
    })
  ),
  attempts: z.array(
    z.object({
      clientAttemptId: z.string(),
      exerciseId: z.string(),
      targetBpm: z.number().int(),
      cleanBpm: z.number().int().min(0),
      maximumBpm: z.number().int().nullable().optional(),
      accuracy: z.number().int().min(0).max(100),
      durationMinutes: z.number().int().min(0),
      perceivedDifficulty: z.number().int().min(1).max(5).optional(),
      notes: z.string().nullable().optional(),
      result: z.string(),
      recommendation: z.string(),
    })
  ),
});

export async function importUserData(userId: string, payload: unknown) {
  const data = ImportSchema.parse(payload);

  await prisma.$transaction(async (tx) => {
    for (const p of data.progress) {
      await tx.userExerciseProgress.upsert({
        where: { userId_exerciseId: { userId, exerciseId: p.exerciseId } },
        create: { userId, ...p },
        update: { ...p },
      });
    }
    for (const a of data.attempts) {
      const exists = await tx.exerciseAttempt.findUnique({ where: { clientAttemptId: a.clientAttemptId } });
      if (!exists) {
        await tx.exerciseAttempt.create({ data: { userId, ...a } });
      }
    }
  });

  return { imported: { progress: data.progress.length, attempts: data.attempts.length } };
}
