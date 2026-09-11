import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEY, LEGACY_STORAGE_KEYS } from "./keys";
import { migrate, defaultDb, SCHEMA_VERSION } from "./migrations";

// The live `storage.ts` module reads LocalStorage exactly once, at import
// time, into a module-level cache — so these tests exercise the pure
// `migrate()`/`defaultDb()` functions directly (the actual reconciliation
// logic) rather than reloading the module per test. `App.test.tsx` already
// covers the end-to-end "survives a reload" behavior through the real
// store.
describe("migrate — versioning and corruption recovery (section 102)", () => {
  it("returns a fresh default document for null/undefined input", () => {
    const result = migrate(null);
    expect(result.schemaVersion).toBe(SCHEMA_VERSION);
    expect(result.user).toBeNull();
    expect(result.progress).toEqual({});
  });

  it("returns a fresh default document for a non-object (corrupted) input", () => {
    const result = migrate("not an object");
    expect(result).toEqual(defaultDb());
  });

  it("preserves valid fields and only resets a malformed one (section 5: never blank the whole store)", () => {
    const result = migrate({
      schemaVersion: 1,
      user: { id: "u1", name: "Kwame", experienceLevel: "INTERMEDIATE", timezone: "Africa/Accra", onboardedAt: null, createdAt: "now" },
      progress: { "P1-E01": { exerciseId: "P1-E01", status: "MASTERED", cleanBpm: 100, bestAccuracy: 95, consecutiveCleanCount: 2, attemptsCount: 3, masteredAt: "now", updatedAt: "now" } },
      attempts: "this is not an array — corrupted", // malformed field
    });

    expect(result.user?.name).toBe("Kwame");
    expect(result.progress["P1-E01"].status).toBe("MASTERED");
    expect(result.attempts).toEqual([]); // corrupted field safely reset, not a crash
  });

  it("migrates a v1 document (no metronome/videoStudy fields) up to the current schema with sane defaults", () => {
    const result = migrate({ schemaVersion: 1, user: null, progress: {}, attempts: [], sessions: [], dailyLessons: {}, bpmRecords: [] });
    expect(result.schemaVersion).toBe(SCHEMA_VERSION);
    expect(result.metronome).toEqual(defaultDb().metronome);
    expect(result.videoStudy).toEqual({});
  });

  it("merges partial settings/reminderSettings onto defaults rather than discarding the rest", () => {
    const result = migrate({ settings: { theme: "light" }, reminderSettings: { morningOn: false } });
    expect(result.settings.theme).toBe("light");
    expect(result.settings.accuracyThreshold).toBe(defaultDb().settings.accuracyThreshold);
    expect(result.reminderSettings.morningOn).toBe(false);
    expect(result.reminderSettings.eveningTime).toBe("19:00");
  });
});

describe("storage keys (section 3)", () => {
  it("uses the abeleDrumsCoach namespace", () => {
    expect(STORAGE_KEY).toBe("abeleDrumsCoach:data");
  });

  it("knows about the pre-rebrand key for soft migration", () => {
    expect(LEGACY_STORAGE_KEYS).toContain("gospel-drum-coach:db:v1");
  });
});

describe("live store — reset, mutate, and reload behavior", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a write through localStorage under the new key", async () => {
    const { mutate, getDb } = await import("./storage");
    mutate((db) => {
      db.user = { id: "u1", name: "Ama", experienceLevel: "BEGINNER", timezone: "Africa/Accra", onboardedAt: "now", createdAt: "now" };
    });
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).user.name).toBe("Ama");
    expect(getDb().user?.name).toBe("Ama");
  });

  it("resetDb() clears the live store back to a fresh default document", async () => {
    const { mutate, getDb, resetDb } = await import("./storage");
    mutate((db) => {
      db.user = { id: "u1", name: "Ama", experienceLevel: "BEGINNER", timezone: "Africa/Accra", onboardedAt: "now", createdAt: "now" };
    });
    expect(getDb().user).not.toBeNull();
    resetDb();
    expect(getDb().user).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).user).toBeNull();
  });
});
