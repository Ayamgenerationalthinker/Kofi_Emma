import { describe, it, expect } from "vitest";
import { HANDBOOK_TOPICS, HANDBOOK_CATEGORIES } from "./topics";

describe("HANDBOOK_TOPICS", () => {
  it("has a healthy number of topics with unique ids", () => {
    expect(HANDBOOK_TOPICS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(HANDBOOK_TOPICS.map((t) => t.id)).size).toBe(HANDBOOK_TOPICS.length);
  });

  it("every topic has real, non-empty content in every section", () => {
    for (const topic of HANDBOOK_TOPICS) {
      expect(topic.title).toBeTruthy();
      expect(topic.summary).toBeTruthy();
      expect(topic.sections.length).toBeGreaterThan(0);
      for (const section of topic.sections) {
        expect(section.heading).toBeTruthy();
        expect(section.body.length).toBeGreaterThan(20);
      }
    }
  });

  it("every topic's category is a defined HANDBOOK_CATEGORIES value", () => {
    for (const topic of HANDBOOK_TOPICS) {
      expect(HANDBOOK_CATEGORIES).toContain(topic.category);
    }
  });
});
