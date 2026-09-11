import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountSheet } from "./AccountSheet";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ cloudAvailable: true, user: null, session: null, loading: false }),
}));

vi.mock("../../services/authService", () => ({
  signUpWithEmail: vi.fn(),
  signInWithEmail: vi.fn(),
  requestPasswordReset: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("../../services/syncService", () => ({
  syncNow: vi.fn(),
}));

import { signUpWithEmail } from "../../services/authService";
import { syncNow } from "../../services/syncService";

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Email"), "a@b.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: /create account/i }));
}

describe("AccountSheet — sign-up messaging matches whether a session actually exists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'check your email' (not false success) when Supabase requires email confirmation", async () => {
    (signUpWithEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "u1", email: "a@b.com" }, session: null });
    const user = userEvent.setup();
    render(<AccountSheet open={true} onClose={() => {}} />);

    await fillAndSubmit(user);

    expect(await screen.findByText(/check your email to confirm your account/i)).toBeInTheDocument();
    // No sync should ever be attempted without a real session — it would
    // only fail against Supabase's RLS policies.
    expect(syncNow).not.toHaveBeenCalled();
  });

  it("syncs and shows success when Supabase auto-confirms and a session exists", async () => {
    (signUpWithEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "u1", email: "a@b.com" }, session: { access_token: "tok" } });
    (syncNow as ReturnType<typeof vi.fn>).mockResolvedValue({ progressMerged: 0, attemptsMerged: 0, videosMerged: 0, achievementsMerged: 0 });
    const user = userEvent.setup();
    render(<AccountSheet open={true} onClose={() => {}} />);

    await fillAndSubmit(user);

    expect(await screen.findByText(/you're all set/i)).toBeInTheDocument();
    expect(syncNow).toHaveBeenCalledWith("u1");
  });
});
