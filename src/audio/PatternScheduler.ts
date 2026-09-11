import type { StepDefinition } from "./MetronomeEngine";
import type { MetronomeEvent } from "../lib/types";

// Section 19/20/48: maps a MetronomePattern's structured events onto the
// engine's generic step grid, and provides a plain click-track builder for
// the standalone Metronome page (no exercise pattern attached).

export function buildStepsFromPattern(events: MetronomeEvent[]): StepDefinition[] {
  return events.map((event, i) => ({
    index: i,
    clickType: event.accent ? "accent" : event.limb === "REST" ? "subdivision" : "normal",
  }));
}

/** Beat groupings per section 21: 4/4 accents beat 1; 6/8 and 12/8 accent every group of three. */
export function buildPlainMetronomeSteps(timeSignature: string, subdivision: string): StepDefinition[] {
  const stepsPerCycle = stepsForTimeSignature(timeSignature, subdivision);
  const groupSize = timeSignature === "4/4" ? stepsPerBeat(subdivision) : 3 * (subdivision === "8th" ? 1 : subdivision === "16th" ? 2 : 1);

  return Array.from({ length: stepsPerCycle }, (_, i) => ({
    index: i,
    clickType: i % groupSize === 0 ? "accent" : "normal",
  }));
}

function stepsPerBeat(subdivision: string): number {
  switch (subdivision) {
    case "16th":
      return 4;
    case "triplet":
      return 3;
    case "8th":
      return 2;
    default:
      return 1;
  }
}

function stepsForTimeSignature(timeSignature: string, subdivision: string): number {
  if (timeSignature === "6/8") return subdivision === "16th" ? 12 : 6;
  if (timeSignature === "12/8") return subdivision === "16th" ? 24 : 12;
  // Default 4/4
  return 4 * stepsPerBeat(subdivision);
}
