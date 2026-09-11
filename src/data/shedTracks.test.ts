import { describe, expect, it } from "vitest";
import { SHED_TRACKS, TRACK_GENRES, STEM_NAMES, getTrack } from "./shedTracks";

describe("shedTracks data model", () => {
  it("has no duplicate track ids", () => {
    const ids = SHED_TRACKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every track uses a supported genre", () => {
    for (const track of SHED_TRACKS) {
      expect(TRACK_GENRES).toContain(track.genre);
    }
  });

  it("every track's stems, when present, are a subset of the supported stem names", () => {
    for (const track of SHED_TRACKS) {
      if (!track.stems) continue;
      for (const stemName of Object.keys(track.stems)) {
        expect(STEM_NAMES).toContain(stemName);
      }
    }
  });

  it("every track's loopable region names are a subset of its own sections", () => {
    for (const track of SHED_TRACKS) {
      const sectionNames = new Set(track.sections.map((s) => s.name));
      for (const loopName of track.loopableRegionNames) {
        expect(sectionNames.has(loopName)).toBe(true);
      }
    }
  });

  it("every track's sections have non-negative, increasing start/end times", () => {
    for (const track of SHED_TRACKS) {
      for (const section of track.sections) {
        expect(section.startSeconds).toBeGreaterThanOrEqual(0);
        expect(section.endSeconds).toBeGreaterThan(section.startSeconds);
      }
    }
  });

  it("exactly one track is the architecture demo, and it is clearly labeled as synthetic", () => {
    const demoTracks = SHED_TRACKS.filter((t) => t.isArchitectureDemo);
    expect(demoTracks).toHaveLength(1);
    expect(demoTracks[0].title.toLowerCase()).toContain("demo");
    expect(demoTracks[0].audioUrl).toBeNull();
  });

  it("no track fabricates an audioUrl or stems — every non-demo track is null until real audio is added", () => {
    for (const track of SHED_TRACKS) {
      if (track.isArchitectureDemo) continue;
      // These are placeholder entries today; this test exists to catch the
      // day someone "fills in" a fake URL instead of sourcing real audio
      // per docs/SHED_TRACKS_ASSETS.md.
      if (track.audioUrl === null) {
        expect(track.stems).toBeNull();
      } else {
        expect(track.audioUrl.startsWith("/audio/shed-tracks/")).toBe(true);
      }
    }
  });

  it("getTrack resolves a known id and returns undefined for an unknown one", () => {
    expect(getTrack("architecture-demo")?.isArchitectureDemo).toBe(true);
    expect(getTrack("not-a-real-track-id")).toBeUndefined();
  });

  it("difficulty is within the documented 1-5 range", () => {
    for (const track of SHED_TRACKS) {
      expect(track.difficulty).toBeGreaterThanOrEqual(1);
      expect(track.difficulty).toBeLessThanOrEqual(5);
    }
  });
});
