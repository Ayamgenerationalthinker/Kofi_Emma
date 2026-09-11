import { describe, it, expect } from "vitest";
import { mergeProgressRecord, mergeProgressMaps, mergeAttempts, mergeVideoStudyRecord, mergeVideoStudyMaps } from "./syncMergeRules";
import type { ProgressRecord, AttemptRecord, VideoStudyRecord } from "../lib/localDb";

function progress(overrides: Partial<ProgressRecord>): ProgressRecord {
  return {
    exerciseId: "P1-E01",
    status: "LOCKED",
    cleanBpm: 0,
    bestAccuracy: 0,
    consecutiveCleanCount: 0,
    attemptsCount: 0,
    masteredAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("mergeProgressRecord — completed exercises never un-complete (spec rule)", () => {
  it("a MASTERED local record beats an IN_PROGRESS cloud record", () => {
    const local = progress({ status: "MASTERED", cleanBpm: 100, masteredAt: "2026-01-05T00:00:00.000Z" });
    const cloud = progress({ status: "IN_PROGRESS", cleanBpm: 90 });
    expect(mergeProgressRecord(local, cloud).status).toBe("MASTERED");
  });

  it("takes the max of cleanBpm, bestAccuracy, consecutiveCleanCount, and attemptsCount", () => {
    const local = progress({ cleanBpm: 90, bestAccuracy: 80, consecutiveCleanCount: 1, attemptsCount: 3 });
    const cloud = progress({ cleanBpm: 110, bestAccuracy: 95, consecutiveCleanCount: 2, attemptsCount: 5 });
    const merged = mergeProgressRecord(local, cloud);
    expect(merged.cleanBpm).toBe(110);
    expect(merged.bestAccuracy).toBe(95);
    expect(merged.consecutiveCleanCount).toBe(2);
    expect(merged.attemptsCount).toBe(5);
  });

  it("keeps the earliest masteredAt (the true first-mastery moment) when both sides mastered it", () => {
    const local = progress({ status: "MASTERED", masteredAt: "2026-02-01T00:00:00.000Z" });
    const cloud = progress({ status: "MASTERED", masteredAt: "2026-01-15T00:00:00.000Z" });
    expect(mergeProgressRecord(local, cloud).masteredAt).toBe("2026-01-15T00:00:00.000Z");
  });

  it("mergeProgressMaps merges every exercise present on either side", () => {
    const local = { "P1-E01": progress({ status: "MASTERED" }) };
    const cloud = { "P1-E01": progress({ status: "AVAILABLE" }), "P1-E02": progress({ exerciseId: "P1-E02", status: "AVAILABLE" }) };
    const merged = mergeProgressMaps(local, cloud);
    expect(merged["P1-E01"].status).toBe("MASTERED");
    expect(merged["P1-E02"].status).toBe("AVAILABLE");
  });
});

function attempt(overrides: Partial<AttemptRecord>): AttemptRecord {
  return {
    id: "id-1",
    clientAttemptId: "client-1",
    exerciseId: "P1-E01",
    sessionId: null,
    targetBpm: 100,
    cleanBpm: 100,
    maximumBpm: null,
    accuracy: 90,
    durationMinutes: 10,
    perceivedDifficulty: 3,
    notes: null,
    result: "PASSED",
    recommendation: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("mergeAttempts — append-only, deduplicated by clientAttemptId", () => {
  it("unions attempts from both sides without duplicating a shared clientAttemptId", () => {
    const local = [attempt({ clientAttemptId: "a" }), attempt({ clientAttemptId: "b" })];
    const cloud = [attempt({ clientAttemptId: "b" }), attempt({ clientAttemptId: "c" })];
    const merged = mergeAttempts(local, cloud);
    expect(merged.map((a) => a.clientAttemptId).sort()).toEqual(["a", "b", "c"]);
  });

  it("never drops an attempt that exists on only one side", () => {
    const local = [attempt({ clientAttemptId: "only-local" })];
    const merged = mergeAttempts(local, []);
    expect(merged).toHaveLength(1);
  });
});

function videoStudy(overrides: Partial<VideoStudyRecord>): VideoStudyRecord {
  return {
    youtubeId: "Cd25CPj4Ii4",
    watched: false,
    favorite: false,
    notedAspects: [],
    notes: "",
    watchedAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("mergeVideoStudyRecord — watched is sticky, favorite/notes follow the latest write", () => {
  it("OR's the watched flag — once watched anywhere, it stays watched", () => {
    const local = videoStudy({ watched: true, watchedAt: "2026-01-05T00:00:00.000Z" });
    const cloud = videoStudy({ watched: false });
    expect(mergeVideoStudyRecord(local, cloud).watched).toBe(true);
  });

  it("takes favorite/notes from whichever side has the later updatedAt", () => {
    const local = videoStudy({ favorite: false, notes: "old note", updatedAt: "2026-01-01T00:00:00.000Z" });
    const cloud = videoStudy({ favorite: true, notes: "new note", updatedAt: "2026-01-10T00:00:00.000Z" });
    const merged = mergeVideoStudyRecord(local, cloud);
    expect(merged.favorite).toBe(true);
    expect(merged.notes).toBe("new note");
  });

  it("mergeVideoStudyMaps merges every video present on either side", () => {
    const local = { Cd25CPj4Ii4: videoStudy({ youtubeId: "Cd25CPj4Ii4", favorite: true }) };
    const cloud = { "Rt_wN-mKM_0": videoStudy({ youtubeId: "Rt_wN-mKM_0", watched: true }) };
    const merged = mergeVideoStudyMaps(local, cloud);
    expect(Object.keys(merged)).toContain("Cd25CPj4Ii4");
    expect(Object.keys(merged)).toContain("Rt_wN-mKM_0");
  });
});
