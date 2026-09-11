// Section 30/65: notification copy, mirrored from the server's
// notificationService.ts so the same text is used whether it originates
// from a live Notification call or from the ICS description.

export const NOTIFICATION_COPY = {
  morning: {
    title: "Abele Drums Coach — Morning Shed",
    body: "Your 55-minute drum session is ready.",
  },
  evening: {
    title: "Abele Drums Coach — Evening Shed",
    body: "Keep your consistency. Today's session is waiting.",
  },
};

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

export function showNotification(title: string, body: string): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/icons/icon.svg" });
}

/** Milliseconds until the next occurrence of `HH:MM` local time (today if still ahead, otherwise tomorrow). */
export function msUntilNextOccurrence(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}
