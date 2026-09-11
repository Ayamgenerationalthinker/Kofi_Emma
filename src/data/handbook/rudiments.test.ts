import { describe, it, expect } from "vitest";
import { RUDIMENTS } from "./rudiments";

describe("RUDIMENTS — the 40 PAS International Drum Rudiments (section 28)", () => {
  it("contains exactly 40 rudiments", () => {
    expect(RUDIMENTS).toHaveLength(40);
  });

  it("every rudiment has a unique number from 1 to 40", () => {
    const numbers = RUDIMENTS.map((r) => r.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
  });

  it("every rudiment has a unique id", () => {
    expect(new Set(RUDIMENTS.map((r) => r.id)).size).toBe(40);
  });

  it("every rudiment has all required fields populated", () => {
    for (const r of RUDIMENTS) {
      expect(r.name, "name").toBeTruthy();
      expect(r.sticking, "sticking").toBeTruthy();
      expect(r.description, "description").toBeTruthy();
      expect(r.purpose, "purpose").toBeTruthy();
      expect(r.application, "application").toBeTruthy();
      expect(r.beginnerBpm).toBeLessThanOrEqual(r.intermediateBpm);
      expect(r.intermediateBpm).toBeLessThanOrEqual(r.advancedBpm);
    }
  });

  it("every flam and drag rudiment carries the notation caveat", () => {
    const flamAndDrag = RUDIMENTS.filter((r) => r.category === "Flam" || r.category === "Drag");
    expect(flamAndDrag.every((r) => !!r.notationCaveat)).toBe(true);
  });
});
