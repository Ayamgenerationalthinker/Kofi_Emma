import type { DailyLesson } from "../lib/types";

// RFC 5545 iCalendar standard implementation and Google Calendar URL builder.
// No external calendar API/OAuth is required. Events are generated in the browser
// and downloaded directly as .ics or opened in Google Calendar.

export interface PracticeScheduleOptions {
  timeZone: string;
  time: string; // "HH:MM" e.g. "18:00"
  durationMinutes: number; // e.g. 30, 45, 60
  days: ("MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU")[];
  reminderMinutesBefore: number; // 0, 5, 10, 15, 30, 60
  title?: string;
  focusArea?: string;
  targetBpm?: number;
}

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

function formatCompactUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
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
  reminderMinutes?: number;
}): string {
  const now = formatIcsUtc(new Date());
  const end = new Date(params.start.getTime() + params.durationMinutes * 60000);
  const reminderMinutes = params.reminderMinutes ?? 10;

  const lines = [
    "BEGIN:VEVENT",
    `UID:${params.uidSeed}@abeledrumscoach.local`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatIcsUtc(params.start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    ...(params.rrule ? [params.rrule] : []),
    `SUMMARY:${escapeIcsText(params.summary)}`,
    `DESCRIPTION:${escapeIcsText(params.description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(params.summary)}`,
    `TRIGGER:-PT${reminderMinutes}M`,
    "END:VALARM",
    "END:VEVENT",
  ];
  return lines.map(foldLine).join("\r\n");
}

function wrapCalendar(events: string[]): string {
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Abele Drums Coach//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n") + "\r\n"
  );
}

function randomSeed(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export function buildTodayIcs(params: { dateKey: string; timeZone: string; lesson: DailyLesson }): string {
  const { dateKey, timeZone, lesson } = params;
  const start = zonedTimeToUtc(dateKey, "07:00", timeZone);
  const partsSummary = lesson.lessonParts
    .map((p) => `Part ${p.part} (${p.duration} min): ${p.title} — ${p.exerciseName} @ ${p.targetBpm} BPM`)
    .join("\n");
  const description = `Level: ${lesson.phaseTitle}\nTotal duration: ${lesson.totalMinutes} minutes\n\n${partsSummary}\n\nOpen Abele Drums Coach to begin.`;

  const event = buildEvent({
    uidSeed: `today-${dateKey}-${randomSeed()}`,
    start,
    durationMinutes: lesson.totalMinutes,
    summary: "Abele Drums Coach — Today's Shed",
    description,
    reminderMinutes: 10,
  });

  return wrapCalendar([event]);
}

/** Builds an RFC 5545 valid recurring schedule iCalendar string with weekly byday recurrence and alarm */
export function buildCustomScheduleIcs(options: PracticeScheduleOptions): string {
  const today = new Date();
  const dateKey = today.toISOString().split("T")[0];
  const start = zonedTimeToUtc(dateKey, options.time, options.timeZone);

  const byDayRule = options.days.length > 0 ? `RRULE:FREQ=WEEKLY;BYDAY=${options.days.join(",")}` : "RRULE:FREQ=DAILY";
  const workoutPlan = [
    "ABELE DRUMS COACH — Practice Workout",
    `Focus: ${options.focusArea ?? "Rudiments & Gospel Foundations"}`,
    `Duration: ${options.durationMinutes} minutes`,
    options.targetBpm ? `Target Tempo: ${options.targetBpm} BPM` : "",
    "",
    "Workout Breakdown:",
    "• Warm-up & Hand Technique: 5 min",
    "• Timing & Subdivision Control: 5 min",
    `• Core Exercise Practice: ${Math.max(5, options.durationMinutes - 15)} min`,
    "• Clean Tempo Push / Challenge: 5 min",
    "",
    "Open Abele Drums Coach to track your clean BPM and streak.",
  ]
    .filter(Boolean)
    .join("\n");

  const event = buildEvent({
    uidSeed: `schedule-${randomSeed()}`,
    start,
    durationMinutes: options.durationMinutes,
    summary: options.title ?? "Abele Drums Coach — Practice Shed",
    description: workoutPlan,
    rrule: byDayRule,
    reminderMinutes: options.reminderMinutesBefore,
  });

  return wrapCalendar([event]);
}

/** Generates a pre-filled Google Calendar web URL that opens directly in the user's browser */
export function buildGoogleCalendarUrl(options: PracticeScheduleOptions): string {
  const today = new Date();
  const dateKey = today.toISOString().split("T")[0];
  const start = zonedTimeToUtc(dateKey, options.time, options.timeZone);
  const end = new Date(start.getTime() + options.durationMinutes * 60000);

  const startStr = formatCompactUtc(start);
  const endStr = formatCompactUtc(end);

  const title = encodeURIComponent(options.title ?? "Abele Drums Coach — Practice Shed");
  const details = encodeURIComponent(
    `Abele Drums Coach Practice Workout\nDuration: ${options.durationMinutes} minutes\nFocus: ${options.focusArea ?? "Gospel & Rudiments"}\nOpen Abele Drums Coach to begin.`
  );
  const recurParam = options.days.length > 0 ? `&recur=RRULE:FREQ=WEEKLY;BYDAY=${options.days.join(",")}` : "&recur=RRULE:FREQ=DAILY";

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}${recurParam}`;
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
        durationMinutes: 45,
        summary: "Abele Drums Coach — Morning Shed",
        description: "Your 45-minute drum session is ready. Clean first. Fast later.",
        rrule: "RRULE:FREQ=DAILY",
        reminderMinutes: 10,
      })
    );
  }

  if (eveningOn) {
    events.push(
      buildEvent({
        uidSeed: "recurring-evening",
        start: zonedTimeToUtc(startDateKey, eveningTime, timeZone),
        durationMinutes: 45,
        summary: "Abele Drums Coach — Evening Shed",
        description: "Keep your consistency. Today's practice session is waiting.",
        rrule: "RRULE:FREQ=DAILY",
        reminderMinutes: 10,
      })
    );
  }

  return wrapCalendar(events);
}

/** Triggers a browser download of the given text content — no server involved. */
export function downloadTextFile(filename: string, content: string, mimeType = "text/calendar;charset=utf-8"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
