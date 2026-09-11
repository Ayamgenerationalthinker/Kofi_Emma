// Section 10: a safe, conservative BPM ladder. Accuracy always gates tempo —
// this function is the only place tempo recommendations are computed so the
// "never reward speed over accuracy" rule (section 86) can't be bypassed.

export interface BpmSuggestion {
  nextBpm: number;
  delta: number;
  rationale: string;
}

export function suggestNextBpm(params: {
  currentBpm: number;
  accuracy: number;
  minimumBpm: number;
  maximumBpm: number;
}): BpmSuggestion {
  const { currentBpm, accuracy, minimumBpm, maximumBpm } = params;

  let delta: number;
  let rationale: string;

  if (accuracy >= 95) {
    delta = 5;
    rationale = "Excellent accuracy. Increasing tempo by 5 BPM.";
  } else if (accuracy >= 90) {
    delta = 3;
    rationale = "Strong accuracy. Increasing tempo by 3 BPM.";
  } else if (accuracy >= 80) {
    delta = 0;
    rationale = "Solid but not yet clean. Hold this tempo and rebuild consistency.";
  } else if (accuracy >= 70) {
    delta = -5;
    rationale = "Accuracy dropped below the safe threshold. Dropping 5 BPM.";
  } else {
    delta = -10;
    rationale = "Accuracy is too low to progress. Dropping 10 BPM to rebuild control.";
  }

  const nextBpm = Math.min(maximumBpm, Math.max(minimumBpm, currentBpm + delta));
  return { nextBpm, delta: nextBpm - currentBpm, rationale };
}

/** Builds a short upward BPM ladder (section 15) from a clean starting tempo. */
export function buildBpmLadder(params: {
  cleanBpm: number;
  recentAccuracyDropped: boolean;
  maximumBpm: number;
  steps?: number;
  stepSize?: number;
}): number[] {
  const { cleanBpm, recentAccuracyDropped, maximumBpm, steps = 5, stepSize = 5 } = params;
  const start = recentAccuracyDropped ? Math.max(40, cleanBpm - stepSize) : cleanBpm;
  const ladder: number[] = [];
  for (let i = 0; i < steps; i++) {
    const bpm = Math.min(maximumBpm, start + i * stepSize);
    ladder.push(bpm);
    if (bpm >= maximumBpm) break;
  }
  return ladder;
}
