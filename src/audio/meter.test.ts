import { describe, it, expect } from "vitest";
import {
  getMeterDefinition,
  getMeasureStructure,
  getBeatDuration,
  getSubdivisionDuration,
  getAccentType,
  getNextEvent,
  groupStartPositions,
  formatCountLabel,
  formatGroupingLabel,
  stepsPerBeat,
} from "./meter";

describe("getMeterDefinition — measure length per meter (section 99)", () => {
  it("4/4 has 4 beats per measure", () => {
    expect(getMeterDefinition("4/4").totalSteps).toBe(4);
  });
  it("6/8 has 6 eighth-note positions", () => {
    expect(getMeterDefinition("6/8").totalSteps).toBe(6);
  });
  it("12/8 has 12 eighth-note positions", () => {
    expect(getMeterDefinition("12/8").totalSteps).toBe(12);
  });
  it("7/8 has 7 eighth-note positions", () => {
    expect(getMeterDefinition("7/8").totalSteps).toBe(7);
  });

  it("defaults 6/8 to 3+3 grouping", () => {
    expect(getMeterDefinition("6/8").grouping).toEqual([3, 3]);
  });
  it("defaults 12/8 to 3+3+3+3 grouping", () => {
    expect(getMeterDefinition("12/8").grouping).toEqual([3, 3, 3, 3]);
  });
  it("defaults 7/8 to 2+2+3 grouping", () => {
    expect(getMeterDefinition("7/8").grouping).toEqual([2, 2, 3]);
  });

  it("accepts a valid alternate 7/8 grouping", () => {
    expect(getMeterDefinition("7/8", [3, 2, 2]).grouping).toEqual([3, 2, 2]);
  });

  it("falls back to the default grouping if the total doesn't match the meter", () => {
    expect(getMeterDefinition("7/8", [2, 2]).grouping).toEqual([2, 2, 3]);
  });
});

describe("groupStartPositions — 7/8 grouping 2+2+3 (section 99)", () => {
  it("produces group boundaries at 0, 2, 4", () => {
    expect(groupStartPositions([2, 2, 3])).toEqual([0, 2, 4]);
  });
});

describe("getMeasureStructure / getAccentType — beat 1 accent (section 100)", () => {
  const cases: Array<[import("./meter").TimeSignature, number[] | undefined]> = [
    ["4/4", undefined],
    ["6/8", undefined],
    ["12/8", undefined],
    ["7/8", undefined],
  ];

  it.each(cases)("first event of every measure in %s is PRIMARY", (ts, grouping) => {
    const meter = getMeterDefinition(ts, grouping);
    const structure = getMeasureStructure(meter, "eighth");
    expect(structure[0].accentType).toBe("PRIMARY");
  });

  it("4/4 accents only beat 1 — beats 2-4 are SOFT, never SECONDARY", () => {
    const meter = getMeterDefinition("4/4");
    const structure = getMeasureStructure(meter, "quarter");
    expect(structure.map((e) => e.accentType)).toEqual(["PRIMARY", "SOFT", "SOFT", "SOFT"]);
  });

  it("6/8 accents position 0 as PRIMARY and position 3 (second group) as SECONDARY", () => {
    const meter = getMeterDefinition("6/8");
    const structure = getMeasureStructure(meter, "eighth");
    expect(structure[0].accentType).toBe("PRIMARY");
    expect(structure[3].accentType).toBe("SECONDARY");
    expect(structure[1].accentType).toBe("SOFT");
  });

  it("12/8 accents positions 3, 6, 9 as SECONDARY (each group start)", () => {
    const meter = getMeterDefinition("12/8");
    const structure = getMeasureStructure(meter, "eighth");
    expect([structure[3], structure[6], structure[9]].every((e) => e.accentType === "SECONDARY")).toBe(true);
  });

  it("7/8 grouped 2+2+3 accents positions 2 and 4 as SECONDARY", () => {
    const meter = getMeterDefinition("7/8", [2, 2, 3]);
    const structure = getMeasureStructure(meter, "eighth");
    expect(structure[2].accentType).toBe("SECONDARY");
    expect(structure[4].accentType).toBe("SECONDARY");
    expect(structure[1].accentType).toBe("SOFT");
    expect(structure[5].accentType).toBe("SOFT");
  });

  it("getAccentType wraps around measure boundaries", () => {
    const meter = getMeterDefinition("6/8");
    expect(getAccentType(6, meter, "eighth")).toBe("PRIMARY"); // position 6 wraps to 0 of the next measure
  });
});

describe("getNextEvent", () => {
  it("wraps from the last position back to position 0 (PRIMARY)", () => {
    const meter = getMeterDefinition("7/8");
    const next = getNextEvent(6, meter, "eighth");
    expect(next.position).toBe(0);
    expect(next.accentType).toBe("PRIMARY");
  });
});

describe("stepsPerBeat / durations", () => {
  it("16th subdivision has 4 steps per quarter-note beat", () => {
    expect(stepsPerBeat("16th")).toBe(4);
  });

  it("getBeatDuration is 60/bpm seconds", () => {
    expect(getBeatDuration(120)).toBeCloseTo(0.5);
  });

  it("4/4 subdivision duration divides the beat by steps-per-beat", () => {
    const meter = getMeterDefinition("4/4");
    expect(getSubdivisionDuration(120, meter, "16th")).toBeCloseTo(0.125);
  });

  it("compound meters use a fixed eighth-note grid regardless of a 'subdivision' argument", () => {
    const meter = getMeterDefinition("6/8");
    expect(getSubdivisionDuration(120, meter, "16th")).toBeCloseTo(getBeatDuration(120));
  });
});

describe("formatting helpers", () => {
  it("formatGroupingLabel renders 7/8 2+2+3 as '2+2+3'", () => {
    expect(formatGroupingLabel(getMeterDefinition("7/8", [2, 2, 3]))).toBe("2+2+3");
  });

  it("formatCountLabel renders 7/8 2+2+3 as '1 2 | 3 4 | 5 6 7'", () => {
    expect(formatCountLabel(getMeterDefinition("7/8", [2, 2, 3]), "eighth")).toBe("1 2 | 3 4 | 5 6 7");
  });

  it("formatCountLabel renders 6/8 3+3 as '1 2 3 | 4 5 6'", () => {
    expect(formatCountLabel(getMeterDefinition("6/8"), "eighth")).toBe("1 2 3 | 4 5 6");
  });
});
