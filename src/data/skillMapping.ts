// Maps each curriculum exercise category to the skill area(s) it develops.
// This is the one place that decision is made — a category→skills lookup,
// not per-exercise hand-tagging, so it stays small and reviewable even
// though the curriculum has 40 exercises across 9 categories.
//
// Rationale (so this can be revised deliberately, not by guesswork):
//   TECHNIQUE    — foundational rudiment/hand work: Timing + Chops
//   INDEPENDENCE — explicit limb-independence drills: Independence
//   HIGH_LIFE    — genre groove vocabulary: Groove
//   PRAISE       — up-tempo genre vocabulary: Groove + Speed
//   WORSHIP      — dynamics/feel-led genre vocabulary: Groove
//   SIX_EIGHT    — compound-meter gospel groove, hands+feet together: Groove + Independence
//   TWELVE_EIGHT — same as above at the 12/8 grid: Groove + Independence
//   TRANSITION   — moving cleanly between song sections: Timing + Groove
//   SOLOING      — fills/advanced vocabulary, typically faster: Chops + Speed

export type SkillCategory = "Timing" | "Independence" | "Groove" | "Speed" | "Chops";

export const SKILL_CATEGORIES: SkillCategory[] = ["Timing", "Independence", "Groove", "Speed", "Chops"];

const CATEGORY_TO_SKILLS: Record<string, SkillCategory[]> = {
  TECHNIQUE: ["Timing", "Chops"],
  TIMING: ["Timing"],
  INDEPENDENCE: ["Independence"],
  GROOVE: ["Groove", "Timing"],
  FILLS: ["Chops", "Timing"],
  HIGH_LIFE: ["Groove"],
  PRAISE: ["Groove", "Speed"],
  WORSHIP: ["Groove"],
  SIX_EIGHT: ["Groove", "Independence"],
  TWELVE_EIGHT: ["Groove", "Independence"],
  TRANSITION: ["Timing", "Groove"],
  SOLOING: ["Chops", "Speed"],
};

export function skillsForCategory(category: string): SkillCategory[] {
  return CATEGORY_TO_SKILLS[category] ?? [];
}
