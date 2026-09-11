// Pure merge functions — no Supabase, no LocalStorage, just deterministic
// rules over two records of the same shape. Kept separate from
// syncService.ts (which does the actual network calls) so these rules are
// trivially unit-testable.
//
// Chosen rules (documented per the spec's requirement to document them):
//   - exercise_progress: the "further along" status wins (MASTERED beats
//     IN_PROGRESS/REPEAT beats AVAILABLE beats LOCKED) — a completed
//     exercise can never be un-completed by a merge. cleanBpm,
//     bestAccuracy, consecutiveCleanCount, attemptsCount all take the max
//     of the two sides. masteredAt takes the earliest non-null value (the
//     true first-mastery moment).
//   - practice_sessions (attempts): append-only, unioned and de-duplicated
//     by clientAttemptId — never overwritten.
//   - video_progress: watched is OR'd (once watched, stays watched);
//     watchedAt takes the earliest non-null value; favorite/notedAspects/
//     notes all take the side with the later updatedAt ("latest write
//     wins" for genuinely user-edited fields, per the spec).
//   - achievements: union of unlocked ids (once unlocked, always unlocked
//     — an achievement is never revoked by a merge); unlockedAt takes the
//     earliest value (the true first-earned moment, same reasoning as
//     masteredAt above).

import type { ProgressRecord, AttemptRecord, VideoStudyRecord, ProgressStatus, AchievementUnlockRecord } from "../lib/localDb";

const STATUS_RANK: Record<ProgressStatus, number> = { LOCKED: 0, AVAILABLE: 1, REPEAT: 2, IN_PROGRESS: 2, MASTERED: 3 };

export function mergeProgressRecord(a: ProgressRecord, b: ProgressRecord): ProgressRecord {
  const winner = STATUS_RANK[a.status] >= STATUS_RANK[b.status] ? a : b;
  const masteredAtCandidates = [a.masteredAt, b.masteredAt].filter((v): v is string => v != null);

  return {
    exerciseId: a.exerciseId,
    status: winner.status,
    cleanBpm: Math.max(a.cleanBpm, b.cleanBpm),
    bestAccuracy: Math.max(a.bestAccuracy, b.bestAccuracy),
    consecutiveCleanCount: Math.max(a.consecutiveCleanCount, b.consecutiveCleanCount),
    attemptsCount: Math.max(a.attemptsCount, b.attemptsCount),
    masteredAt: masteredAtCandidates.length > 0 ? masteredAtCandidates.sort()[0] : null,
    updatedAt: [a.updatedAt, b.updatedAt].sort().reverse()[0],
  };
}

export function mergeProgressMaps(
  local: Record<string, ProgressRecord>,
  cloud: Record<string, ProgressRecord>
): Record<string, ProgressRecord> {
  const merged: Record<string, ProgressRecord> = { ...local };
  for (const [exerciseId, cloudRecord] of Object.entries(cloud)) {
    const localRecord = merged[exerciseId];
    merged[exerciseId] = localRecord ? mergeProgressRecord(localRecord, cloudRecord) : cloudRecord;
  }
  return merged;
}

/** Append-only union, de-duplicated by clientAttemptId (the idempotency key both sides already use). */
export function mergeAttempts(local: AttemptRecord[], cloud: AttemptRecord[]): AttemptRecord[] {
  const byId = new Map<string, AttemptRecord>();
  for (const a of [...local, ...cloud]) {
    if (!byId.has(a.clientAttemptId)) byId.set(a.clientAttemptId, a);
  }
  return Array.from(byId.values()).sort((x, y) => x.createdAt.localeCompare(y.createdAt));
}

export function mergeVideoStudyRecord(a: VideoStudyRecord, b: VideoStudyRecord): VideoStudyRecord {
  const latest = a.updatedAt >= b.updatedAt ? a : b;
  const watchedAtCandidates = [a.watchedAt, b.watchedAt].filter((v): v is string => v != null);

  return {
    youtubeId: a.youtubeId,
    watched: a.watched || b.watched,
    watchedAt: watchedAtCandidates.length > 0 ? watchedAtCandidates.sort()[0] : null,
    favorite: latest.favorite,
    notedAspects: latest.notedAspects,
    notes: latest.notes,
    updatedAt: [a.updatedAt, b.updatedAt].sort().reverse()[0],
  };
}

export function mergeVideoStudyMaps(
  local: Record<string, VideoStudyRecord>,
  cloud: Record<string, VideoStudyRecord>
): Record<string, VideoStudyRecord> {
  const merged: Record<string, VideoStudyRecord> = { ...local };
  for (const [videoId, cloudRecord] of Object.entries(cloud)) {
    const localRecord = merged[videoId];
    merged[videoId] = localRecord ? mergeVideoStudyRecord(localRecord, cloudRecord) : cloudRecord;
  }
  return merged;
}

export function mergeAchievementMaps(
  local: Record<string, AchievementUnlockRecord>,
  cloud: Record<string, AchievementUnlockRecord>
): Record<string, AchievementUnlockRecord> {
  const merged: Record<string, AchievementUnlockRecord> = { ...local };
  for (const [id, cloudRecord] of Object.entries(cloud)) {
    const localRecord = merged[id];
    merged[id] = localRecord
      ? { achievementId: id, unlockedAt: [localRecord.unlockedAt, cloudRecord.unlockedAt].sort()[0] }
      : cloudRecord;
  }
  return merged;
}
