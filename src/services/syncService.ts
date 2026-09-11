// The one place that actually talks to Supabase for progress data. The UI
// never calls the Supabase client directly — it goes through this service
// (or authService.ts for auth), which itself degrades to a no-op whenever
// `isSupabaseConfigured` is false, so the rest of the app never needs to
// know whether cloud sync exists on a given deployment.

import { supabase, isSupabaseConfigured } from "../lib/supabase/client";
import {
  getDb,
  mutate,
  type ProgressRecord,
  type AttemptRecord,
  type VideoStudyRecord,
  type UserRecord,
  type AchievementUnlockRecord,
} from "../lib/localDb";
import { mergeProgressMaps, mergeAttempts, mergeVideoStudyMaps, mergeAchievementMaps } from "./syncMergeRules";
import { AppError } from "../lib/errors";
import { localDateKey } from "../lib/dates";

export type SyncStatus = "disabled" | "idle" | "syncing" | "offline" | "error" | "synced";

let currentStatus: SyncStatus = isSupabaseConfigured ? "idle" : "disabled";
const statusListeners = new Set<(status: SyncStatus) => void>();

function setStatus(status: SyncStatus) {
  currentStatus = status;
  for (const listener of statusListeners) listener(status);
}

export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

export function onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function requireClient() {
  if (!supabase) throw new AppError("CLOUD_SYNC_UNAVAILABLE", "Cloud sync isn't configured on this deployment.");
  return supabase;
}

/**
 * The one place a Postgrest/Supabase error becomes an AppError for sync.
 * The raw error (e.g. "invalid input syntax for type uuid", a PGRST code)
 * is logged for debugging but never shown to the user — nothing practicing
 * drums needs to see Postgres internals, and per CLAUDE.md's error-UX rule
 * this must read like something a musician wrote, not a stack trace.
 */
function throwSyncError(raw: { message: string; code?: string }): never {
  console.error("[syncService] cloud sync failed:", raw.code ?? "", raw.message);
  throw new AppError(
    "SYNC_ERROR",
    "We couldn't sync your progress just now. Your practice is still saved on this device — we'll try again next time you're online."
  );
}

// --- Row <-> LocalStorage record mapping -----------------------------------

function progressToRow(userId: string, p: ProgressRecord) {
  return {
    user_id: userId,
    exercise_id: p.exerciseId,
    status: p.status,
    clean_bpm: p.cleanBpm,
    best_accuracy: p.bestAccuracy,
    consecutive_clean_count: p.consecutiveCleanCount,
    attempts_count: p.attemptsCount,
    mastered_at: p.masteredAt,
  };
}

function rowToProgress(row: { exercise_id: string; status: string; clean_bpm: number; best_accuracy: number; consecutive_clean_count: number; attempts_count: number; mastered_at: string | null; updated_at: string }): ProgressRecord {
  return {
    exerciseId: row.exercise_id,
    status: row.status as ProgressRecord["status"],
    cleanBpm: row.clean_bpm,
    bestAccuracy: row.best_accuracy,
    consecutiveCleanCount: row.consecutive_clean_count,
    attemptsCount: row.attempts_count,
    masteredAt: row.mastered_at,
    updatedAt: row.updated_at,
  };
}

function attemptToRow(userId: string, a: AttemptRecord, timezone: string) {
  return {
    user_id: userId,
    client_attempt_id: a.clientAttemptId,
    exercise_id: a.exerciseId,
    target_bpm: a.targetBpm,
    clean_bpm: a.cleanBpm,
    maximum_bpm: a.maximumBpm,
    accuracy: a.accuracy,
    duration_minutes: a.durationMinutes,
    perceived_difficulty: a.perceivedDifficulty,
    notes: a.notes,
    result: a.result,
    recommendation: a.recommendation,
    session_date: localDateKey(new Date(a.createdAt), timezone),
  };
}

function rowToAttempt(row: { id: string; client_attempt_id: string; exercise_id: string; target_bpm: number; clean_bpm: number; maximum_bpm: number | null; accuracy: number; duration_minutes: number; perceived_difficulty: number; notes: string | null; result: string; recommendation: string; created_at: string }): AttemptRecord {
  return {
    id: row.id,
    clientAttemptId: row.client_attempt_id,
    exerciseId: row.exercise_id,
    sessionId: null,
    targetBpm: row.target_bpm,
    cleanBpm: row.clean_bpm,
    maximumBpm: row.maximum_bpm,
    accuracy: row.accuracy,
    durationMinutes: row.duration_minutes,
    perceivedDifficulty: row.perceived_difficulty,
    notes: row.notes,
    result: row.result as AttemptRecord["result"],
    recommendation: row.recommendation,
    createdAt: row.created_at,
  };
}

function videoToRow(userId: string, v: VideoStudyRecord) {
  return {
    user_id: userId,
    video_id: v.youtubeId,
    watched: v.watched,
    favorite: v.favorite,
    noted_aspects: v.notedAspects,
    notes: v.notes,
    watched_at: v.watchedAt,
  };
}

function rowToVideo(row: { video_id: string; watched: boolean; favorite: boolean; noted_aspects: string[]; notes: string; watched_at: string | null; updated_at: string }): VideoStudyRecord {
  return {
    youtubeId: row.video_id,
    watched: row.watched,
    favorite: row.favorite,
    notedAspects: row.noted_aspects,
    notes: row.notes,
    watchedAt: row.watched_at,
    updatedAt: row.updated_at,
  };
}

function achievementToRow(userId: string, a: AchievementUnlockRecord) {
  return { user_id: userId, achievement_id: a.achievementId };
}

function rowToAchievement(row: { achievement_id: string; unlocked_at: string }): AchievementUnlockRecord {
  return { achievementId: row.achievement_id, unlockedAt: row.unlocked_at };
}

