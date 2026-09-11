import { v4 as uuid } from "uuid";
import type { DailyLessonDto } from "./practicePlannerService.js";

// Section 29/62/63: hand-built RFC 5545 iCalendar output. No external
// calendar API is required — the file is just downloaded and imported.

function zonedTimeToUtc(dateKey: string, time: string, timeZone: string): Date {
  const naiveUtc = new Date(`${dateKey}T${time}:00.000Z`);
  const tzString = naiveUtc.toLocaleString("en-US", { timeZone });
  const utcString = naiveUtc.toLocaleString("en-US", { timeZone: "UTC" });
  const offsetMs = new Date(utcString).getTime() - new Date(tzString).getTime();
  return new Date(naiveUtc.getTime() + offsetMs);
}

function formatIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  // RFC 5545 requires lines to be folded at 75 octets.
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}

function buildEvent(params: {
  uidSeed: string;
  start: Date;
  durationMinutes: number;
  summary: string;
  description: string;
  rrule?: string;
}): string {
  const now = formatIcsUtc(new Date());
  const end = new Date(params.start.getTime() + params.durationMinutes * 60000);
  const lines = [
    "BEGIN:VEVENT",
    `UID:${params.uidSeed}@gospel-drum-coach.local`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatIcsUtc(params.start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    ...(params.rrule ? [params.rrule] : []),
    `SUMMARY:${escapeIcsText(params.summary)}`,
    `DESCRIPTION:${escapeIcsText(params.description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(params.summary)}`,
    "TRIGGER:-PT0M",
    "END:VALARM",
    "END:VEVENT",
  ];
  return lines.map(foldLine).join("\r\n");
}

function wrapCalendar(events: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gospel Drum Coach//The Kofi Emma Method//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

export function buildTodayIcs(params: { dateKey: string; timeZone: string; lesson: DailyLessonDto }): string {
  const { dateKey, timeZone, lesson } = params;
  const start = zonedTimeToUtc(dateKey, "07:00", timeZone);
  const partsSummary = lesson.lessonParts
    .map((p) => `Part ${p.part} (${p.duration} min): ${p.title} — ${p.exerciseName} @ ${p.targetBpm} BPM`)
    .join("\n");
  const description = `Phase: ${lesson.phaseTitle}\nTotal duration: ${lesson.totalMinutes} minutes\n\n${partsSummary}`;

  const event = buildEvent({
    uidSeed: `today-${dateKey}-${uuid()}`,
    start,
    durationMinutes: lesson.totalMinutes,
    summary: "Gospel Drum Coach — Daily Practice",
    description,
  });

  return wrapCalendar([event]);
}

export function buildRecurringPracticeIcs(params: {
  timeZone: string;
  morningTime: string;
  eveningTime: string;
  morningOn: boolean;
  eveningOn: boolean;
  startDateKey: string;
}): string {
  const { timeZone, morningTime, eveningTime, morningOn, eveningOn, startDateKey } = params;
  const events: string[] = [];

  if (morningOn) {
    events.push(
      buildEvent({
        uidSeed: "recurring-morning",
        start: zonedTimeToUtc(startDateKey, morningTime, timeZone),
        durationMinutes: 55,
        summary: "Gospel Drum Coach — Morning Practice",
        description: "Your 55-minute drum session is ready. Clean first. Fast later.",
        rrule: "RRULE:FREQ=DAILY",
      })
    );
  }

  if (eveningOn) {
    events.push(
      buildEvent({
        uidSeed: "recurring-evening",
        start: zonedTimeToUtc(startDateKey, eveningTime, timeZone),
        durationMinutes: 55,
        summary: "Gospel Drum Coach — Evening Practice",
        description: "Keep your consistency. Today's session is waiting.",
        rrule: "RRULE:FREQ=DAILY",
      })
    );
  }

  return wrapCalendar(events);
}
