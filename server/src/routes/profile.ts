import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getLocalUser, requireLocalUser } from "../lib/singleUser.js";
import { ensureProgressInitialized } from "../services/curriculumService.js";
import { Errors } from "../lib/errors.js";

export const profileRouter = Router();

const OnboardingSchema = z.object({
  name: z.string().min(1).max(80),
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  timezone: z.string().min(1).default("Africa/Accra"),
  morningOn: z.boolean().default(true),
  eveningOn: z.boolean().default(true),
  morningTime: z.string().regex(/^\d{2}:\d{2}$/).default("07:00"),
  eveningTime: z.string().regex(/^\d{2}:\d{2}$/).default("19:00"),
});

// GET /api/profile — 404 (not an error state, a first-run signal) if onboarding hasn't happened yet.
profileRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const user = await getLocalUser();
    if (!user) {
      res.status(404).json({ error: { code: "NO_USER", message: "No local profile exists yet." } });
      return;
    }
    res.json({ user });
  })
);

// POST /api/profile — first-run onboarding (section 59). Creates the single local user
// and seeds their settings rows so every later GET can assume they exist.
profileRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const existing = await getLocalUser();
    if (existing) throw Errors.conflict("A local profile already exists.");

    const input = OnboardingSchema.parse(req.body);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: input.name,
          experienceLevel: input.experienceLevel,
          timezone: input.timezone,
          onboardedAt: new Date(),
        },
      });
      await tx.userSettings.create({ data: { userId: created.id } });
      await tx.reminderSettings.create({
        data: {
          userId: created.id,
          morningOn: input.morningOn,
          eveningOn: input.eveningOn,
          morningTime: input.morningTime,
          eveningTime: input.eveningTime,
        },
      });
      await tx.calendarSettings.create({ data: { userId: created.id, timezone: input.timezone } });
      return created;
    });

    await ensureProgressInitialized(user.id);

    res.status(201).json({ user });
  })
);

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  timezone: z.string().min(1).optional(),
});

profileRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireLocalUser();
    const input = UpdateProfileSchema.parse(req.body);
    const updated = await prisma.user.update({ where: { id: user.id }, data: input });
    res.json({ user: updated });
  })
);
