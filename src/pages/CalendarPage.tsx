import { useEffect } from "react";
import { Download, CalendarDays } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getReminderSettings } from "../services/settingsService";
import { generateTodayLesson, readTodayLesson } from "../services/practicePlannerService";
import { buildTodayIcs, buildRecurringPracticeIcs, downloadTextFile } from "../services/calendarService";
import { todayKey } from "../lib/dates";

// ICS export without depending on any external calendar API — the files
// are generated in the browser and downloaded directly.
export function CalendarPage() {
  const { user } = useAppContext();
  const timezone = user!.timezone;

  useEffect(() => {
    generateTodayLesson(timezone);
  }, [timezone]);

  useLocalDbVersion();
  const reminders = getReminderSettings();
  const lesson = readTodayLesson(timezone);

  function downloadToday() {
    if (!lesson) return;
    const ics = buildTodayIcs({ dateKey: todayKey(timezone), timeZone: timezone, lesson });
    downloadTextFile("abele-drums-coach-today.ics", ics);
  }

  function downloadRecurring() {
    const ics = buildRecurringPracticeIcs({
      timeZone: timezone,
      morningTime: reminders.morningTime,
      eveningTime: reminders.eveningTime,
      morningOn: reminders.morningOn,
      eveningOn: reminders.eveningOn,
      startDateKey: todayKey(timezone),
    });
    downloadTextFile("abele-drums-coach-practice.ics", ics);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Calendar</h1>
      <p className="text-parchment/60">
        Export your practice schedule as a standard .ics file you can import into any calendar app.
      </p>

      <div className="space-y-4 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-5">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 text-gold-400" />
          <div>
            <p className="font-bold">Today's Practice</p>
            <p className="text-sm text-parchment/60">A single calendar event for today's 55-minute session, with the full lesson plan in the description.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={downloadToday}
          className="flex items-center gap-2 rounded-md bg-gold-500 px-4 py-2 font-semibold text-charcoal-950 hover:bg-gold-400"
        >
          <Download className="h-4 w-4" /> Download today.ics
        </button>
      </div>

      <div className="space-y-4 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-5">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 text-gold-400" />
          <div>
            <p className="font-bold">Recurring Practice Reminders</p>
            <p className="text-sm text-parchment/60">
              Daily recurring events at your reminder times
              {` (${reminders.morningOn ? reminders.morningTime : ""}${reminders.morningOn && reminders.eveningOn ? " and " : ""}${reminders.eveningOn ? reminders.eveningTime : ""})`}
              . Adjust the times in Settings.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={downloadRecurring}
          className="flex items-center gap-2 rounded-md bg-gold-500 px-4 py-2 font-semibold text-charcoal-950 hover:bg-gold-400"
        >
          <Download className="h-4 w-4" /> Download practice.ics
        </button>
      </div>
    </div>
  );
}
