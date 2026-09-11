// Static, curated achievement definitions — the "what counts and why" is
// data, not scattered UI logic. The actual unlock conditions live in
// achievementService.ts, evaluated against real practice data; this file
// only describes what each achievement means to the user.

export type AchievementId =
  | "first_practice"
  | "first_groove"
  | "first_clean_bpm"
  | "practice_3_days"
  | "streak_7"
  | "streak_30"
  | "level_0_complete"
  | "level_1_complete"
  | "level_2_complete"
  | "level_3_complete"
  | "clean_bpm_60"
  | "clean_bpm_80"
  | "clean_bpm_100"
  | "clean_bpm_120"
  | "clean_bpm_140";

export type AchievementCategory = "MILESTONE" | "CONSISTENCY" | "LEVEL" | "TEMPO";

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  category: AchievementCategory;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "first_practice", title: "First Shed", description: "Complete your first practice session.", category: "MILESTONE" },
  { id: "first_groove", title: "First Groove", description: "Master your first exercise.", category: "MILESTONE" },
  { id: "first_clean_bpm", title: "Clean Take", description: "Record your first clean BPM.", category: "MILESTONE" },
  { id: "practice_3_days", title: "Building the Habit", description: "Practice on 3 different days.", category: "CONSISTENCY" },
  { id: "streak_7", title: "Seven Days Deep", description: "Reach a 7-day practice streak.", category: "CONSISTENCY" },
  { id: "streak_30", title: "One Month Strong", description: "Reach a 30-day practice streak.", category: "CONSISTENCY" },
  { id: "level_0_complete", title: "Foundations Set", description: "Complete every exercise in Level 0.", category: "LEVEL" },
  { id: "level_1_complete", title: "Intermediate Mastered", description: "Complete every exercise in Level 1.", category: "LEVEL" },
  { id: "level_2_complete", title: "Advanced Mastered", description: "Complete every exercise in Level 2.", category: "LEVEL" },
  { id: "level_3_complete", title: "Maestro", description: "Complete every exercise in Level 3.", category: "LEVEL" },
  { id: "clean_bpm_60", title: "60 BPM Clean", description: "Hit a clean BPM of 60 or higher.", category: "TEMPO" },
  { id: "clean_bpm_80", title: "80 BPM Clean", description: "Hit a clean BPM of 80 or higher.", category: "TEMPO" },
  { id: "clean_bpm_100", title: "100 BPM Clean", description: "Hit a clean BPM of 100 or higher.", category: "TEMPO" },
  { id: "clean_bpm_120", title: "120 BPM Clean", description: "Hit a clean BPM of 120 or higher.", category: "TEMPO" },
  { id: "clean_bpm_140", title: "140 BPM Clean", description: "Hit a clean BPM of 140 or higher.", category: "TEMPO" },
];

const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  return BY_ID.get(id as AchievementId);
}
