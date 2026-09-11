// Section 5: versioned LocalStorage with migration support. If stored data
// is missing fields, wrongly-typed, or from an older schema version, this
// is the one place that reconciles it — never leave that logic scattered
// across the app, and never let a malformed field blank the whole store.

import type {
  LocalDbShape,
  UserSettingsRecord,
  ReminderSettingsRecord,
  MetronomePreferencesRecord,
  UserRecord,
  ProgressRecord,
  AttemptRecord,
  SessionRecord,
  DailyLessonRecord,
  BpmRecordEntry,
  VideoStudyRecord,
  OnboardingProfileRecord,
} from "./types";
import { LEGACY_STORAGE_KEYS } from "./keys";

export const SCHEMA_VERSION = 3;

export function defaultSettings(): UserSettingsRecord {
  return {
    preferredDurationMinutes: 55,
    defaultBpmIncrease: 5,
    accuracyThreshold: 90,
    metronomeVolume: 80,
    theme: "system",
    accountPromptDismissedAt: null,
  };
}

export function defaultOnboardingProfile(): OnboardingProfileRecord {
  return { goals: [], experienceDescription: null };
}

export function defaultReminderSettings(): ReminderSettingsRecord {
  return { notificationsOn: true, morningOn: true, eveningOn: true, morningTime: "07:00", eveningTime: "19:00" };
}

export function defaultMetronomePreferences(): MetronomePreferencesRecord {
  return { bpm: 100, timeSignature: "4/4", subdivision: "16th", grouping: null, accentOn: true, volume: 80 };
}

export function defaultDb(): LocalDbShape {
  return {
    schemaVersion: SCHEMA_VERSION,
    user: null,
    progress: {},
    attempts: [],
    sessions: [],
    dailyLessons: {},
    bpmRecords: [],
    settings: defaultSettings(),
    reminderSettings: defaultReminderSettings(),
    metronome: defaultMetronomePreferences(),
    videoStudy: {},
    onboardingProfile: defaultOnboardingProfile(),
  };
}

function asArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function asRecord<T>(value: unknown, fallback: Record<string, T>): Record<string, T> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, T>) : fallback;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/**
 * Reconciles a raw parsed value (any shape — a fresh v2 document, an older
 * v1 document, or a partially corrupted one) up to the current schema.
 * Every field is validated and defaulted independently, so a single bad
 * field (e.g. `attempts` saved as a string by some future bug) can never
 * blank unrelated fields like `progress` or `user`.
 */
export function migrate(raw: unknown): LocalDbShape {
  const data = asObject(raw);
  const defaults = defaultDb();

  return {
    schemaVersion: SCHEMA_VERSION,
    user: (data.user as UserRecord | null | undefined) ?? null,
    progress: asRecord<ProgressRecord>(data.progress, defaults.progress),
    attempts: asArray<AttemptRecord>(data.attempts, defaults.attempts),
    sessions: asArray<SessionRecord>(data.sessions, defaults.sessions),
    dailyLessons: asRecord<DailyLessonRecord>(data.dailyLessons, defaults.dailyLessons),
    bpmRecords: asArray<BpmRecordEntry>(data.bpmRecords, defaults.bpmRecords),
    settings: { ...defaults.settings, ...asObject(data.settings) },
    reminderSettings: { ...defaults.reminderSettings, ...asObject(data.reminderSettings) },
    // Added in schema v2 — a v1 document simply won't have these, so they
    // fall through to defaults with no explicit transform needed.
    metronome: { ...defaults.metronome, ...asObject(data.metronome) },
    videoStudy: asRecord<VideoStudyRecord>(data.videoStudy, defaults.videoStudy),
    // Added in schema v3 — same story.
    onboardingProfile: { ...defaults.onboardingProfile, ...asObject(data.onboardingProfile) } as OnboardingProfileRecord,
  };
}

/** Checks pre-rebrand storage keys once, so a returning user's progress carries forward instead of appearing to vanish. */
export function readLegacyData(): unknown | null {
  if (typeof window === "undefined") return null;
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      return JSON.parse(raw);
    } catch {
      continue;
    }
  }
  return null;
}
