import { describe, it, expect } from "vitest";
import { KOFI_EMMA_VIDEOS, VIDEO_CATEGORIES, getVideo } from "./kofiEmmaVideos";

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

// Section 103: every entry must have the required fields, a valid YouTube
// id shape, and no duplicates — including a regression check that the
// user-supplied duplicate URL (KjCoXS_jSEc appeared twice in the source
// list) was collapsed to exactly one entry.
describe("KOFI_EMMA_VIDEOS", () => {
  it("contains exactly 12 unique videos (1 originally verified + 11 user-supplied)", () => {
    expect(KOFI_EMMA_VIDEOS).toHaveLength(12);
  });

  it("every entry has the required fields", () => {
    for (const video of KOFI_EMMA_VIDEOS) {
      expect(video.id, "id").toBeTruthy();
      expect(video.youtubeId, "youtubeId").toBeTruthy();
      expect(video.title, "title").toBeTruthy();
      expect(video.category, "category").toBeTruthy();
      expect(video.focus, "focus").toBeTruthy();
    }
  });

  it("every youtubeId matches the standard 11-character YouTube id shape", () => {
    for (const video of KOFI_EMMA_VIDEOS) {
      expect(video.youtubeId).toMatch(YOUTUBE_ID_PATTERN);
    }
  });

  it("every category is one of the defined VIDEO_CATEGORIES", () => {
    for (const video of KOFI_EMMA_VIDEOS) {
      expect(VIDEO_CATEGORIES).toContain(video.category);
    }
  });

  it("has no duplicate youtubeId (the duplicated KjCoXS_jSEc URL collapses to one entry)", () => {
    const ids = KOFI_EMMA_VIDEOS.map((v) => v.youtubeId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate internal id", () => {
    const ids = KOFI_EMMA_VIDEOS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the originally verified video", () => {
    expect(getVideo("Cd25CPj4Ii4")).toBeDefined();
  });

  it("includes every user-supplied video id from the 2026-09-11 batch", () => {
    const supplied = [
      "Rt_wN-mKM_0",
      "_spxwVq1AJ0",
      "oC1GF0NH0mo",
      "sE7YY710hHg",
      "DnyHzTzXLX8",
      "RmT5TXTnuEA",
      "EFCX6hNj7UQ",
      "peiA9nYmCYg",
      "TwGpS2dc3Is",
      "JRF-CasFL8Y",
      "KjCoXS_jSEc",
    ];
    for (const id of supplied) {
      expect(getVideo(id), `missing supplied video ${id}`).toBeDefined();
    }
  });

  it("marks every fetched (non-spec-provided) title with titleSource 'fetched' for provenance honesty", () => {
    const fetched = KOFI_EMMA_VIDEOS.filter((v) => v.id !== "kofi-emma-hot-praise-groove");
    expect(fetched.every((v) => v.titleSource === "fetched")).toBe(true);
  });
});
