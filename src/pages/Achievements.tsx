import { Lock, CheckCircle2 } from "lucide-react";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { ACHIEVEMENTS, type AchievementCategory } from "../data/achievements";
import { isAchievementUnlocked, getUnlockedAchievements } from "../services/achievementService";

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  MILESTONE: "Milestones",
  CONSISTENCY: "Consistency",
  LEVEL: "Level Completion",
  TEMPO: "Clean BPM",
};

const CATEGORY_ORDER: AchievementCategory[] = ["MILESTONE", "CONSISTENCY", "LEVEL", "TEMPO"];

// Understated by design — no coins, no confetti, no points. A locked card
// and an unlocked one differ only in state, not in visual noise.
export function Achievements() {
  useLocalDbVersion();

  const unlockedRecords = getUnlockedAchievements();
  const unlockedAt = new Map(unlockedRecords.map((r) => [r.achievementId, r.unlockedAt]));

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-black">Achievements</h1>
        <p className="mt-1 text-parchment/60">
          {unlockedRecords.length} of {ACHIEVEMENTS.length} unlocked — earned through real practice, never by opening a screen.
        </p>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const items = ACHIEVEMENTS.filter((a) => a.category === category);
        return (
          <section key={category} className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-gold-400">{CATEGORY_LABELS[category]}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((achievement) => {
                const unlocked = isAchievementUnlocked(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={[
                      "flex items-start gap-3 rounded-xl border p-4",
                      unlocked ? "border-gold-600/40 bg-charcoal-900/60" : "border-charcoal-700 bg-charcoal-900/30",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                        unlocked ? "border-gold-500/50 text-gold-300" : "border-charcoal-600 text-parchment/30",
                      ].join(" ")}
                    >
                      {unlocked ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className={["text-sm font-bold", unlocked ? "text-parchment" : "text-parchment/50"].join(" ")}>{achievement.title}</p>
                      <p className="text-xs text-parchment/50">{achievement.description}</p>
                      {unlocked && unlockedAt.get(achievement.id) && (
                        <p className="mt-1 text-[11px] text-gold-400/70">
                          Unlocked {new Date(unlockedAt.get(achievement.id)!).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
