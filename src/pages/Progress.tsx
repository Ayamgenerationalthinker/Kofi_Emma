import { useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Flame, Gauge, Clock, CheckCircle2, Sparkles, ArrowRight, Trophy, BarChart3 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getProgressSummary, getBpmHistory, getAccuracyHistory, getRecentSessions } from "../services/progressService";
import { getSkillProgress, getWeakestSkill } from "../services/skillService";
import { getUnlockedAchievements } from "../services/achievementService";
import { ACHIEVEMENTS } from "../data/achievements";
import { getAllVideoStudy } from "../services/videoStudyService";
import { KOFI_EMMA_VIDEOS } from "../data/kofiEmmaVideos";
import { EmptyState } from "../components/StatusStates";
import { getDb } from "../lib/localDb";

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
  const db = getDb();
  const summary = getProgressSummary(user!.timezone);

  const rangeDays = parseRangeDays(range);
  const bpmData = getBpmHistory({ days: rangeDays }).map((p) => ({ ...p, dateLabel: formatDate(p.date) }));
  const accuracyData = getAccuracyHistory({ days: rangeDays }).map((p) => ({ ...p, dateLabel: formatDate(p.date) }));

  const skills = getSkillProgress();
  const weakestSkill = getWeakestSkill(skills);
  const unlockedAchievements = getUnlockedAchievements();
  const videoStudy = getAllVideoStudy();
  const videosWatched = Object.values(videoStudy).filter((v) => v.watched).length;
  const recentSessions = getRecentSessions(10);

  // Group practice history by Today, Yesterday, Earlier
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  const attempts = db.attempts || [];
  const fastestCleanAttempt = attempts
    .filter((a) => a.accuracy >= 90)
    .sort((a, b) => b.cleanBpm - a.cleanBpm)[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <BarChart3 className="h-4 w-4" />
          Analytics & Skill Tracking
        </div>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Progress & Records</h1>
        <p className="mt-1 text-sm text-parchment/60">
          Your work is becoming visible. Track timing accuracy, clean tempo ceiling, and skill development.
        </p>
      </div>

      {/* Top 4 Core Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={<Clock className="h-5 w-5" />}
          label="Total Practice"
          value={`${Math.floor(summary.totalMinutesPracticed / 60)}h ${summary.totalMinutesPracticed % 60}m`}
        />
        <SummaryCard
          icon={<Flame className="h-5 w-5 text-amber-400" />}
          label="Current Streak"
          value={`${summary.streak.currentStreak} Days`}
        />
        <SummaryCard
          icon={<Gauge className="h-5 w-5 text-gold-400" />}
          label="Fastest Clean BPM"
          value={summary.bestBpm ? `${summary.bestBpm} BPM` : "—"}
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          label="Grooves Mastered"
          value={`${summary.masteredExercises} / ${summary.totalExercises}`}
        />
      </div>

      {/* SMART RECOMMENDATION ENGINE (DETERMINISTIC COACH) */}
      <section className="rounded-2xl border border-gold-500/40 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-gold-500/10 p-3 text-gold-400 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-400">Coach Recommendation</span>
            {summary.averageAccuracy >= 94 ? (
              <div>
                <h3 className="text-base font-bold text-parchment">You are locked in. Ready to increase tempo!</h3>
                <p className="mt-1 text-xs text-parchment/70">
                  Your accuracy average is {summary.averageAccuracy}%. Try nudging your practice tempo up by +5 BPM in the Tempo Builder.
                </p>
                <Link
                  to="/tempo-builder"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-xs font-bold text-charcoal-950 hover:bg-gold-400"
                >
                  Launch Tempo Builder <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : weakestSkill?.hasData ? (
              <div>
                <h3 className="text-base font-bold text-parchment">
                  Focus on {weakestSkill.skill} consistency.
                </h3>
                <p className="mt-1 text-xs text-parchment/70">
                  Your recent session data indicates {weakestSkill.skill} has {weakestSkill.percentage}% completion. Drop 10 BPM and rebuild the clean pocket.
                </p>
                <Link
                  to="/practice"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-xs font-bold text-charcoal-950 hover:bg-gold-400"
                >
                  Practice Weak Spot <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-bold text-parchment">Build the daily practice habit.</h3>
                <p className="mt-1 text-xs text-parchment/70">
                  15 minutes of disciplined metronome work every day is superior to 2 hours once a week.
                </p>
                <Link
                  to="/practice"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-xs font-bold text-charcoal-950 hover:bg-gold-400"
                >
                  Start Practice <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Empty State Banner if no sessions yet */}
      {summary.totalMinutesPracticed === 0 && summary.masteredExercises === 0 && attempts.length === 0 && (
        <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-6 text-center">
          <p className="text-sm font-semibold text-parchment">
            Complete your first practice session to build your skill history, personal records, and unlocked achievements.
          </p>
          <Link
            to="/practice"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-2.5 text-xs font-bold text-charcoal-950 hover:bg-gold-400"
          >
            Start First Practice <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* SKILL PROFILE RADAR & PROGRESS BARS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-parchment/60">Skills</h2>
          <span className="text-xs text-parchment/40">Real Performance Data</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {skills.map((s) => (
            <div key={s.skill} className="rounded-xl border border-charcoal-800 bg-charcoal-900/60 p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold text-parchment">{s.skill}</span>
                <span className="font-mono text-gold-400">
                  {s.hasData ? `${s.percentage}% (${s.masteredCount}/${s.totalCount})` : "0%"}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500"
                  style={{ width: `${s.percentage}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-parchment/40">
                {s.hasData ? `${s.masteredCount} exercises mastered` : "Keep practicing to build this skill"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PERSONAL RECORDS & MILESTONES */}
      <section className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-gold-400">
          <Trophy className="h-4 w-4" />
          Personal Records & Milestones
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-charcoal-700 bg-charcoal-800/40 p-4">
            <span className="text-xs text-parchment/50">Longest Streak</span>
            <p className="mt-1 font-display text-2xl font-bold text-amber-400">{summary.streak.longestStreak} Days</p>
          </div>
          <div className="rounded-xl border border-charcoal-700 bg-charcoal-800/40 p-4">
            <span className="text-xs text-parchment/50">Fastest Clean Groove</span>
            <p className="mt-1 font-display text-2xl font-bold text-gold-400">
              {fastestCleanAttempt ? `${fastestCleanAttempt.cleanBpm} BPM` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-charcoal-700 bg-charcoal-800/40 p-4">
            <span className="text-xs text-parchment/50">Achievements unlocked</span>
            <p className="mt-1 font-display text-2xl font-bold text-parchment">
              {unlockedAchievements.length} / {ACHIEVEMENTS.length}
            </p>
          </div>
          <div className="rounded-xl border border-charcoal-700 bg-charcoal-800/40 p-4">
            <span className="text-xs text-parchment/50">Shed videos studied</span>
            <p className="mt-1 font-display text-2xl font-bold text-parchment">
              {videosWatched} / {KOFI_EMMA_VIDEOS.length}
            </p>
          </div>
        </div>
      </section>

      {/* PRACTICE HISTORY FEED */}
      {recentSessions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-parchment/60">Practice History</h2>
            <span className="text-xs text-parchment/40">{recentSessions.length} Recent Logs</span>
          </div>

          <div className="divide-y divide-charcoal-800 rounded-2xl border border-charcoal-800 bg-charcoal-900/60">
            {recentSessions.map((s, i) => {
              const isToday = s.date.startsWith(todayStr);
              const isYesterday = s.date.startsWith(yesterday);
              const dateTag = isToday ? "Today" : isYesterday ? "Yesterday" : formatDate(s.date);

              return (
                <div key={i} className="flex flex-col justify-between gap-1 p-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-charcoal-800 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-400">
                        {dateTag}
                      </span>
                      <span className="text-xs text-parchment/60">{s.date}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-parchment">
                      Shed Practice Session &middot; {s.totalMinutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-parchment/50">
                    <span>Duration: <strong className="text-parchment">{s.totalMinutes} min</strong></span>
                    <span className="text-success font-semibold">Completed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CHARTS WITH RANGE SELECTOR */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-parchment/60">Performance Trends</h2>
          <div className="flex flex-wrap gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  range === r.key
                    ? "bg-gold-500 text-charcoal-950 font-bold"
                    : "border border-charcoal-700 bg-charcoal-800 text-parchment/60 hover:text-parchment"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* BPM Chart */}
          <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5">
            <h3 className="mb-3 text-sm font-bold text-parchment">Clean BPM Progression</h3>
            {bpmData.length === 0 ? (
              <EmptyState message="Complete an exercise session to track your clean BPM trend." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={bpmData} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26262A" />
                  <XAxis dataKey="dateLabel" stroke="#F5F1E8" tick={{ fontSize: 11, fill: "#F5F1E8AA" }} />
                  <YAxis stroke="#F5F1E8" tick={{ fontSize: 11, fill: "#F5F1E8AA" }} width={36} />
                  <Tooltip contentStyle={{ background: "#14171A", border: "1px solid #38383E", color: "#F5F1E8" }} />
                  <Line type="monotone" dataKey="cleanBpm" name="Clean BPM" stroke="#D9A441" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Accuracy Chart */}
          <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5">
            <h3 className="mb-3 text-sm font-bold text-parchment">Accuracy Over Time</h3>
            {accuracyData.length === 0 ? (
              <EmptyState message="Complete an exercise session to track your accuracy trend." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={accuracyData} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26262A" />
                  <XAxis dataKey="dateLabel" stroke="#F5F1E8" tick={{ fontSize: 11, fill: "#F5F1E8AA" }} />
                  <YAxis domain={[0, 100]} stroke="#F5F1E8" tick={{ fontSize: 11, fill: "#F5F1E8AA" }} width={36} />
                  <Tooltip contentStyle={{ background: "#14171A", border: "1px solid #38383E", color: "#F5F1E8" }} />
                  <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#6FAF7B" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-4 text-center">
      {icon && <div className="mb-1 text-gold-400">{icon}</div>}
      <p className="font-display text-2xl font-black text-parchment">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-parchment/50">{label}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
