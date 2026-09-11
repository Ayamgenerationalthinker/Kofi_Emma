import { getDb, mutate, type VideoStudyRecord } from "../lib/localDb";

// Per-user Shed Session state only — the video's own metadata (title,
// category, etc.) always comes from the static `kofiEmmaVideos` dataset,
// never from here.

function nowIso(): string {
  return new Date().toISOString();
}

function emptyRecord(youtubeId: string): VideoStudyRecord {
  return { youtubeId, watched: false, favorite: false, notedAspects: [], notes: "", watchedAt: null, updatedAt: nowIso() };
}

export function getVideoStudy(youtubeId: string): VideoStudyRecord {
  return getDb().videoStudy[youtubeId] ?? emptyRecord(youtubeId);
}

export function getAllVideoStudy(): Record<string, VideoStudyRecord> {
  return getDb().videoStudy;
}

export function markWatched(youtubeId: string): void {
  mutate((db) => {
    const existing = db.videoStudy[youtubeId] ?? emptyRecord(youtubeId);
    db.videoStudy[youtubeId] = { ...existing, watched: true, watchedAt: existing.watchedAt ?? nowIso(), updatedAt: nowIso() };
  });
}

export function toggleFavorite(youtubeId: string): void {
  mutate((db) => {
    const existing = db.videoStudy[youtubeId] ?? emptyRecord(youtubeId);
    db.videoStudy[youtubeId] = { ...existing, favorite: !existing.favorite, updatedAt: nowIso() };
  });
}

/** Section 50: saves the "what did you notice?" checklist and optional free-text notes for a video. */
export function saveStudyNotes(youtubeId: string, notedAspects: string[], notes: string): void {
  mutate((db) => {
    const existing = db.videoStudy[youtubeId] ?? emptyRecord(youtubeId);
    db.videoStudy[youtubeId] = { ...existing, notedAspects, notes, updatedAt: nowIso() };
  });
}
