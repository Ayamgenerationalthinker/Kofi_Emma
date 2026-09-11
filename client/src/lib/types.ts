export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface User {
  id: string;
  name: string;
  experienceLevel: ExperienceLevel;
  timezone: string;
  onboardedAt: string | null;
}

export interface CurriculumPhaseSummary {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description?: string;
  unlocked: boolean;
  progress: number;
  lockedMessage: string | null;
  exercises: ExerciseSummary[];
}

export interface ExerciseSummary {
  id: string;
  name: string;
  slug: string;
  category: string;
  difficulty: number;
  targetBpm: number;
  status: ProgressStatus;
}

export type ProgressStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "REPEAT" | "MASTERED";

export interface MetronomeEvent {
  position: number;
  limb: "R" | "L" | "K" | "H" | "HH" | "REST";
  accent?: boolean;
}

export interface MetronomePattern {
  timeSignature: string;
  subdivision: string;
  events: MetronomeEvent[];
}

export interface OrchestrationStep {
  limb: string;
  voice: string;
}

export interface ExerciseDetail {
  id: string;
  phaseId: string;
  phaseTitle: string;
  name: string;
  slug: string;
  description: string;
  purpose: string;
  category: string;
  timeSignature: string;
  subdivision: string;
  stickingPattern: string;
  orchestration: OrchestrationStep[];
  patternEvents: MetronomePattern;
  techniqueNotes: string;
  commonMistakes: string[];
  targetBpm: number;
  minimumBpm: number;
  maximumBpm: number;
  minimumAccuracy: number;
  requiredConsecutiveCleanAttempts: number;
  durationMinutes: number;
  difficulty: number;
  styleLabel: string;
  locked: boolean;
  status: ProgressStatus;
  cleanBpm: number;
  bestAccuracy: number;
  consecutiveCleanCount: number;
  attemptsCount: number;
  prerequisites: { id: string; name: string }[];
}

export interface LessonPart {
  part: 1 | 2 | 3 | 4;
  title: string;
  duration: number;
  exerciseId: string;
  exerciseName: string;
  instructions: string;
  sticking: string;
  targetBpm: number;
  category: string;
}

export interface DailyLesson {
  date: string;
  totalMinutes: number;
  phaseTitle: string;
  wasRecoverySession: boolean;
  lessonParts: LessonPart[];
  coachMessage: string;
}

export interface CurriculumState {
  currentPhaseNumber: number;
  currentExerciseId: string | null;
  phases: Array<{
    id: string;
    number: number;
    title: string;
    subtitle: string;
    status: "CURRENT" | "LOCKED" | "COMPLETE";
    progress: number;
    totalExercises: number;
    masteredExercises: number;
  }>;
  overallProgress: number;
}

export interface AttemptInput {
  clientAttemptId: string;
  exerciseId: string;
  sessionId?: string | null;
  cleanBpm: number;
  maximumBpm?: number | null;
  accuracy: number;
  durationMinutes: number;
  perceivedDifficulty?: number;
  notes?: string | null;
}

export interface AttemptResult {
  attemptId: string;
  result: string;
  recommendation: string;
  newProgressStatus: string;
  consecutiveCleanCount: number;
  requiredConsecutiveCleanAttempts: number;
  suggestedNextBpm: number;
  exerciseMastered: boolean;
  wasDuplicate: boolean;
}

export interface ProgressSummary {
  masteredExercises: number;
  lockedExercises: number;
  totalExercises: number;
  totalMinutesPracticed: number;
  totalSessionsCompleted: number;
  bestBpm: number;
  averageAccuracy: number;
  streak: { currentStreak: number; longestStreak: number; thisWeekSessions: number };
  hasAnyData: boolean;
}

export interface Settings {
  preferredDurationMinutes: number;
  defaultBpmIncrease: number;
  accuracyThreshold: number;
  metronomeVolume: number;
  theme: "light" | "dark" | "system";
}

export interface ReminderSettings {
  notificationsOn: boolean;
  morningOn: boolean;
  eveningOn: boolean;
  morningTime: string;
  eveningTime: string;
}
