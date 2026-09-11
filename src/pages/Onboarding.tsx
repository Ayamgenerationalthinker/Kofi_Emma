import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "../services/profileService";
import { AppError } from "../lib/errors";
import { storageAvailable } from "../lib/localDb";

type PracticeTimePreference = "morning" | "evening" | "both";

// First-run experience. Collects just enough to start Phase 1 — experience
// level informs coaching tone later, not which phase they start on (you can
// never pick Phase 2 manually).
export function Onboarding() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("INTERMEDIATE");
  const [timePreference, setTimePreference] = useState<PracticeTimePreference>("both");
  const [error, setError] = useState<string | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Accra";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    try {
      createUser({
        name: name.trim(),
        experienceLevel,
        timezone,
        morningOn: timePreference === "morning" || timePreference === "both",
        eveningOn: timePreference === "evening" || timePreference === "both",
        morningTime: "07:00",
        eveningTime: "19:00",
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Something went wrong creating your profile.");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-parchment">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight">Gospel Drum Coach</h1>
        <p className="mt-1 text-gold-400">The Kofi Emma Method</p>
        <p className="mt-4 text-sm text-parchment/60">
          This app runs entirely on this device — your practice data is stored locally in your browser and never
          leaves it. Master the foundation before earning the next level.
        </p>
        {!storageAvailable && (
          <p className="mt-3 rounded-md border border-amber-600/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
            Your browser is blocking persistent local storage (common in private/incognito mode). The app will still
            work for this session, but your progress won't be saved after you close the tab.
          </p>
        )}
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

        <button type="submit" className="w-full rounded-md bg-gold-500 py-3 font-bold text-charcoal-950 hover:bg-gold-400">
          Start Phase 1
        </button>
      </form>
    </div>
  );
}
