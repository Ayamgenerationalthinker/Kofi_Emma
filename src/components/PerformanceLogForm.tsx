import { useState } from "react";

export interface PerformanceLogValues {
  cleanBpm: number;
  maximumBpm: number | null;
  accuracy: number;
  durationMinutes: number;
  perceivedDifficulty: number;
  notes: string;
}

// Section 25: every field here maps directly to a server-validated attempt
// field — client-side checks mirror the server's so the user gets instant
// feedback, but the server remains the source of truth (section 44).
export function PerformanceLogForm({
  defaultDuration,
  defaultBpm,
  onSubmit,
  submitting,
}: {
  defaultDuration: number;
  defaultBpm: number;
  onSubmit: (values: PerformanceLogValues) => void;
  submitting: boolean;
}) {
  const [cleanBpm, setCleanBpm] = useState(defaultBpm);
  const [maximumBpm, setMaximumBpm] = useState<string>("");
  const [accuracy, setAccuracy] = useState(90);
  const [durationMinutes, setDurationMinutes] = useState(defaultDuration);
  const [perceivedDifficulty, setPerceivedDifficulty] = useState(3);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cleanBpm < 0) return setFormError("Clean BPM cannot be negative.");
    if (accuracy < 0 || accuracy > 100) return setFormError("Accuracy must be between 0 and 100.");
    if (durationMinutes <= 0) return setFormError("Duration must be positive.");
    const maxBpmValue = maximumBpm.trim() === "" ? null : Number(maximumBpm);
    if (maxBpmValue !== null && cleanBpm > maxBpmValue) {
      return setFormError("Clean BPM cannot exceed maximum BPM.");
    }
    setFormError(null);
    onSubmit({ cleanBpm, maximumBpm: maxBpmValue, accuracy, durationMinutes, perceivedDifficulty, notes: notes.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
      <h3 className="font-bold">Log this attempt</h3>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Clean BPM">
          <input
            type="number"
            min={0}
            value={cleanBpm}
            onChange={(e) => setCleanBpm(Number(e.target.value))}
            className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 px-3 py-2"
          />
        </Field>
        <Field label="Maximum BPM (optional)">
          <input
            type="number"
            min={0}
            value={maximumBpm}
            onChange={(e) => setMaximumBpm(e.target.value)}
            className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 px-3 py-2"
          />
        </Field>
        <Field label="Accuracy %">
          <input
            type="number"
            min={0}
            max={100}
            value={accuracy}
            onChange={(e) => setAccuracy(Number(e.target.value))}
            className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 px-3 py-2"
          />
        </Field>
        <Field label="Duration (minutes)">
          <input
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 px-3 py-2"
          />
        </Field>
      </div>

      <Field label="Perceived difficulty (1-5)">
        <input
          type="range"
          min={1}
          max={5}
          value={perceivedDifficulty}
          onChange={(e) => setPerceivedDifficulty(Number(e.target.value))}
          className="w-full accent-gold-500"
        />
        <span className="text-sm text-parchment/60">{perceivedDifficulty}</span>
      </Field>

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Kick doubles become uneven above 125 BPM."
          className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 px-3 py-2"
        />
      </Field>

      {formError && (
        <p role="alert" className="text-sm text-red-400">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-gold-500 py-3 font-bold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Mark Attempt"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-parchment/60">{label}</span>
      {children}
    </label>
  );
}