// --- Pull / push -------------------------------------------------------------

async function pullCloudState(userId: string) {
  const client = requireClient();
  const [progressRes, attemptsRes, videoRes, achievementsRes] = await Promise.all([
    client.from("exercise_progress").select("*").eq("user_id", userId),
    client.from("practice_sessions").select("*").eq("user_id", userId),
    client.from("video_progress").select("*").eq("user_id", userId),
    client.from("user_achievements").select("*").eq("user_id", userId),
  ]);
  if (progressRes.error) throwSyncError(progressRes.error);
  if (attemptsRes.error) throwSyncError(attemptsRes.error);
  if (videoRes.error) throwSyncError(videoRes.error);
  if (achievementsRes.error) throwSyncError(achievementsRes.error);

  const progress: Record<string, ProgressRecord> = {};
  for (const row of progressRes.data ?? []) progress[row.exercise_id] = rowToProgress(row);

  const attempts = (attemptsRes.data ?? []).map(rowToAttempt);

  const videoStudy: Record<string, VideoStudyRecord> = {};
  for (const row of videoRes.data ?? []) videoStudy[row.video_id] = rowToVideo(row);

  const achievements: Record<string, AchievementUnlockRecord> = {};
  for (const row of achievementsRes.data ?? []) achievements[row.achievement_id] = rowToAchievement(row);

  return { progress, attempts, videoStudy, achievements };
}

async function pushLocalState(
  userId: string,
  timezone: string,
  state: {
    progress: Record<string, ProgressRecord>;
    attempts: AttemptRecord[];
    videoStudy: Record<string, VideoStudyRecord>;
    achievements: Record<string, AchievementUnlockRecord>;
  }
) {
  const client = requireClient();

  const progressRows = Object.values(state.progress).map((p) => progressToRow(userId, p));
  const attemptRows = state.attempts.map((a) => attemptToRow(userId, a, timezone));
  const videoRows = Object.values(state.videoStudy).map((v) => videoToRow(userId, v));
  const achievementRows = Object.values(state.achievements).map((a) => achievementToRow(userId, a));

  if (progressRows.length > 0) {
    const { error } = await client.from("exercise_progress").upsert(progressRows, { onConflict: "user_id,exercise_id" });
    if (error) throwSyncError(error);
  }
  if (attemptRows.length > 0) {
    const { error } = await client.from("practice_sessions").upsert(attemptRows, { onConflict: "client_attempt_id", ignoreDuplicates: true });
    if (error) throwSyncError(error);
  }
  if (videoRows.length > 0) {
    const { error } = await client.from("video_progress").upsert(videoRows, { onConflict: "user_id,video_id" });
    if (error) throwSyncError(error);
  }
  if (achievementRows.length > 0) {
    // Achievements are append-only unlocks — ignoreDuplicates so a row
    // already in the cloud never has its true unlocked_at overwritten by a
    // later sync's server-assigned timestamp.
    const { error } = await client.from("user_achievements").upsert(achievementRows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true });
    if (error) throwSyncError(error);
  }
}

export async function pushProfile(userId: string, user: UserRecord, goals: string[] = []): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("profiles").upsert(
    {
      id: userId,
      name: user.name,
      experience_level: user.experienceLevel,
      timezone: user.timezone,
      onboarding_goals: goals,
    },
    { onConflict: "id" }
  );
  if (error) throwSyncError(error);
}

export interface SyncSummary {
  progressMerged: number;
  attemptsMerged: number;
  videosMerged: number;
  achievementsMerged: number;
}

/**
 * Bidirectional sync: pulls the cloud state, merges it with whatever is
 * currently in LocalStorage using the documented merge rules (see
 * syncMergeRules.ts), writes the merged result back to LocalStorage, and
 * pushes it back up to Supabase so both sides converge. This is also
 * exactly the guest-to-account migration flow — the first sync after
 * sign-up/sign-in naturally merges local guest progress with whatever
 * (usually nothing, for a brand-new account) already exists in the cloud,
 * so there is no separate "migration" code path to keep in sync with this
 * one.
 */
export async function syncNow(userId: string): Promise<SyncSummary> {
  const empty = { progressMerged: 0, attemptsMerged: 0, videosMerged: 0, achievementsMerged: 0 };
  if (!isSupabaseConfigured) return empty;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus("offline");
    return empty;
  }

  setStatus("syncing");
  try {
    const local = getDb();
    const cloud = await pullCloudState(userId);

    const mergedProgress = mergeProgressMaps(local.progress, cloud.progress);
    const mergedAttempts = mergeAttempts(local.attempts, cloud.attempts);
    const mergedVideoStudy = mergeVideoStudyMaps(local.videoStudy, cloud.videoStudy);
    const mergedAchievements = mergeAchievementMaps(local.achievements, cloud.achievements);

    mutate((db) => {
      db.progress = mergedProgress;
      db.attempts = mergedAttempts;
      db.videoStudy = mergedVideoStudy;
      db.achievements = mergedAchievements;
    });

    if (local.user) await pushProfile(userId, local.user);
    await pushLocalState(userId, local.user?.timezone ?? "Africa/Accra", {
      progress: mergedProgress,
      attempts: mergedAttempts,
      videoStudy: mergedVideoStudy,
      achievements: mergedAchievements,
    });

    setStatus("synced");
    return {
      progressMerged: Object.keys(mergedProgress).length,
      attemptsMerged: mergedAttempts.length,
      videosMerged: Object.keys(mergedVideoStudy).length,
      achievementsMerged: Object.keys(mergedAchievements).length,
    };
  } catch (err) {
    setStatus("error");
    throw err;
  }
}
