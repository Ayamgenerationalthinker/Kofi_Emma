import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireLocalUser } from "../lib/singleUser.js";
import { getReminderSettings, updateReminderSettings } from "../services/notificationService.js";

export const settingsRouter = Router();

settingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const user = await requireLocalUser();
    const [settings, reminderSettings, calendarSettings] = await Promise.all([
      prisma.userSettings.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} }),
      getReminderSettings(user.id),
      prisma.calendarSettings.upsert({
        where: { userId: user.id },
        create: { userId: user.id, timezone: user.timezone },
        update: {},
      }),
    ]);
    res.json({ user, settings, reminderSettings, calendarSettings });
  })
);

const UpdateSettingsSchema = z.object({
  preferredDurationMinutes: z.number().int().min(10).max(180).optional(),
  defaultBpmIncrease: z.number().int().min(1).max(20).optional(),
  accuracyThreshold: z.number().int().min(0).max(100).optional(),
  metronomeVolume: z.number().int().min(0).max(100).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

const UpdateReminderSchema = z.object({
  notificationsOn: z.boolean().optional(),
  morningOn: z.boolean().optional(),
  eveningOn: z.boolean().optional(),
  morningTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  eveningTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

settingsRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireLocalUser();
    const body = z
      .object({
        settings: UpdateSettingsSchema.optional(),
        reminderSettings: UpdateReminderSchema.optional(),
      })
      .parse(req.body);

    const [settings, reminderSettings] = await Promise.all([
      body.settings
        ? prisma.userSettings.upsert({
            where: { userId: user.id },
            create: { userId: user.id, ...body.settings },
            update: body.settings,
          })
        : prisma.userSettings.findUnique({ where: { userId: user.id } }),
      body.reminderSettings ? updateReminderSettings(user.id, body.reminderSettings) : getReminderSettings(user.id),
    ]);

    res.json({ settings, reminderSettings });
  })
);
