import { describe, it, expect } from "vitest";
import { syncNow, getSyncStatus, pushProfile } from "./syncService";
import { AppError } from "../lib/errors";

// Same "no env vars in the test environment" reality as authService.test.ts
// — this is the guest-mode / unconfigured-deployment code path, which must
// never throw or hang the app.
describe("syncService — guest mode (Supabase not configured)", () => {
  it("getSyncStatus starts as 'disabled' when Supabase isn't configured", () => {
    expect(getSyncStatus()).toBe("disabled");
  });

  it("syncNow() is a safe no-op — resolves with a zeroed summary rather than throwing", async () => {
    const summary = await syncNow("fake-user-id");
    expect(summary).toEqual({ progressMerged: 0, attemptsMerged: 0, videosMerged: 0, achievementsMerged: 0 });
  });

  it("pushProfile rejects with CLOUD_SYNC_UNAVAILABLE rather than crashing", async () => {
    await expect(
      pushProfile("fake-user-id", {
        id: "fake-user-id",
        name: "Test",
        experienceLevel: "BEGINNER",
        timezone: "Africa/Accra",
        onboardedAt: null,
        createdAt: new Date().toISOString(),
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
