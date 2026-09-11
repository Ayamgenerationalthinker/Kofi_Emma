import { Download, CalendarDays } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { LoadingState, ErrorState } from "../components/StatusStates";
import { downloadFile } from "../lib/apiClient";
import type { ReminderSettings } from "../lib/types";

// Section 29: ICS export without depending on any external calendar API —
// the files are just downloaded and imported into whatever calendar app the
// drummer already uses.
export function CalendarPage() {
  const { data, loading, error, refetch } = useFetch<{ reminderSettings: ReminderSettings }>("/settings");

  if (loading) return <LoadingState label="Loading calendar settings..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const reminders = data?.reminderSettings;

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
          onClick={() => downloadFile("/calendar/today.ics", "gospel-drum-coach-today.ics")}
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
              {reminders ? ` (${reminders.morningOn ? reminders.morningTime : ""}${reminders.morningOn && reminders.eveningOn ? " and " : ""}${reminders.eveningOn ? reminders.eveningTime : ""})` : ""}.
              Adjust the times in Settings.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => downloadFile("/calendar/practice.ics", "gospel-drum-coach-practice.ics")}
          className="flex items-center gap-2 rounded-md bg-gold-500 px-4 py-2 font-semibold text-charcoal-950 hover:bg-gold-400"
        >
          <Download className="h-4 w-4" /> Download practice.ics
        </button>
      </div>
    </div>
  );
}
