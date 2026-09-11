import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "../services/profileService";
import { saveOnboardingProfile } from "../services/settingsService";
import { AppError } from "../lib/errors";
import { storageAvailable } from "../lib/localDb";
import type { PracticeGoal } from "../lib/localDb";

type ExperienceAnswer = "never" | "basics" | "sometimes" | "experienced";

const EXPERIENCE_OPTIONS: { value: ExperienceAnswer; label: string }[] = [
  { value: "never", label: "I've never played" },
  { value: "basics", label: "I know the basics" },
  { value: "sometimes", label: "I play sometimes" },
  { value: "experienced", label: "I'm experienced" },
];

const GOAL_OPTIONS: PracticeGoal[] = ["Gospel", "Praise", "Worship", "Highlife", "Reggae", "Grooves", "Chops", "Timing", "Speed", "Overall musicianship"];

const DURATION_OPTIONS = [5, 10, 15, 30, 45, 60];

function experienceToLevel(answer: ExperienceAnswer): "BEGINNER" | "INTERMEDIATE" | "ADVANCED" {
  if (answer === "experienced") return "ADVANCED";
  if (answer === "sometimes") return "INTERMEDIATE";
  return "BEGINNER";
}

// Section 3/4 (UX spec): five short screens, no long questionnaire. A
// beginner should be starting their first tiny exercise within about five
// minutes of opening the app for the first time.
export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [experience, setExperience] = useState<ExperienceAnswer | null>(null);
  const [goals, setGoals] = useState<PracticeGoal[]>([]);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Accra";

  function toggleGoal(goal: PracticeGoal) {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  }

  function finish() {
    if (!name.trim()) {
      setError("Please enter your name.");
      setStep(0);
      return;
    }
    try {
      createUser({
        name: name.trim(),
        experienceLevel: experienceToLevel(experience ?? "never"),
        timezone,
        morningOn: true,
        eveningOn: true,
        morningTime: "07:00",
        eveningTime: "19:00",
      });
      saveOnboardingProfile(goals, experience);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Something went wrong creating your profile.");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10 text-parchment">
      {!storageAvailable && (
        <p className="mb-6 rounded-md border border-amber-600/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
          Your browser is blocking persistent local storage (common in private/incognito mode). The app will still
          work for this session, but your progress won't be saved after you close the tab.
        </p>
      )}

      {step === 0 && (
        <OnboardingScreen>
          <h1 className="text-3xl font-black tracking-tight">Your rhythm starts here.</h1>
          <p className="mt-2 text-parchment/60">You don't need to be a drummer yet.</p>
          <label className="mt-8 block">
            <span className="mb-1 block text-sm text-parchment/60">What should we call you?</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kwame"
              autoFocus
              className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 px-3 py-3 text-base outline-none focus:border-gold-500"
            />
          </label>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <PrimaryButton
            onClick={() => {
              if (!name.trim()) {
                setError("Please enter your name.");
                return;
              }
              setError(null);
              setStep(1);
            }}
          >
            START
          </PrimaryButton>
        </OnboardingScreen>
      )}

      {step === 1 && (
        <OnboardingScreen>
          <h1 className="text-2xl font-black">What describes you?</h1>
          <div className="mt-6 space-y-2">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <ChoiceButton key={opt.value} selected={experience === opt.value} onClick={() => setExperience(opt.value)}>
                {opt.label}
              </ChoiceButton>
            ))}
          </div>
          <PrimaryButton disabled={!experience} onClick={() => setStep(2)}>
            CONTINUE
          </PrimaryButton>
          <BackLink onClick={() => setStep(0)} />
        </OnboardingScreen>
      )}

      {step === 2 && (
        <OnboardingScreen>
          <h1 className="text-2xl font-black">What do you want to play better?</h1>
          <p className="mt-1 text-sm text-parchment/50">Pick as many as you like.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                aria-pressed={goals.includes(goal)}
                className={[
                  "min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium",
                  goals.includes(goal) ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70",
                ].join(" ")}
              >
                {goal}
              </button>
            ))}
          </div>
          <PrimaryButton disabled={goals.length === 0} onClick={() => setStep(3)}>
            CONTINUE
          </PrimaryButton>
          <BackLink onClick={() => setStep(1)} />
        </OnboardingScreen>
      )}

      {step === 3 && (
        <OnboardingScreen>
          <h1 className="text-2xl font-black">How much time can you give your drums?</h1>
          <p className="mt-1 text-sm text-parchment/50">Ten minutes, consistently, beats an hour once a month.</p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {DURATION_OPTIONS.map((min) => (
              <ChoiceButton key={min} selected={duration === min} onClick={() => setDuration(min)}>
                {min === 60 ? "60+" : min} min
              </ChoiceButton>
            ))}
          </div>
          <PrimaryButton disabled={!duration} onClick={() => setStep(4)}>
            CONTINUE
          </PrimaryButton>
          <BackLink onClick={() => setStep(2)} />
        </OnboardingScreen>
      )}

      {step === 4 && (
        <OnboardingScreen>
          <h1 className="text-2xl font-black">Let's build your first groove.</h1>
          <p className="mt-2 text-parchment/60">
            Abele Drums Coach runs entirely on this device — your practice data stays local and never
            leaves your browser.
          </p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <PrimaryButton onClick={finish}>START MY FIRST SHED</PrimaryButton>
          <BackLink onClick={() => setStep(3)} />
        </OnboardingScreen>
      )}
    </div>
  );
}

function OnboardingScreen({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-8 w-full rounded-full bg-gold-500 py-4 text-base font-bold text-charcoal-950 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ChoiceButton({ children, selected, onClick }: { children: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "min-h-[48px] w-full rounded-lg border px-4 py-3 text-left text-sm font-medium",
        selected ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-4 w-full text-center text-sm text-parchment/40 hover:text-parchment/70">
      Back
    </button>
  );
}
