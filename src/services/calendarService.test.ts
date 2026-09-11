import { describe, it, expect } from "vitest";
import { buildTodayIcs, buildRecurringPracticeIcs } from "./calendarService";
import type { DailyLesson } from "../lib/types";

const lesson: DailyLesson = {
  date: "2026-01-15",
  totalMinutes: 55,
  phaseTitle: "The Foundation & Highlife Pocket",
  wasRecoverySession: false,
  coachMessage: "Today's lesson is ready.",
  lessonParts: [
    {
      part: 1,
      title: "Rudiment Isolation & Technique",
      duration: 10,
      exerciseId: "P1-E01",
      exerciseName: "Single Stroke Control",
      instructions: "Play slowly and cleanly.",
      sticking: "R L R L",
      targetBpm: 80,
      category: "TECHNIQUE",
    },
  ],
};

describe("calendarService", () => {
  it("produces a valid RFC 5545 VCALENDAR with a VEVENT and VALARM for today's lesson", () => {
    const ics = buildTodayIcs({ dateKey: "2026-01-15", timeZone: "Africa/Accra", lesson });

    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("VERSION:2.0\r\n");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("END:VALARM");
    expect(ics.trim().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/);
    expect(ics).toContain("SUMMARY:Gospel Drum Coach — Daily Practice");
  });

  it("builds recurring daily morning and evening reminder events with RRULE", () => {
    const ics = buildRecurringPracticeIcs({
      timeZone: "Africa/Accra",
      morningTime: "07:00",
      eveningTime: "19:00",
      morningOn: true,
      eveningOn: true,
      startDateKey: "2026-01-15",
    });

    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(2);
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toContain("Morning Practice");
    expect(ics).toContain("Evening Practice");
  });

  it("omits the evening event when the evening reminder is disabled", () => {
    const ics = buildRecurringPracticeIcs({
      timeZone: "Africa/Accra",
      morningTime: "07:00",
      eveningTime: "19:00",
      morningOn: true,
      eveningOn: false,
      startDateKey: "2026-01-15",
    });
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(1);
    expect(ics).not.toContain("Evening Practice");
  });

  it("respects Africa/Accra having no DST offset (07:00 local stays 07:00Z)", () => {
    const ics = buildTodayIcs({ dateKey: "2026-06-15", timeZone: "Africa/Accra", lesson });
    expect(ics).toContain("DTSTART:20260615T070000Z");
  });
});
