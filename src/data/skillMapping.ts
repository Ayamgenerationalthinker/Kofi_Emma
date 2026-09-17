// Maps each curriculum exercise category to the skill area(s) it develops.
//
// Rationale:
//   ORIENTATION         — foundational knowledge: Timing
//   READING             — stave & notation literacy: Timing
//   DYNAMICS            — dynamic balance & volume control: Groove + Chops
//   TECHNIQUE           — foundational hand/stroke work: Timing + Chops
//   TIMING              — metronome & subdivision locking: Timing
//   RUDIMENT            — sticking fluency & diddles: Chops + Timing
//   COORDINATION        — 4-limb independence: Independence
//   GROOVE              — pocket & backbeat consistency: Groove + Timing
//   APPLICATION         — pad to drum kit orchestration: Groove + Chops
//   PHRASING            — multi-bar song structure: Groove + Timing
//   FILLS               — transitional signposts: Chops + Timing
//   TRANSITIONS         — moving between song sections: Timing + Groove
//   AFRICAN_GOSPEL      — highlife & 6:8 praise vocabulary: Groove + Independence
//   CHURCH_MUSICIANSHIP — dynamic worship & call-and-response: Groove
//   DOUBLE_BASS         — foot speed & endurance: Speed + Independence
//   GOSPEL_CHOPS        — high-velocity linear fills: Chops + Speed
//   PERFORMANCE         — long-form service stamina: Speed + Groove + Chops

export type SkillCategory = "Timing" | "Independence" | "Groove" | "Speed" | "Chops";

export const SKILL_CATEGORIES: SkillCategory[] = ["Timing", "Independence", "Groove", "Speed", "Chops"];

const CATEGORY_TO_SKILLS: Record<string, SkillCategory[]> = {
  ORIENTATION: ["Timing"],
  READING: ["Timing"],
  DYNAMICS: ["Groove", "Chops"],
  TECHNIQUE: ["Timing", "Chops"],
  TIMING: ["Timing"],
  RUDIMENT: ["Chops", "Timing"],
  COORDINATION: ["Independence"],
  GROOVE: ["Groove", "Timing"],
  APPLICATION: ["Groove", "Chops"],
  PHRASING: ["Groove", "Timing"],
  FILLS: ["Chops", "Timing"],
  TRANSITIONS: ["Timing", "Groove"],
  TRANSITION: ["Timing", "Groove"],
  HIGH_LIFE: ["Groove"],
  PRAISE: ["Groove", "Speed"],
  WORSHIP: ["Groove"],
  SIX_EIGHT: ["Groove", "Independence"],
  TWELVE_EIGHT: ["Groove", "Independence"],
  AFRICAN_GOSPEL: ["Groove", "Independence"],
  CHURCH_MUSICIANSHIP: ["Groove"],
  DOUBLE_BASS: ["Speed", "Independence"],
  GOSPEL_CHOPS: ["Chops", "Speed"],
  SOLOING: ["Chops", "Speed"],
  PERFORMANCE: ["Speed", "Groove", "Chops"],
};

export function skillsForCategory(category: string): SkillCategory[] {
  return CATEGORY_TO_SKILLS[category] ?? ["Timing", "Groove"];
}
