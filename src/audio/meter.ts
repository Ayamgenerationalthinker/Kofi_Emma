// Pure, framework/audio-free meter math (section 98: testable without
// AudioContext). This is what makes the metronome's time-signature support
// more than a cosmetic label — it drives beat grouping, accent placement,
// measure length, and the visualizer.

export type TimeSignature = "4/4" | "6/8" | "12/8" | "7/8";
export type Subdivision = "quarter" | "eighth" | "16th" | "triplet";
export type AccentType = "PRIMARY" | "SECONDARY" | "SOFT";

export interface MeterEvent {
  position: number;
  accentType: AccentType;
}

export interface MeterDefinition {
  timeSignature: TimeSignature;
  grouping: number[];
  totalSteps: number;
  /** "quarter-grid" for 4/4 (subdivision-selectable); "eighth" for compound/odd meters (fixed eighth-note pulse). */
  unitNoteValue: "quarter-grid" | "eighth";
}

// Section 36-38: the meter's default grouping, plus the alternate groupings
// 7/8 explicitly supports.
export const COMPOUND_GROUPING_OPTIONS: Record<Exclude<TimeSignature, "4/4">, number[][]> = {
  "6/8": [[3, 3]],
  "12/8": [[3, 3, 3, 3]],
  "7/8": [
    [2, 2, 3],
    [2, 3, 2],
    [3, 2, 2],
  ],
};

const METER_TOTAL_UNITS: Record<TimeSignature, number> = { "4/4": 4, "6/8": 6, "12/8": 12, "7/8": 7 };

export function stepsPerBeat(subdivision: Subdivision): number {
  switch (subdivision) {
    case "16th":
      return 4;
    case "triplet":
      return 3;
    case "eighth":
      return 2;
    case "quarter":
    default:
      return 1;
  }
}

/** Builds a MeterDefinition. An invalid/mismatched `grouping` (wrong total) silently falls back to the meter's default. */
export function getMeterDefinition(timeSignature: TimeSignature, grouping?: number[]): MeterDefinition {
  if (timeSignature === "4/4") {
    return { timeSignature, grouping: [4], totalSteps: 4, unitNoteValue: "quarter-grid" };
  }
  const options = COMPOUND_GROUPING_OPTIONS[timeSignature];
  const total = METER_TOTAL_UNITS[timeSignature];
  const isValid = grouping && grouping.reduce((a, b) => a + b, 0) === total;
  const resolved = isValid ? grouping! : options[0];
  return { timeSignature, grouping: resolved, totalSteps: total, unitNoteValue: "eighth" };
}

/** The zero-indexed position where each group in `grouping` begins, e.g. [3,3] -> [0, 3]. */
export function groupStartPositions(grouping: number[]): number[] {
  const starts: number[] = [];
  let pos = 0;
  for (const g of grouping) {
    starts.push(pos);
    pos += g;
  }
  return starts;
}

/**
 * The full measure as a sequence of accent-typed positions.
 * - 4/4: position 0 is PRIMARY, every other subdivision step is SOFT — no
 *   secondary tier (section 35).
 * - 6/8, 12/8, 7/8: position 0 is PRIMARY, every other group's start
 *   position is SECONDARY, everything else is SOFT (sections 36-38).
 */
export function getMeasureStructure(meter: MeterDefinition, subdivision: Subdivision): MeterEvent[] {
  if (meter.timeSignature === "4/4") {
    const totalSteps = 4 * stepsPerBeat(subdivision);
    return Array.from({ length: totalSteps }, (_, i) => ({
      position: i,
      accentType: i === 0 ? "PRIMARY" : "SOFT",
    }));
  }
  const groupStarts = new Set(groupStartPositions(meter.grouping));
  return Array.from({ length: meter.totalSteps }, (_, i) => ({
    position: i,
    accentType: i === 0 ? "PRIMARY" : groupStarts.has(i) ? "SECONDARY" : "SOFT",
  }));
}

/** Seconds per meter "unit" (quarter note for 4/4, eighth note for compound/odd meters) at a given BPM. */
export function getBeatDuration(bpm: number): number {
  return 60 / bpm;
}

/** Seconds per scheduled audio step at a given BPM — for 4/4 this divides the beat by the chosen subdivision; compound/odd meters use a fixed eighth-note grid. */
export function getSubdivisionDuration(bpm: number, meter: MeterDefinition, subdivision: Subdivision): number {
  if (meter.timeSignature !== "4/4") return getBeatDuration(bpm);
  return getBeatDuration(bpm) / stepsPerBeat(subdivision);
}

export function getAccentType(position: number, meter: MeterDefinition, subdivision: Subdivision): AccentType {
  const structure = getMeasureStructure(meter, subdivision);
  return structure[((position % structure.length) + structure.length) % structure.length]?.accentType ?? "SOFT";
}

export function getNextEvent(currentPosition: number, meter: MeterDefinition, subdivision: Subdivision): MeterEvent {
  const structure = getMeasureStructure(meter, subdivision);
  const nextPos = (currentPosition + 1) % structure.length;
  return structure[nextPos];
}

/** "3+3", "2+2+3", or "4" for 4/4 — used in the meter picker UI. */
export function formatGroupingLabel(meter: MeterDefinition): string {
  return meter.timeSignature === "4/4" ? "4" : meter.grouping.join("+");
}

/** e.g. "1 2 | 3 4 | 5 6 7" for 7/8 grouped 2+2+3 — the visualizer count label (section 39/77). */
export function formatCountLabel(meter: MeterDefinition, subdivision: Subdivision): string {
  const structure = getMeasureStructure(meter, subdivision);
  const groupStarts = new Set(meter.timeSignature === "4/4" ? [] : groupStartPositions(meter.grouping));
  const parts: string[] = [];
  let current: string[] = [];
  for (let i = 0; i < structure.length; i++) {
    if (groupStarts.has(i) && current.length > 0) {
      parts.push(current.join(" "));
      current = [];
    }
    current.push(String(i + 1));
  }
  if (current.length) parts.push(current.join(" "));
  return parts.join(" | ");
}
