import { useEffect } from "react";
import { msUntilNextOccurrence, showNotification, NOTIFICATION_COPY } from "../lib/notifications";
import type { ReminderSettings } from "../lib/types";

// Section 30: foreground-only local scheduling. This is an honest
// implementation of what a browser tab can actually guarantee — there is no
// reliable way for a closed tab to fire a notification at an exact time
// without a push subscription and a server, which is out of scope for a
// local-first MVP. The Settings page states this constraint explicitly.
export function useNotificationScheduler(settings: ReminderSettings | null) {
  useEffect(() => {
    if (!settings || !settings.notificationsOn) return;

    const timers: number[] = [];

    function schedule(time: string, title: string, body: string) {
      const delay = msUntilNextOccurrence(time);
      const id = window.setTimeout(function fire() {
        showNotification(title, body);
        const nextId = window.setTimeout(fire, 24 * 60 * 60 * 1000);
        timers.push(nextId);
      }, delay);
      timers.push(id);
    }

    if (settings.morningOn) {
      schedule(settings.morningTime, NOTIFICATION_COPY.morning.title, NOTIFICATION_COPY.morning.body);
    }
    if (settings.eveningOn) {
      schedule(settings.eveningTime, NOTIFICATION_COPY.evening.title, NOTIFICATION_COPY.evening.body);
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [settings]);
}
