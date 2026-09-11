import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Flame, Trophy } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { LoadingState, ErrorState, EmptyState } from "../components/StatusStates";
import type { ProgressSummary } from "../lib/types";

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "all", label: "All time" },
];

interface BpmPoint {
  date: string;
  cleanBpm: number;
  accuracy: number;
  exerciseName: string;
}
interface AccuracyPoint {
  date: string;
  accuracy: number;
  cleanBpm: number;
  result: string;
  exerciseName: string;
}

export function Progress() {
  const [range, setRange] = useState("30");
  const summary = useFetch<ProgressSummary>("/progress");
  const bpmHistory = useFetch<{ history: BpmPoint[] }>(`/progress/bpm?range=${range}`, [range]);
  const accuracyHistory = useFetch<{ history: AccuracyPoint[] }>(`/progress/accuracy?range=${range}`, [range]);

  if (summary.loading) return <LoadingState label="Loading progress..." />;
  if (summary.error) return <ErrorState message={summary.error.message} onRetry={summary.refetch} />;
  if (!summary.data) return null;

  if (!summary.data.hasAnyData) {
    return <EmptyState message="Complete your first practice session to see your progress." />;
  }

  const bpmData = (bpmHistory.data?.history ?? []).map((p) => ({ ...p, dateLabel: formatDate(p.date) }));
  const accuracyData = (accuracyHistory.data?.history ?? []).map((p) => ({ ...p, dateLabel: formatDate(p.date) }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">Progress</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard icon={<Flame className="h-5 w-5" />} label="Current Streak" value={`${summary.data.streak.currentStreak} days`} />
        <SummaryCard icon={<Trophy className="h-5 w-5" />} label="Longest Streak" value={`${summary.data.streak.longestStreak} days`} />
        <SummaryCard label="This Week" value={`${summary.data.streak.thisWeekSessions} sessions`} />
        <SummaryCard label="Total Minutes" value={summary.data.totalMinutesPracticed} />
      </div>

      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            aria-pressed={range === r.key}
            className={[
              "rounded-md border px-3 py-1.5 text-sm",
              range === r.key ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70",
            ].join(" ")}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ChartCard title="BPM Over Time">
        {bpmData.length === 0 ? (
          <EmptyState message="Complete an exercise to start tracking BPM." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={bpmData} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262A" />
              <XAxis dataKey="dateLabel" stroke="#F4E7C9" tick={{ fontSize: 11, fill: "#F4E7C9AA" }} />
              <YAxis stroke="#F4E7C9" tick={{ fontSize: 11, fill: "#F4E7C9AA" }} width={36} />
              <Tooltip contentStyle={{ background: "#121214", border: "1px solid #38383E", color: "#F4E7C9" }} />
              <Line type="monotone" dataKey="cleanBpm" name="Clean BPM" stroke="#D8A94E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Accuracy Over Time">
        {accuracyData.length === 0 ? (
          <EmptyState message="Complete an exercise to start tracking accuracy." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={accuracyData} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262A" />
              <XAxis dataKey="dateLabel" stroke="#F4E7C9" tick={{ fontSize: 11, fill: "#F4E7C9AA" }} />
              <YAxis domain={[0, 100]} stroke="#F4E7C9" tick={{ fontSize: 11, fill: "#F4E7C9AA" }} width={36} />
              <Tooltip contentStyle={{ background: "#121214", border: "1px solid #38383E", color: "#F4E7C9" }} />
              <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#7DB8E8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4 text-center">
      {icon && <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-800 text-gold-400">{icon}</div>}
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-parchment/50">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
      <h2 className="mb-3 font-bold">{title}</h2>
      {children}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
