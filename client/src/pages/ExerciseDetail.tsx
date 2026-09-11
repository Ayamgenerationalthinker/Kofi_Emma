import { useParams, Link } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { LoadingState, ErrorState } from "../components/StatusStates";
import { StatusBadge } from "../components/StatusBadge";
import { StickingVisualizer } from "../components/StickingVisualizer";
import type { ExerciseDetail as ExerciseDetailDto } from "../lib/types";

// Section 39/14: full exercise detail, including the count/limb/drum
// orchestration grid that turns a rudiment into a musical fill.
export function ExerciseDetail() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const { data, loading, error, refetch } = useFetch<ExerciseDetailDto>(exerciseId ? `/exercises/${exerciseId}` : null, [exerciseId]);

  if (loading) return <LoadingState label="Loading exercise..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return null;

  if (data.locked) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-10 text-center">
          <Lock className="h-10 w-10 text-parchment/40" />
          <h1 className="text-xl font-bold">{data.name}</h1>
          <p className="text-parchment/60">
            This exercise is locked.
            {data.prerequisites.length > 0 && (
              <> Master {data.prerequisites.map((p) => p.name).join(", ")} first.</>
            )}
          </p>
        </div>
      </div>
    );
  }

  const stickingTokens = data.stickingPattern.split(" ").filter(Boolean);
  const countLabels = buildCountLabels(stickingTokens.length, data.subdivision);

  return (
    <div className="space-y-6">
      <BackLink />

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-gold-400">{data.phaseTitle}</span>
          <StatusBadge status={data.status} />
        </div>
        <h1 className="mt-1 text-2xl font-black">{data.name}</h1>
        <p className="mt-1 text-sm text-parchment/50">{data.styleLabel}</p>
        <p className="mt-3 text-parchment/80">{data.description}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoTile label="Time Signature" value={data.timeSignature} />
        <InfoTile label="Subdivision" value={data.subdivision} />
        <InfoTile label="Target BPM" value={String(data.targetBpm)} />
        <InfoTile label="Min. Accuracy" value={`${data.minimumAccuracy}%`} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Sticking</h2>
        <StickingVisualizer events={data.patternEvents.events} currentStepIndex={-1} />
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
                {data.orchestration.map((step, i) => (
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
          <p className="text-sm text-parchment/70">{data.purpose}</p>
        </div>
        <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
          <h2 className="mb-2 font-bold">Technique Notes</h2>
          <p className="text-sm text-parchment/70">{data.techniqueNotes}</p>
        </div>
      </section>

      <section className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
        <h2 className="mb-2 font-bold">Common Mistakes</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-parchment/70">
          {data.commonMistakes.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
        <h2 className="mb-2 font-bold">Mastery Criteria</h2>
        <ul className="space-y-1 text-sm text-parchment/70">
          <li>Minimum accuracy: {data.minimumAccuracy}%</li>
          <li>
            Tempo range: {data.minimumBpm}–{data.maximumBpm} BPM (target {data.targetBpm})
          </li>
          <li>Required consecutive clean attempts: {data.requiredConsecutiveCleanAttempts}</li>
          <li>
            Your progress: {data.attemptsCount} attempts, best {data.bestAccuracy}% accuracy, {data.cleanBpm} BPM clean,{" "}
            {data.consecutiveCleanCount} consecutive clean
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
