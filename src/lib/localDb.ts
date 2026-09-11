// The entire persistence layer for the app. There is no backend: this
// module is a tiny embedded JSON "database" backed by the browser's
// LocalStorage API. Every read is synchronous (LocalStorage always is);
// every write updates an in-memory cache, persists it, and notifies
// subscribers via `useSyncExternalStore` (see `src/hooks/useLocalDb.ts`) so
// the whole UI reacts instantly without any fetch/loading ceremony.

import type { LessonPart } from "./types";

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
}

const STORAGE_KEY = "gospel-drum-coach:db:v1";
const SCHEMA_VERSION = 1;

function defaultSettings(): UserSettingsRecord {
  return { preferredDurationMinutes: 55, defaultBpmIncrease: 5, accuracyThreshold: 90, metronomeVolume: 80, theme: "system" };
}

function defaultReminderSettings(): ReminderSettingsRecord {
  return { notificationsOn: true, morningOn: true, eveningOn: true, morningTime: "07:00", eveningTime: "19:00" };
}

function defaultDb(): LocalDbShape {
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
  };
}

function isStorageAvailable(): boolean {
  try {
    const testKey = "__gdc_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/** True once we know whether writes actually persist (private browsing, quota, or SSR can all make this false). */
export const storageAvailable = typeof window !== "undefined" && isStorageAvailable();

function load(): LocalDbShape {
  if (!storageAvailable) return defaultDb();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultDb();
    const parsed = JSON.parse(raw) as Partial<LocalDbShape>;
    // Merge onto defaults so a schema addition in a future version doesn't crash on old data.
    return {
      ...defaultDb(),
      ...parsed,
      settings: { ...defaultSettings(), ...parsed.settings },
      reminderSettings: { ...defaultReminderSettings(), ...parsed.reminderSettings },
    };
  } catch {
    return defaultDb();
  }
}

let cache: LocalDbShape = load();
const listeners = new Set<() => void>();

// Mutations below write into `cache` in place (array pushes,
// Object.assign, etc.) rather than rebuilding the object graph — cheap and
// simple, but it means nested object/array references never change even
// when their contents do. So reactivity does NOT depend on reference
// equality of any slice of `cache`: a plain incrementing version number is
// the only thing `useSyncExternalStore` compares (see useLocalDb.ts),
// and every read goes through the service functions, which recompute
// fresh values straight from `cache` on every call.
let version = 0;

function persist(): void {
  if (storageAvailable) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // Quota exceeded or storage revoked mid-session — the in-memory cache
      // still works for the rest of this tab session, it just won't survive
      // a reload. There is nowhere else to put it for a backend-less app.
    }
  }
  version += 1;
  for (const listener of listeners) listener();
}

export function getDb(): LocalDbShape {
  return cache;
}

export function getVersion(): number {
  return version;
}

/** Mutate the store in place inside `fn`, then persist and notify subscribers. */
export function mutate(fn: (db: LocalDbShape) => void): void {
  fn(cache);
  persist();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetDb(): void {
  cache = defaultDb();
  persist();
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
