import { z } from "zod";
import { getDb, mutate, type LocalDbShape } from "../lib/localDb";
import { recomputeUnlocks } from "./curriculumService";
import { downloadTextFile } from "./calendarService";

// Export is a plain data dump of the entire LocalStorage store; import is
// never trusted blindly — every record is Zod-validated before it touches
// the live store, and writes are idempotent on natural keys (clientAttemptId
// for attempts, exerciseId for progress) so re-importing the same file
// twice cannot duplicate rows.

export function exportData(): LocalDbShape {
  return getDb();
}

export function downloadExport(): void {
  const data = exportData();
  downloadTextFile("abele-drums-coach-progress.json", JSON.stringify(data, null, 2), "application/json");
}

const ImportSchema = z.object({
  schemaVersion: z.number(),
  user: z
    .object({
      id: z.string(),
      name: z.string(),
      experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
      timezone: z.string(),
      onboardedAt: z.string().nullable(),
      createdAt: z.string(),
    })
    .nullable(),
  progress: z.record(
    z.object({
      exerciseId: z.string(),
      status: z.enum(["LOCKED", "AVAILABLE", "IN_PROGRESS", "REPEAT", "MASTERED"]),
      cleanBpm: z.number().int().min(0),
      bestAccuracy: z.number().int().min(0).max(100),
      consecutiveCleanCount: z.number().int().min(0),
      attemptsCount: z.number().int().min(0),
      masteredAt: z.string().nullable(),
      updatedAt: z.string(),
    })
  ),
  attempts: z.array(
    z.object({
      id: z.string(),
      clientAttemptId: z.string(),
      exerciseId: z.string(),
      sessionId: z.string().nullable(),
      targetBpm: z.number().int(),
      cleanBpm: z.number().int().min(0),
      maximumBpm: z.number().int().nullable(),
      accuracy: z.number().int().min(0).max(100),
      durationMinutes: z.number().int().min(0),
      perceivedDifficulty: z.number().int().min(1).max(5),
      notes: z.string().nullable(),
      result: z.enum(["FAILED", "REPEAT", "PASSED", "MASTERED"]),
      recommendation: z.string(),
      createdAt: z.string(),
    })
  ),
  sessions: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "MISSED"]),
      totalMinutes: z.number().int(),
      startedAt: z.string().nullable(),
      completedAt: z.string().nullable(),
      dailyLessonId: z.string().nullable(),
    })
  ),
  bpmRecords: z.array(
    z.object({
      id: z.string(),
      exerciseId: z.string(),
      cleanBpm: z.number().int(),
      accuracy: z.number().int(),
      recordedAt: z.string(),
    })
  ),
  settings: z
    .object({
      preferredDurationMinutes: z.number().int(),
      defaultBpmIncrease: z.number().int(),
      accuracyThreshold: z.number().int(),
      metronomeVolume: z.number().int(),
      theme: z.enum(["light", "dark", "system"]),
      accountPromptDismissedAt: z.string().nullable().optional().default(null),
    })
    .optional(),
  reminderSettings: z
    .object({
      notificationsOn: z.boolean(),
      morningOn: z.boolean(),
      eveningOn: z.boolean(),
      morningTime: z.string(),
      eveningTime: z.string(),
    })
    .optional(),
});

export interface ImportSummary {
  progress: number;
  attempts: number;
  sessions: number;
}

export function importData(payload: unknown): ImportSummary {
  const data = ImportSchema.parse(payload);
  let progressCount = 0;
  let attemptCount = 0;
  let sessionCount = 0;

  mutate((db) => {
    if (data.user) db.user = data.user;
    if (data.settings) db.settings = data.settings;
    if (data.reminderSettings) db.reminderSettings = data.reminderSettings;

    for (const [exerciseId, p] of Object.entries(data.progress)) {
      db.progress[exerciseId] = p;
      progressCount += 1;
    }

    const existingAttemptIds = new Set(db.attempts.map((a) => a.clientAttemptId));
    for (const a of data.attempts) {
      if (!existingAttemptIds.has(a.clientAttemptId)) {
        db.attempts.push(a);
        attemptCount += 1;
      }
    }

    const existingSessionIds = new Set(db.sessions.map((s) => s.id));
    for (const s of data.sessions) {
      if (!existingSessionIds.has(s.id)) {
        db.sessions.push(s);
        sessionCount += 1;
      }
    }

    const existingBpmIds = new Set(db.bpmRecords.map((r) => r.id));
    for (const r of data.bpmRecords) {
      if (!existingBpmIds.has(r.id)) db.bpmRecords.push(r);
    }
  });

  recomputeUnlocks();
  return { progress: progressCount, attempts: attemptCount, sessions: sessionCount };
}
