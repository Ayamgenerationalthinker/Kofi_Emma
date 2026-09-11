import { describe, it, expect } from "vitest";
import { evaluateMastery } from "./masteryService.js";

const criteria = { minimumAccuracy: 90, targetBpm: 140, requiredConsecutiveCleanAttempts: 2 };

describe("evaluateMastery", () => {
  // Section 87: attempt A — 140 BPM at 72% accuracy must never progress or master.
  it("fails accuracy gate below the minimum threshold regardless of tempo", () => {
    const result = evaluateMastery({ accuracy: 72, cleanBpm: 140, priorConsecutiveCleanCount: 0, criteria });
    expect(result.accuracyPassed).toBe(false);
    expect(result.mastered).toBe(false);
    expect(result.newConsecutiveCleanCount).toBe(0);
  });

  // Section 87: attempt B — accuracy clears the bar but tempo is below target: in progress, not mastered.
  it("does not master when accuracy passes but tempo is below target", () => {
    const result = evaluateMastery({ accuracy: 94, cleanBpm: 125, priorConsecutiveCleanCount: 0, criteria });
    expect(result.accuracyPassed).toBe(true);
    expect(result.bpmPassed).toBe(false);
    expect(result.mastered).toBe(false);
  });

  // Section 88: two consecutive clean attempts at/above target BPM and above minimum accuracy => mastered.
  it("masters only after the required number of consecutive clean attempts", () => {
    const first = evaluateMastery({ accuracy: 91, cleanBpm: 140, priorConsecutiveCleanCount: 0, criteria });
    expect(first.isCleanAttempt).toBe(true);
    expect(first.mastered).toBe(false);
    expect(first.newConsecutiveCleanCount).toBe(1);

    const second = evaluateMastery({
      accuracy: 94,
      cleanBpm: 140,
      priorConsecutiveCleanCount: first.newConsecutiveCleanCount,
      criteria,
    });
    expect(second.mastered).toBe(true);
    expect(second.newConsecutiveCleanCount).toBe(2);
  });

  it("resets the consecutive clean streak after any non-clean attempt", () => {
    const clean = evaluateMastery({ accuracy: 92, cleanBpm: 140, priorConsecutiveCleanCount: 1, criteria });
    expect(clean.newConsecutiveCleanCount).toBe(2);

    const dirty = evaluateMastery({ accuracy: 80, cleanBpm: 140, priorConsecutiveCleanCount: 2, criteria });
    expect(dirty.isCleanAttempt).toBe(false);
    expect(dirty.newConsecutiveCleanCount).toBe(0);
  });
});
