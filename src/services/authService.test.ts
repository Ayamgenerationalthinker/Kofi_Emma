import { describe, it, expect } from "vitest";
import { signInWithEmail, signUpWithEmail, signOut, requestPasswordReset, getCurrentSession, onAuthStateChange } from "./authService";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { AppError } from "../lib/errors";

// The test environment never sets VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY
// (and shouldn't — real credentials have no place in a test run), so this
// exercises exactly the "cloud sync not configured" path every guest user
// hits on a deployment with no Supabase project wired up. The app must
// degrade gracefully here, never crash.
describe("authService — guest mode (Supabase not configured)", () => {
  it("isSupabaseConfigured is false with no env vars set", () => {
    expect(isSupabaseConfigured).toBe(false);
  });

  it("signUpWithEmail rejects with a clear, non-crashing AppError", async () => {
    await expect(signUpWithEmail("a@b.com", "password123")).rejects.toBeInstanceOf(AppError);
  });

  it("signInWithEmail rejects with CLOUD_SYNC_UNAVAILABLE", async () => {
    try {
      await signInWithEmail("a@b.com", "password123");
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe("CLOUD_SYNC_UNAVAILABLE");
    }
  });

  it("signOut and requestPasswordReset also reject rather than throwing an unhandled error", async () => {
    await expect(signOut()).rejects.toBeInstanceOf(AppError);
    await expect(requestPasswordReset("a@b.com")).rejects.toBeInstanceOf(AppError);
  });

  it("getCurrentSession resolves to null instead of throwing", async () => {
    await expect(getCurrentSession()).resolves.toBeNull();
  });

  it("onAuthStateChange returns a harmless no-op unsubscribe function", () => {
    const unsubscribe = onAuthStateChange(() => {});
    expect(() => unsubscribe()).not.toThrow();
  });
});
