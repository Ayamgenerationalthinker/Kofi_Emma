import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/apiClient";
import { useAppContext } from "../context/AppContext";
import type { User } from "../lib/types";

type PracticeTimePreference = "morning" | "evening" | "both";

// Section 59: first-run experience. Collects just enough to start Phase 1 —
// experience level informs coaching tone later, not which phase they start
// on (section 59 explicitly forbids picking Phase 2 manually).
export function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useAppContext();

  const [name, setName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("INTERMEDIATE");
  const [timePreference, setTimePreference] = useState<PracticeTimePreference>("both");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Accra";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post<{ user: User }>("/profile", {
        name: name.trim(),
        experienceLevel,
        timezone,
        morningOn: timePreference === "morning" || timePreference === "both",
        eveningOn: timePreference === "evening" || timePreference === "both",
      });
      refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong creating your profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-parchment">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight">Gospel Drum Coach</h1>
        <p className="mt-1 text-gold-400">The Kofi Emma Method</p>
        <p className="mt-4 text-sm text-parchment/60">
          Your practice data is stored locally on this device. Master the foundation before earning the next level.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6 rounded-xl border border-charcoal-700 bg-charcoal-900/60 p-6">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Your name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 px-3 py-2 outline-none focus:border-gold-500"
            placeholder="e.g. Kwame"
            autoFocus
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Experience level</legend>
          <div className="grid grid-cols-3 gap-2">
            {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => (
              <button
                type="button"
                key={level}
                onClick={() => setExperienceLevel(level)}
                aria-pressed={experienceLevel === level}
                className={[
                  "rounded-md border px-2 py-2 text-sm capitalize",
                  experienceLevel === level ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70",
                ].join(" ")}
              >
                {level.charAt(0) + level.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Preferred reminder time</legend>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: "morning", label: "07:00" },
                { key: "evening", label: "19:00" },
                { key: "both", label: "Both" },
              ] as const
            ).map((opt) => (
              <button
                type="button"
                key={opt.key}
                onClick={() => setTimePreference(opt.key)}
                aria-pressed={timePreference === opt.key}
                className={[
                  "rounded-md border px-2 py-2 text-sm",
                  timePreference === opt.key ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-gold-500 py-3 font-bold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
        >
          {submitting ? "Starting..." : "Start Phase 1"}
        </button>
      </form>
    </div>
  );
}
