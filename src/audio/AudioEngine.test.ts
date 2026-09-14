import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AudioEngine } from "./AudioEngine";
import { installWebAudioMock, uninstallWebAudioMock } from "../test/webAudioMock";

describe("AudioEngine Sound Palette", () => {
  let engine: AudioEngine;

  beforeEach(() => {
    installWebAudioMock();
    engine = new AudioEngine();
  });

  afterEach(() => {
    engine.dispose();
    uninstallWebAudioMock();
  });

  it("initializes AudioContext and masterGain without errors", () => {
    expect(engine.currentTime).toBeDefined();
  });

  it("can resume AudioContext state", async () => {
    await expect(engine.resume()).resolves.toBeUndefined();
  });

  it("changes volume between 0 and 100", () => {
    expect(() => engine.setVolume(50)).not.toThrow();
    expect(() => engine.setVolume(120)).not.toThrow();
    expect(() => engine.setVolume(-10)).not.toThrow();
  });

  it("plays all metronome click accents", () => {
    const t = engine.currentTime;
    expect(() => engine.playClick(t, "PRIMARY")).not.toThrow();
    expect(() => engine.playClick(t + 0.1, "SECONDARY")).not.toThrow();
    expect(() => engine.playClick(t + 0.2, "SOFT")).not.toThrow();
  });

  it("plays bass drum (kick)", () => {
    const t = engine.currentTime;
    expect(() => engine.playKick(t, 0.9)).not.toThrow();
  });

  it("plays snare variations (tap, accent, grace, diddle)", () => {
    const t = engine.currentTime;
    expect(() => engine.playSnare(t, 0.8, false)).not.toThrow();
    expect(() => engine.playSnare(t + 0.1, 0.9, true)).not.toThrow();
    expect(() => engine.playSnareTap(t + 0.2)).not.toThrow();
    expect(() => engine.playAccentStroke(t + 0.3)).not.toThrow();
    expect(() => engine.playGraceNote(t + 0.4)).not.toThrow();
    expect(() => engine.playSnareDiddle(t + 0.5)).not.toThrow();
  });

  it("plays cross-stick / rimshot", () => {
    const t = engine.currentTime;
    expect(() => engine.playRim(t)).not.toThrow();
  });

  it("plays closed and open hi-hats", () => {
    const t = engine.currentTime;
    expect(() => engine.playClosedHiHat(t)).not.toThrow();
    expect(() => engine.playOpenHiHat(t + 0.1)).not.toThrow();
    expect(() => engine.playHiHat(t + 0.2, true)).not.toThrow();
  });

  it("plays crash and ride cymbals", () => {
    const t = engine.currentTime;
    expect(() => engine.playCrash(t)).not.toThrow();
    expect(() => engine.playRide(t + 0.1)).not.toThrow();
  });

  it("plays low, mid, and high toms", () => {
    const t = engine.currentTime;
    expect(() => engine.playTom(t, "low")).not.toThrow();
    expect(() => engine.playTom(t + 0.1, "mid")).not.toThrow();
    expect(() => engine.playTom(t + 0.2, "high")).not.toThrow();
  });

  it("plays handclap", () => {
    const t = engine.currentTime;
    expect(() => engine.playClap(t)).not.toThrow();
  });
});
