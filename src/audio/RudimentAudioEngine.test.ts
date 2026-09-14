import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RudimentAudioEngine } from "./RudimentAudioEngine";
import { AudioEngine } from "./AudioEngine";
import { PAS_RUDIMENTS, getRudimentById } from "../data/rudiments";
import { installWebAudioMock, uninstallWebAudioMock } from "../test/webAudioMock";

describe("RudimentAudioEngine", () => {
  let audioEngine: AudioEngine;
  let rudimentEngine: RudimentAudioEngine;

  beforeEach(() => {
    installWebAudioMock();
    audioEngine = new AudioEngine();
    rudimentEngine = new RudimentAudioEngine(audioEngine);
  });

  afterEach(() => {
    rudimentEngine.dispose();
    audioEngine.dispose();
    uninstallWebAudioMock();
  });

  it("loads and starts single paradiddle with count-in", async () => {
    const paradiddle = getRudimentById("pas-16");
    expect(paradiddle).toBeDefined();

    const stepsReceived: any[] = [];
    rudimentEngine.onStep((step) => {
      stepsReceived.push(step);
    });

    await rudimentEngine.start(paradiddle!, 100, "LISTEN", 1);
    expect(rudimentEngine.running).toBe(true);
    expect(rudimentEngine.currentMode).toBe("LISTEN");

    rudimentEngine.stop();
    expect(rudimentEngine.running).toBe(false);
  });

  it("supports mode switching between LISTEN, METRONOME_AND_RUDIMENT, and PRACTICE", async () => {
    const roll = getRudimentById("pas-01");
    await rudimentEngine.start(roll!, 90, "LISTEN", 0);
    expect(rudimentEngine.currentMode).toBe("LISTEN");

    rudimentEngine.setMode("METRONOME_AND_RUDIMENT");
    expect(rudimentEngine.currentMode).toBe("METRONOME_AND_RUDIMENT");

    rudimentEngine.setMode("PRACTICE");
    expect(rudimentEngine.currentMode).toBe("PRACTICE");

    rudimentEngine.stop();
  });

  it("supports live tempo changes with setBpm", async () => {
    const flam = getRudimentById("pas-20");
    await rudimentEngine.start(flam!, 60, "LISTEN", 0);

    rudimentEngine.setBpm(120);
    expect(rudimentEngine.running).toBe(true);

    rudimentEngine.stop();
  });

  it("contains all 40 PAS rudiments in the dataset", () => {
    expect(PAS_RUDIMENTS.length).toBe(40);

    // Verify categories
    const rolls = PAS_RUDIMENTS.filter((r) => r.category === "ROLL");
    const paradiddles = PAS_RUDIMENTS.filter((r) => r.category === "PARADIDDLE");
    const flams = PAS_RUDIMENTS.filter((r) => r.category === "FLAM");
    const drags = PAS_RUDIMENTS.filter((r) => r.category === "DRAG");

    expect(rolls.length).toBe(15);
    expect(paradiddles.length).toBe(4);
    expect(flams.length).toBe(11);
    expect(drags.length).toBe(10);
  });

  it("every rudiment has valid stroke structure and BPM bounds", () => {
    for (const r of PAS_RUDIMENTS) {
      expect(r.strokes.length).toBeGreaterThan(0);
      expect(r.minBpm).toBeGreaterThanOrEqual(40);
      expect(r.maxBpm).toBeLessThanOrEqual(200);
      expect(r.defaultBpm).toBeGreaterThanOrEqual(r.minBpm);
      expect(r.defaultBpm).toBeLessThanOrEqual(r.maxBpm);
      expect(r.description.length).toBeGreaterThan(10);
      expect(r.evennessTip.length).toBeGreaterThan(5);
      expect(r.kitApplication.length).toBeGreaterThan(5);
    }
  });
});
