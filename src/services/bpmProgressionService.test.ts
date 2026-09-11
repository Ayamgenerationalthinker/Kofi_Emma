import { describe, it, expect } from "vitest";
import { suggestNextBpm, buildBpmLadder } from "./bpmProgressionService";

const bounds = { minimumBpm: 60, maximumBpm: 160 };

describe("suggestNextBpm", () => {
  it("increases tempo by 5 when accuracy is excellent (>=95)", () => {
    expect(suggestNextBpm({ currentBpm: 120, accuracy: 96, ...bounds }).nextBpm).toBe(125);
  });

  it("increases tempo by 3 for strong but not excellent accuracy (90-94)", () => {
    expect(suggestNextBpm({ currentBpm: 120, accuracy: 92, ...bounds }).nextBpm).toBe(123);
  });

  it("holds tempo steady for accuracy in the 80-89 band", () => {
    expect(suggestNextBpm({ currentBpm: 120, accuracy: 85, ...bounds }).nextBpm).toBe(120);
  });

  it("drops tempo by 5 for accuracy in the 70-79 band", () => {
    expect(suggestNextBpm({ currentBpm: 120, accuracy: 74, ...bounds }).nextBpm).toBe(115);
  });

  it("drops tempo by 10 when accuracy is below 70", () => {
    expect(suggestNextBpm({ currentBpm: 120, accuracy: 60, ...bounds }).nextBpm).toBe(110);
  });

  it("never exceeds the exercise maximum BPM", () => {
    expect(suggestNextBpm({ currentBpm: 158, accuracy: 99, ...bounds }).nextBpm).toBe(160);
  });

  it("never drops below the exercise minimum BPM", () => {
    expect(suggestNextBpm({ currentBpm: 65, accuracy: 40, ...bounds }).nextBpm).toBe(60);
  });
});

describe("buildBpmLadder", () => {
  it("builds an ascending ladder from the clean BPM capped at the exercise maximum", () => {
    const ladder = buildBpmLadder({ cleanBpm: 110, recentAccuracyDropped: false, maximumBpm: 130 });
    expect(ladder[0]).toBe(110);
    expect(Math.max(...ladder)).toBeLessThanOrEqual(130);
    expect(ladder).toEqual([...ladder].sort((a, b) => a - b));
  });

  it("starts one step lower when recent accuracy dropped", () => {
    const steady = buildBpmLadder({ cleanBpm: 110, recentAccuracyDropped: false, maximumBpm: 200 });
    const dropped = buildBpmLadder({ cleanBpm: 110, recentAccuracyDropped: true, maximumBpm: 200 });
    expect(dropped[0]).toBeLessThan(steady[0]);
  });
});
