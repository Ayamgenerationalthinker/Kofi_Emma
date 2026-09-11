import { useParams, Link } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getDb } from "../lib/localDb";
import { getExercise, getPhase } from "../data/curriculum";
import { canAccessExercise } from "../services/curriculumService";
import { StatusBadge } from "../components/StatusBadge";
import { StickingVisualizer } from "../components/StickingVisualizer";
import { EmptyState } from "../components/StatusStates";

// Full exercise detail, including the count/limb/drum orchestration grid
// that turns a rudiment into a musical fill.
export function ExerciseDetail() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  useLocalDbVersion();

  const exercise = exerciseId ? getExercise(exerciseId) : undefined;
  if (!exercise) {
    return <EmptyState message="This exercise doesn't exist." />;
  }

  const db = getDb();
  const progress = db.progress[exercise.id];
  const accessible = canAccessExercise(exercise.id);
  const phase = getPhase(exercise.phaseId);

  if (!accessible) {
    const prerequisites = exercise.prerequisiteIds.map((id) => getExercise(id)).filter((e): e is NonNullable<typeof e> => !!e);
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-10 text-center">
          <Lock className="h-10 w-10 text-parchment/40" />
          <h1 className="text-xl font-bold">{exercise.name}</h1>
          <p className="text-parchment/60">
            This exercise is locked.
            {prerequisites.length > 0 && <> Master {prerequisites.map((p) => p.name).join(", ")} first.</>}
          </p>
        </div>
      </div>
    );
  }

  const stickingTokens = exercise.stickingPattern.split(" ").filter(Boolean);
  const countLabels = buildCountLabels(stickingTokens.length, exercise.subdivision);

  return (
    <div className="space-y-6">
      <BackLink />

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-gold-400">{phase?.title}</span>
          <StatusBadge status={progress?.status ?? "AVAILABLE"} />
        </div>
        <h1 className="mt-1 text-2xl font-black">{exercise.name}</h1>
        <p className="mt-1 text-sm text-parchment/50">{exercise.styleLabel}</p>
        <p className="mt-3 text-parchment/80">{exercise.description}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoTile label="Time Signature" value={exercise.timeSignature} />
        <InfoTile label="Subdivision" value={exercise.subdivision} />
        <InfoTile label="Target BPM" value={String(exercise.targetBpm)} />
        <InfoTile label="Min. Accuracy" value={`${exercise.minimumAccuracy}%`} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Sticking</h2>
        <StickingVisualizer events={exercise.patternEvents.events} currentStepIndex={-1} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Orchestration</h2>
        <div className="overflow-x-auto rounded-lg border border-charcoal-700">
          <table className="w-full min-w-[480px] text-center text-sm">
            <tbody>
              <tr className="border-b border-charcoal-800">
                <th scope="row" className="px-3 py-2 text-left font-medium text-parchment/50">
                  Count
                </th>
                {countLabels.map((label, i) => (
                  <td key={i} className="px-3 py-2 tabular-nums">
                    {label}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-charcoal-800">
                <th scope="row" className="px-3 py-2 text-left font-medium text-parchment/50">
                  Limb
                </th>
                {stickingTokens.map((t, i) => (
                  <td key={i} className="px-3 py-2 font-bold text-gold-300">
                    {t}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="px-3 py-2 text-left font-medium text-parchment/50">
                  Drum
                </th>
                {exercise.orchestration.map((step, i) => (
                  <td key={i} className="px-3 py-2 text-xs">
                    {step.voice}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
          <h2 className="mb-2 font-bold">Purpose</h2>
          <p className="text-sm text-parchment/70">{exercise.purpose}</p>
        </div>
        <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
          <h2 className="mb-2 font-bold">Technique Notes</h2>
          <p className="text-sm text-parchment/70">{exercise.techniqueNotes}</p>
        </div>
      </section>

      <section className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
        <h2 className="mb-2 font-bold">Common Mistakes</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-parchment/70">
          {exercise.commonMistakes.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
        <h2 className="mb-2 font-bold">Mastery Criteria</h2>
        <ul className="space-y-1 text-sm text-parchment/70">
          <li>Minimum accuracy: {exercise.minimumAccuracy}%</li>
          <li>
            Tempo range: {exercise.minimumBpm}–{exercise.maximumBpm} BPM (target {exercise.targetBpm})
          </li>
          <li>Required consecutive clean attempts: {exercise.requiredConsecutiveCleanAttempts}</li>
          <li>
            Your progress: {progress?.attemptsCount ?? 0} attempts, best {progress?.bestAccuracy ?? 0}% accuracy,{" "}
            {progress?.cleanBpm ?? 0} BPM clean, {progress?.consecutiveCleanCount ?? 0} consecutive clean
          </li>
        </ul>
      </section>

      <Link
        to="/practice"
        className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-6 py-3 font-bold text-charcoal-950 hover:bg-gold-400"
      >
        Go to today's practice
      </Link>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/curriculum" className="inline-flex items-center gap-1 text-sm text-parchment/60 hover:text-parchment">
      <ArrowLeft className="h-4 w-4" /> Back to curriculum
    </Link>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-charcoal-700 bg-charcoal-900/50 p-3 text-center">
      <div className="text-base font-bold">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-parchment/50">{label}</div>
    </div>
  );
}

function buildCountLabels(length: number, subdivision: string): string[] {
  if (subdivision === "16th") {
    const syllables = ["1", "e", "&", "a"];
    return Array.from({ length }, (_, i) => syllables[i % 4] ?? String(i + 1));
  }
  if (subdivision === "8th") {
    return Array.from({ length }, (_, i) => (i % 2 === 0 ? String(Math.floor(i / 2) + 1) : "&"));
  }
  return Array.from({ length }, (_, i) => String(i + 1));
}
