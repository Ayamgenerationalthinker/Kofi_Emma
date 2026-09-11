// The typed application state persisted to LocalStorage (section 4). No
// `any` — every domain object that survives a reload has a real shape.

import type { LessonPart } from "../types";
import type { TimeSignature, Subdivision } from "../../audio/meter";

export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type ProgressStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "REPEAT" | "MASTERED";
export type SessionStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
export type AttemptResultStatus = "FAILED" | "REPEAT" | "PASSED" | "MASTERED";

export interface UserRecord {
  id: string;
  name: string;
  experienceLevel: ExperienceLevel;
  timezone: string;
  onboardedAt: string | null;
  createdAt: string;
}

export interface ProgressRecord {
  exerciseId: string;
  status: ProgressStatus;
  cleanBpm: number;
  bestAccuracy: number;
  consecutiveCleanCount: number;
  attemptsCount: number;
  masteredAt: string | null;
  updatedAt: string;
}

export interface AttemptRecord {
  id: string;
  clientAttemptId: string;
  exerciseId: string;
  sessionId: string | null;
  targetBpm: number;
  cleanBpm: number;
  maximumBpm: number | null;
  accuracy: number;
  durationMinutes: number;
  perceivedDifficulty: number;
  notes: string | null;
  result: AttemptResultStatus;
  recommendation: string;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  date: string; // local calendar date key, YYYY-MM-DD
  status: SessionStatus;
  totalMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
  dailyLessonId: string | null;
}

export interface DailyLessonRecord {
  id: string;
  date: string;
  totalMinutes: number;
  phaseId: string;
  wasRecoverySession: boolean;
  lessonParts: LessonPart[];
  createdAt: string;
}

export interface BpmRecordEntry {
  id: string;
  exerciseId: string;
  cleanBpm: number;
  accuracy: number;
  recordedAt: string;
}

export interface ReminderSettingsRecord {
  notificationsOn: boolean;
  morningOn: boolean;
  eveningOn: boolean;
  morningTime: string;
  eveningTime: string;
}

export interface UserSettingsRecord {
  preferredDurationMinutes: number;
  defaultBpmIncrease: number;
  accuracyThreshold: number;
  metronomeVolume: number;
  theme: "light" | "dark" | "system";
}

/** The standalone metronome's last-used settings, restored on next visit (section 4). */
export interface MetronomePreferencesRecord {
  bpm: number;
  timeSignature: TimeSignature;
  subdivision: Subdivision;
  grouping: number[] | null;
  accentOn: boolean;
  volume: number;
}

/**
 * Per-user Shed Session state for one video — watched/favorite status, the
 * "what did you notice" checklist, and free-text notes. Keyed by
 * `youtubeId` in `LocalDbShape.videoStudy`. The video's own title,
 * category, etc. live in the static `src/data/kofiEmmaVideos.ts` dataset
 * and are never duplicated here.
 */
export interface VideoStudyRecord {
  youtubeId: string;
  watched: boolean;
  favorite: boolean;
  notedAspects: string[];
  notes: string;
  watchedAt: string | null;
  updatedAt: string;
}

export interface LocalDbShape {
  schemaVersion: number;
  user: UserRecord | null;
  progress: Record<string, ProgressRecord>;
  attempts: AttemptRecord[];
  sessions: SessionRecord[];
  dailyLessons: Record<string, DailyLessonRecord>;
  bpmRecords: BpmRecordEntry[];
  settings: UserSettingsRecord;
  reminderSettings: ReminderSettingsRecord;
  metronome: MetronomePreferencesRecord;
  videoStudy: Record<string, VideoStudyRecord>;
}
