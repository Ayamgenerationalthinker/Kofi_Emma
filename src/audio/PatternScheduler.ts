import type { StepDefinition } from "./MetronomeEngine";
import type { MetronomeEvent } from "../lib/types";
import { getMeterDefinition, getMeasureStructure, type TimeSignature, type Subdivision } from "./meter";

// Maps structured pattern/meter data onto the engine's generic step grid.

/** An exercise's own sticking pattern: its `accent` flag gets the strongest click, a REST the softest. */
export function buildStepsFromPattern(events: MetronomeEvent[]): StepDefinition[] {
  return events.map((event, i) => ({
    index: i,
    clickType: event.accent ? "PRIMARY" : event.limb === "REST" ? "SOFT" : "SECONDARY",
  }));
}

/** The standalone metronome's click track, fully meter-aware (section 30-38): beat 1 always PRIMARY, other group starts SECONDARY, everything else SOFT. */
export function buildMeterSteps(timeSignature: TimeSignature, subdivision: Subdivision, grouping?: number[]): StepDefinition[] {
  const meter = getMeterDefinition(timeSignature, grouping);
  const structure = getMeasureStructure(meter, subdivision);
  return structure.map((event) => ({ index: event.position, clickType: event.accentType }));
}
