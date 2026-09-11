// Section 8: mastery is calculated, never self-declared. All three gates —
// accuracy, tempo, and consistency across consecutive clean attempts — must
// pass before an exercise can flip to MASTERED.

export interface MasteryCriteria {
  minimumAccuracy: number;
  targetBpm: number;
  requiredConsecutiveCleanAttempts: number;
}

export interface MasteryEvaluation {
  accuracyPassed: boolean;
  bpmPassed: boolean;
  isCleanAttempt: boolean;
  newConsecutiveCleanCount: number;
  consistencyPassed: boolean;
  mastered: boolean;
}

export function evaluateMastery(params: {
  accuracy: number;
  cleanBpm: number;
  priorConsecutiveCleanCount: number;
  criteria: MasteryCriteria;
}): MasteryEvaluation {
  const { accuracy, cleanBpm, priorConsecutiveCleanCount, criteria } = params;

  const accuracyPassed = accuracy >= criteria.minimumAccuracy;
  const bpmPassed = cleanBpm >= criteria.targetBpm;
  const isCleanAttempt = accuracyPassed && bpmPassed;

  const newConsecutiveCleanCount = isCleanAttempt ? priorConsecutiveCleanCount + 1 : 0;
  const consistencyPassed = newConsecutiveCleanCount >= criteria.requiredConsecutiveCleanAttempts;
  const mastered = isCleanAttempt && consistencyPassed;

  return { accuracyPassed, bpmPassed, isCleanAttempt, newConsecutiveCleanCount, consistencyPassed, mastered };
}
