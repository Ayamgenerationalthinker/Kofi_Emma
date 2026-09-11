// Timezone-aware date-key helpers. The app defaults to Africa/Accra but is
// timezone-aware throughout — every "what day is it" calculation goes
// through here so a single change to the stored user timezone is enough to
// relocate the whole app's notion of "today."

export function localDateKey(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // YYYY-MM-DD
}

export function todayKey(timeZone: string): string {
  return localDateKey(new Date(), timeZone);
}

export function yesterdayKey(timeZone: string): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return localDateKey(yesterday, timeZone);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
