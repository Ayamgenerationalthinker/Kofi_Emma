import { describe, it, expect, vi } from "vitest";

// A dedicated file (rather than adding to authService.test.ts) because it
// needs `isSupabaseConfigured`/`supabase` mocked as "configured" for every
// test here — mixing that with the real "not configured" suite in the same
// file would make the two easy to accidentally cross-contaminate.
vi.mock("../lib/supabase/client", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

import { signUpWithEmail } from "./authService";
import { supabase } from "../lib/supabase/client";

const signUpMock = supabase!.auth.signUp as ReturnType<typeof vi.fn>;

describe("authService.signUpWithEmail — return shape when Supabase is configured", () => {
  it("returns session: null when Supabase requires email confirmation (the 'Confirm email' default)", async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.com" }, session: null },
      error: null,
    });

    const result = await signUpWithEmail("a@b.com", "password123");

    expect(result.user).toEqual({ id: "u1", email: "a@b.com" });
    expect(result.session).toBeNull();
  });

  it("returns a real session when Supabase auto-confirms (Confirm email disabled)", async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.com" }, session: { access_token: "tok" } },
      error: null,
    });

    const result = await signUpWithEmail("a@b.com", "password123");

    expect(result.session).toEqual({ access_token: "tok" });
  });
});
