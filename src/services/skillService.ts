// Skill progress, derived entirely from real curriculum mastery data —
// never a fabricated percentage. A skill only reports a number once the
// user has actually attempted at least one exercise that develops it;
// until then callers should show "Keep practicing to build this skill"
// rather than a misleading 0%.

import { EXERCISES } from "../data/curriculum";
import { getDb } from "../lib/localDb";
import { SKILL_CATEGORIES, skillsForCategory, type SkillCategory } from "../data/skillMapping";

export interface SkillProgress {
  skill: SkillCategory;
  /** False until the user has attempted at least one exercise that develops this skill. */
  hasData: boolean;
  /** Percentage of this skill's exercises mastered (0-100). Only meaningful when hasData is true. */
  percentage: number;
  masteredCount: number;
  totalCount: number;
}

/** One row per SKILL_CATEGORIES entry, in that fixed order. */
export function getSkillProgress(): SkillProgress[] {
  const db = getDb();

  return SKILL_CATEGORIES.map((skill) => {
    const relevantExercises = EXERCISES.filter((e) => skillsForCategory(e.category).includes(skill));
    const totalCount = relevantExercises.length;
    const masteredCount = relevantExercises.filter((e) => db.progress[e.id]?.status === "MASTERED").length;
    const hasData = relevantExercises.some((e) => (db.progress[e.id]?.attemptsCount ?? 0) > 0);
    const percentage = totalCount === 0 ? 0 : Math.round((masteredCount / totalCount) * 100);

    return { skill, hasData, percentage, masteredCount, totalCount };
  });
}

export function getWeakestSkill(progress: SkillProgress[]): SkillProgress | null {
  const withData = progress.filter((p) => p.hasData);
  if (withData.length === 0) return null;
  return withData.reduce((weakest, p) => (p.percentage < weakest.percentage ? p : weakest));
}

export function getStrongestSkill(progress: SkillProgress[]): SkillProgress | null {
  const withData = progress.filter((p) => p.hasData);
  if (withData.length === 0) return null;
  return withData.reduce((strongest, p) => (p.percentage > strongest.percentage ? p : strongest));
}
