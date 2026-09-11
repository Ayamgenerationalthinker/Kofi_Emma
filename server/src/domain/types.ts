export const ExerciseProgressStatus = {
  LOCKED: "LOCKED",
  AVAILABLE: "AVAILABLE",
  IN_PROGRESS: "IN_PROGRESS",
  REPEAT: "REPEAT",
  MASTERED: "MASTERED",
} as const;
export type ExerciseProgressStatus =
  (typeof ExerciseProgressStatus)[keyof typeof ExerciseProgressStatus];

export const PracticeSessionStatus = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  MISSED: "MISSED",
} as const;
export type PracticeSessionStatus =
  (typeof PracticeSessionStatus)[keyof typeof PracticeSessionStatus];

export const AttemptResult = {
  FAILED: "FAILED",
  REPEAT: "REPEAT",
  PASSED: "PASSED",
  MASTERED: "MASTERED",
} as const;
export type AttemptResult = (typeof AttemptResult)[keyof typeof AttemptResult];

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
