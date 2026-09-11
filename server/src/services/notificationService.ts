import { prisma } from "../db.js";

// Section 30/65: actual delivery happens client-side via the browser
// Notification API (the server cannot push to a closed browser tab), so
// this service owns only the reminder schedule/preferences and the copy
// the client displays — the single source of truth for both.

export const NOTIFICATION_COPY = {
  morning: {
    title: "Gospel Drum Coach — Morning Practice",
    body: "Your 55-minute drum session is ready.",
  },
  evening: {
    title: "Gospel Drum Coach — Evening Practice",
    body: "Keep your consistency. Today's session is waiting.",
  },
};

export async function getReminderSettings(userId: string) {
  const existing = await prisma.reminderSettings.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.reminderSettings.create({ data: { userId } });
}

export async function updateReminderSettings(
  userId: string,
  data: Partial<{
    notificationsOn: boolean;
    morningOn: boolean;
    eveningOn: boolean;
    morningTime: string;
    eveningTime: string;
  }>
) {
  await getReminderSettings(userId);
  return prisma.reminderSettings.update({ where: { userId }, data });
}
