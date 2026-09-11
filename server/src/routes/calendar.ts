import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireLocalUser } from "../lib/singleUser.js";
import { generateTodayLesson } from "../services/practicePlannerService.js";
import { buildTodayIcs, buildRecurringPracticeIcs } from "../services/calendarService.js";
import { getReminderSettings } from "../services/notificationService.js";
import { todayKey } from "../lib/dates.js";

export const calendarRouter = Router();

calendarRouter.get(
  "/today.ics",
  asyncHandler(async (_req, res) => {
    const user = await requireLocalUser();
    const lesson = await generateTodayLesson(user.id, user.timezone);
    const ics = buildTodayIcs({ dateKey: todayKey(user.timezone), timeZone: user.timezone, lesson });
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="gospel-drum-coach-today.ics"');
    res.send(ics);
  })
);

calendarRouter.get(
  "/practice.ics",
  asyncHandler(async (_req, res) => {
    const user = await requireLocalUser();
    const reminders = await getReminderSettings(user.id);
    const ics = buildRecurringPracticeIcs({
      timeZone: user.timezone,
      morningTime: reminders.morningTime,
      eveningTime: reminders.eveningTime,
      morningOn: reminders.morningOn,
      eveningOn: reminders.eveningOn,
      startDateKey: todayKey(user.timezone),
    });
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="gospel-drum-coach-practice.ics"');
    res.send(ics);
  })
);
