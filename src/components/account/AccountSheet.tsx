import { useState } from "react";
import { Cloud, CloudOff, LogOut } from "lucide-react";
import { ActionSheet } from "../ui/ActionSheet";
import { useAuth } from "../../context/AuthContext";
import { signInWithEmail, signUpWithEmail, signOut, requestPasswordReset } from "../../services/authService";
import { syncNow } from "../../services/syncService";
import { AppError } from "../../lib/errors";

type Mode = "signin" | "signup";

// "Keep your progress safe" — a low-pressure, secondary account surface
// (never forced at onboarding). Signing in triggers one syncNow() call,
// which doubles as the guest-to-account migration: it merges whatever was
// practiced as a guest with whatever already exists in the cloud for this
// account (see syncService.ts for the merge rules), rather than needing a
// separate migration code path.
export function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cloudAvailable, user } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const authedUser = mode === "signup" ? await signUpWithEmail(email, password) : await signInWithEmail(email, password);
      if (authedUser) {
        setMessage("Syncing your progress...");
        await syncNow(authedUser.id);
        setMessage("You're all set — your progress is backed up.");
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } catch (err) {
      setMessage(err instanceof AppError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setMessage("Enter your email above first.");
      return;
    }
    try {
      await requestPasswordReset(email);
      setMessage("Password reset email sent.");
    } catch (err) {
      setMessage(err instanceof AppError ? err.message : "Could not send reset email.");
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
      onClose();
    } catch (err) {
      setMessage(err instanceof AppError ? err.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  if (!cloudAvailable) {
    return (
      <ActionSheet open={open} onClose={onClose} title="Cloud Sync">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CloudOff className="h-8 w-8 text-parchment/40" />
          <p className="text-sm text-parchment/60">
            Cloud sync isn't set up on this deployment yet. Your practice data still saves safely on this device.
          </p>
        </div>
      </ActionSheet>
    );
  }

  if (user) {
    return (
      <ActionSheet open={open} onClose={onClose} title="Your Account">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-charcoal-700 bg-charcoal-900/50 p-3">
            <Cloud className="h-5 w-5 text-gold-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.email}</p>
              <p className="text-xs text-parchment/50">Your sheds, BPM records, and progress sync across devices.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-charcoal-600 py-2.5 text-sm font-semibold text-parchment/70 hover:border-red-500 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
          {message && <p className="text-center text-xs text-parchment/50">{message}</p>}
        </div>
      </ActionSheet>
    );
  }

  return (
    <ActionSheet open={open} onClose={onClose} title="Keep Your Progress Safe">
      <div className="space-y-4">
        <p className="text-sm text-parchment/60">
          Create a free account so your sheds, BPM records, and progress follow you across devices.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("signup")}
            aria-pressed={mode === "signup"}
            className={["flex-1 min-h-[40px] rounded-md border text-sm font-semibold", mode === "signup" ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/60"].join(" ")}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setMode("signin")}
            aria-pressed={mode === "signin"}
            className={["flex-1 min-h-[40px] rounded-md border text-sm font-semibold", mode === "signin" ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/60"].join(" ")}
          >
            Sign In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm text-parchment/60">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-parchment/60">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 px-3 py-2 text-sm"
            />
          </label>

          {message && (
            <p role="status" className="text-sm text-parchment/60">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="min-h-[44px] w-full rounded-md bg-gold-500 py-2.5 font-bold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
          >
            {busy ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>

          {mode === "signin" && (
            <button type="button" onClick={handleForgotPassword} className="w-full text-center text-xs text-parchment/50 hover:text-parchment">
              Forgot password?
            </button>
          )}
        </form>
      </div>
    </ActionSheet>
  );
}
