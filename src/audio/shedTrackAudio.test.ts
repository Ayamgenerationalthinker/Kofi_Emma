import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadShedTrackVoices } from "./shedTrackAudio";
import { getTrack, SHED_TRACKS, STEM_NAMES } from "../data/shedTracks";
import { installWebAudioMock, MockAudioContext, uninstallWebAudioMock } from "../test/webAudioMock";

describe("loadShedTrackVoices", () => {
  beforeEach(() => installWebAudioMock());
  afterEach(() => uninstallWebAudioMock());

  it("synthesizes six named voices for the architecture demo track, matching the six supported stems", async () => {
    const track = getTrack("architecture-demo")!;
    const ctx = new MockAudioContext();
    const voices = await loadShedTrackVoices(track, ctx as unknown as BaseAudioContext);
    expect(voices).not.toBeNull();
    expect(Object.keys(voices!).sort()).toEqual([...STEM_NAMES].sort());
  });

  it("resolves to null for a placeholder track with no production audio — no fabricated audio is ever returned", async () => {
    const placeholder = SHED_TRACKS.find((t) => !t.isArchitectureDemo && !t.audioUrl && !t.stems)!;
    expect(placeholder).toBeDefined();
    const ctx = new MockAudioContext();
    const voices = await loadShedTrackVoices(placeholder, ctx as unknown as BaseAudioContext);
    expect(voices).toBeNull();
  });
});
