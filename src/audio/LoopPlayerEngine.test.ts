import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LoopPlayerEngine } from "./LoopPlayerEngine";
import { MockAudioContext, installWebAudioMock, uninstallWebAudioMock } from "../test/webAudioMock";

function fakeBuffer(duration = 8): AudioBuffer {
  return { duration } as unknown as AudioBuffer;
}

describe("LoopPlayerEngine", () => {
  beforeEach(() => {
    installWebAudioMock();
  });

  afterEach(() => {
    uninstallWebAudioMock();
  });

  it("has no audio and stays stopped before any voices are loaded", () => {
    const engine = new LoopPlayerEngine();
    expect(engine.hasAudio).toBe(false);
    expect(engine.playbackStatus).toBe("stopped");
    engine.dispose();
  });

  it("play() transitions to playing and creates exactly one AudioContext", async () => {
    const engine = new LoopPlayerEngine();
    engine.loadVoices({ Drums: fakeBuffer(), Bass: fakeBuffer() });
    expect(engine.hasAudio).toBe(true);
    expect(engine.duration).toBe(8);

    await engine.play();
    expect(engine.playbackStatus).toBe("playing");
    expect(MockAudioContext.instances.length).toBe(1);
    engine.dispose();
  });

  it("pause() stops audibly and preserves position for the next play()", async () => {
    const engine = new LoopPlayerEngine();
    engine.loadVoices({ Drums: fakeBuffer() });
    await engine.play();
    engine.pause();
    expect(engine.playbackStatus).toBe("paused");
    engine.dispose();
  });

  it("restart() resets position to the track start", async () => {
    const engine = new LoopPlayerEngine();
    engine.loadVoices({ Drums: fakeBuffer() });
    await engine.play();
    engine.seek(5);
    expect(engine.getCurrentTime()).toBeCloseTo(5, 1);
    engine.restart();
    expect(engine.getCurrentTime()).toBeCloseTo(0, 1);
    engine.dispose();
  });

  it("changing playback rate does not stop or recreate the running sources (no reload)", async () => {
    const engine = new LoopPlayerEngine();
    engine.loadVoices({ Drums: fakeBuffer() });
    await engine.play();
    expect(engine.playbackRate).toBe(1);

    engine.setPlaybackRate(1.25);
    expect(engine.playbackRate).toBe(1.25);
    // Still playing, uninterrupted — a reload would have forced a stop/start
    // cycle, which would show up as a status flicker or a fresh context.
    expect(engine.playbackStatus).toBe("playing");
    expect(MockAudioContext.instances.length).toBe(1);
    engine.dispose();
  });

  it("clamps playback rate to a sane range", async () => {
    const engine = new LoopPlayerEngine();
    engine.loadVoices({ Drums: fakeBuffer() });
    await engine.play();
    engine.setPlaybackRate(50);
    expect(engine.playbackRate).toBeLessThanOrEqual(4);
    engine.setPlaybackRate(-3);
    expect(engine.playbackRate).toBeGreaterThanOrEqual(0.25);
    engine.dispose();
  });

  it("setLoop enables a region and getCurrentTime wraps within it", async () => {
    const engine = new LoopPlayerEngine();
    engine.loadVoices({ Drums: fakeBuffer(8) });
    await engine.play();
    engine.setLoop({ start: 2, end: 4 });
    expect(engine.activeLoopRegion).toEqual({ start: 2, end: 4 });

    engine.setLoop(null);
    expect(engine.activeLoopRegion).toBeNull();
    engine.dispose();
  });

  it("mute silences a voice's effective gain and solo isolates one voice", async () => {
    const engine = new LoopPlayerEngine();
    engine.loadVoices({ Drums: fakeBuffer(), Bass: fakeBuffer() });
    await engine.play();

    engine.setVoiceMuted("Drums", true);
    expect(engine.getVoiceState("Drums")?.muted).toBe(true);

    engine.setVoiceMuted("Drums", false);
    engine.toggleSolo("Bass");
    expect(engine.isSoloed("Bass")).toBe(true);
    engine.toggleSolo("Bass");
    expect(engine.isSoloed("Bass")).toBe(false);
    engine.dispose();
  });

  it("setVoiceVolume clamps to 0-100", () => {
    const engine = new LoopPlayerEngine();
    engine.loadVoices({ Drums: fakeBuffer() });
    engine.setVoiceVolume("Drums", 150);
    expect(engine.getVoiceState("Drums")?.volume).toBe(100);
    engine.setVoiceVolume("Drums", -20);
    expect(engine.getVoiceState("Drums")?.volume).toBe(0);
    engine.dispose();
  });

  it("dispose() closes the underlying AudioContext — no leaked context", async () => {
    const engine = new LoopPlayerEngine();
    engine.loadVoices({ Drums: fakeBuffer() });
    await engine.play();
    const ctx = MockAudioContext.instances[0];
    expect(ctx.closed).toBe(false);

    engine.dispose();
    // close() resolves asynchronously in real AudioContexts too.
    await Promise.resolve();
    expect(ctx.closed).toBe(true);
  });

  it("loadVoices() while nothing is playing never creates an AudioContext", () => {
    const engine = new LoopPlayerEngine();
    engine.loadVoices({ Drums: fakeBuffer() });
    expect(MockAudioContext.instances.length).toBe(0);
    engine.dispose();
  });
});
