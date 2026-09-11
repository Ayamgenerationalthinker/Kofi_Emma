import { useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Flame, Award, Layers } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getProgressSummary, getBpmHistory, getAccuracyHistory, getRecentSessions } from "../services/progressService";
import { getCurriculumState } from "../services/curriculumService";
import { getSkillProgress, getWeakestSkill, getStrongestSkill } from "../services/skillService";
import { getUnlockedAchievements } from "../services/achievementService";
import { ACHIEVEMENTS } from "../data/achievements";
import { getAllVideoStudy } from "../services/videoStudyService";
import { KOFI_EMMA_VIDEOS } from "../data/kofiEmmaVideos";
import { EmptyState } from "../components/StatusStates";

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "all", label: "All time" },
];

function parseRangeDays(value: string): number | "all" {
  if (value === "all") return "all";
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

export function Progress() {
  const { user } = useAppContext();
  const [range, setRange] = useState("30");

  useLocalDbVersion();
  const summary = getProgressSummary(user!.timezone);

  if (!summary.hasAnyData) {
    return <EmptyState message="Complete your first practice session to see your progress." />;
  }

  const rangeDays = parseRangeDays(range);
  const bpmData = getBpmHistory({ days: rangeDays }).map((p) => ({ ...p, dateLabel: formatDate(p.date) }));
  const accuracyData = getAccuracyHistory({ days: rangeDays }).map((p) => ({ ...p, dateLabel: formatDate(p.date) }));

  const curriculum = getCurriculumState();
  const skills = getSkillProgress();
  const weakestSkill = getWeakestSkill(skills);
  const strongestSkill = getStrongestSkill(skills);
  const unlockedAchievements = getUnlockedAchievements();
  const videoStudy = getAllVideoStudy();
  const videosWatched = Object.values(videoStudy).filter((v) => v.watched).length;
  const recentSessions = getRecentSessions(5);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">Progress</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Current Level" value={`Level ${curriculum.currentPhaseNumber}`} />
        <SummaryCard icon={<Flame className="h-5 w-5" />} label="Current Streak" value={`${summary.streak.currentStreak} days`} />
        <SummaryCard label="Best Clean BPM" value={summary.bestBpm || "—"} />
        <SummaryCard label="Exercises Mastered" value={`${summary.masteredExercises}/${summary.totalExercises}`} />
      </div>
      <p className="text-sm text-parchment/50">
        {summary.totalMinutesPracticed} minutes practiced total · {summary.streak.thisWeekSessions} sessions this week · longest streak{" "}
        {summary.streak.longestStreak} days
      </p>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-widest text-gold-400">Skills</h2>
        <div className="space-y-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
          {skills.map((s) => (
            <div key={s.skill}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{s.skill}</span>
                {s.hasData ? <span className="tabular-nums text-parchment/60">{s.percentage}%</span> : null}
              </div>
              {s.hasData ? (
                <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal-800">
                  <div className="h-full rounded-full bg-gold-500" style={{ width: `${s.percentage}%` }} />
                </div>
              ) : (
                <p className="text-xs text-parchment/40">Keep practicing to build this skill.</p>
              )}
            </div>
          ))}
          {(weakestSkill || strongestSkill) && (
            <p className="pt-1 text-xs text-parchment/50">
              {strongestSkill && (
                <>
                  Strongest: <span className="text-gold-300">{strongestSkill.skill}</span>
                </>
              )}
              {weakestSkill && strongestSkill && weakestSkill.skill !== strongestSkill.skill && (
                <>
                  {" "}
                  · Weakest: <span className="text-parchment/70">{weakestSkill.skill}</span>
                </>
              )}
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/achievements"
          className="flex items-center gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4 hover:border-gold-500"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-gold-300">
            <Award className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-bold">
              {unlockedAchievements.length}/{ACHIEVEMENTS.length}
            </span>
            <span className="block text-xs text-parchment/50">Achievements unlocked</span>
          </span>
        </Link>
        <Link to="/shed" className="flex items-center gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4 hover:border-gold-500">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-gold-300">
            <Layers className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-bold">
              {videosWatched}/{KOFI_EMMA_VIDEOS.length}
            </span>
            <span className="block text-xs text-parchment/50">Shed videos studied</span>
          </span>
        </Link>
      </div>

      {recentSessions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs uppercase tracking-widest text-gold-400">Recent Practice</h2>
          <div className="divide-y divide-charcoal-800 rounded-xl border border-charcoal-700 bg-charcoal-900/50">
            {recentSessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-parchment/80">{formatDate(s.date)}</span>
                <span className="text-parchment/50">{s.totalMinutes} min</span>
              </div>
            ))}
          </div>
        </section>
      )}

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
              <XAxis dataKey="dateLabel" stroke="#F5F1E8" tick={{ fontSize: 11, fill: "#F5F1E8AA" }} />
              <YAxis stroke="#F5F1E8" tick={{ fontSize: 11, fill: "#F5F1E8AA" }} width={36} />
              <Tooltip contentStyle={{ background: "#14171A", border: "1px solid #38383E", color: "#F5F1E8" }} />
              <Line type="monotone" dataKey="cleanBpm" name="Clean BPM" stroke="#D9A441" strokeWidth={2} dot={false} />
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
              <XAxis dataKey="dateLabel" stroke="#F5F1E8" tick={{ fontSize: 11, fill: "#F5F1E8AA" }} />
              <YAxis domain={[0, 100]} stroke="#F5F1E8" tick={{ fontSize: 11, fill: "#F5F1E8AA" }} width={36} />
              <Tooltip contentStyle={{ background: "#14171A", border: "1px solid #38383E", color: "#F5F1E8" }} />
              <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#6FAF7B" strokeWidth={2} dot={false} />
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
