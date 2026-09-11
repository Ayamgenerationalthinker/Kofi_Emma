// Section 63/64: the app defaults to Africa/Accra but is timezone-aware
// throughout — every "what day is it" calculation goes through here so a
// single change of the user's stored timezone is enough to relocate them.

export function localDateKey(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // YYYY-MM-DD
}

/** Returns a Date representing UTC midnight of the given local calendar day, used as a stable storage key. */
export function localDateKeyToUtcMidnight(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
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
  const d = localDateKeyToUtcMidnight(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
