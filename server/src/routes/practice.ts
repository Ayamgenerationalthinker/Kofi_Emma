import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireLocalUser } from "../lib/singleUser.js";
import { generateTodayLesson } from "../services/practicePlannerService.js";
import { recordAttempt } from "../services/performanceAnalysisService.js";
import { PracticeSessionStatus } from "../domain/types.js";
import { todayKey, localDateKeyToUtcMidnight } from "../lib/dates.js";
import { Errors } from "../lib/errors.js";

export const practiceRouter = Router();

practiceRouter.get(
  "/today",
  asyncHandler(async (_req, res) => {
    const user = await requireLocalUser();
    const lesson = await generateTodayLesson(user.id, user.timezone);
    res.json(lesson);
  })
);

// POST /api/practice/session — starts (or resumes) today's already-planned session.
practiceRouter.post(
  "/session",
  asyncHandler(async (_req, res) => {
    const user = await requireLocalUser();
    await generateTodayLesson(user.id, user.timezone); // ensures today's PracticeSession row exists
    const dateKey = todayKey(user.timezone);
    const existing = await prisma.practiceSession.findFirst({
      where: { userId: user.id, date: localDateKeyToUtcMidnight(dateKey) },
    });
    if (!existing) throw Errors.notFound("Today's practice session");

    const session = await prisma.practiceSession.update({
      where: { id: existing.id },
      data: { status: PracticeSessionStatus.IN_PROGRESS, startedAt: existing.startedAt ?? new Date() },
    });
    res.json({ session });
  })
);

const CompleteSessionSchema = z.object({
  totalMinutes: z.number().int().min(1).max(180).optional(),
});

practiceRouter.patch(
  "/session/:id/complete",
  asyncHandler(async (req, res) => {
    const user = await requireLocalUser();
    const input = CompleteSessionSchema.parse(req.body ?? {});
    const session = await prisma.practiceSession.findUnique({ where: { id: req.params.id } });
    if (!session || session.userId !== user.id) throw Errors.notFound("Practice session");

    const updated = await prisma.practiceSession.update({
      where: { id: session.id },
      data: {
        status: PracticeSessionStatus.COMPLETED,
        completedAt: new Date(),
        ...(input.totalMinutes ? { totalMinutes: input.totalMinutes } : {}),
      },
    });
    res.json({ session: updated });
  })
);

practiceRouter.get(
  "/history",
  asyncHandler(async (req, res) => {
    const user = await requireLocalUser();
    const limit = Math.min(200, Number(req.query.limit ?? 50));
    const sessions = await prisma.practiceSession.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: limit,
      include: { attempts: { include: { exercise: { select: { name: true } } } } },
    });
    res.json({ sessions });
  })
);

const AttemptSchema = z.object({
  clientAttemptId: z.string().min(1),
  exerciseId: z.string().min(1),
  sessionId: z.string().min(1).nullable().optional(),
  targetBpm: z.number().int().min(1).optional(),
  cleanBpm: z.number().int().min(0),
  maximumBpm: z.number().int().min(0).nullable().optional(),
  accuracy: z.number().int().min(0).max(100),
  durationMinutes: z.number().int().min(0),
  perceivedDifficulty: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

// POST /api/practice/attempt — section 75: rejects attempts against a locked
// exercise with 403 before anything is written (enforced in the service).
practiceRouter.post(
  "/attempt",
  asyncHandler(async (req, res) => {
    const user = await requireLocalUser();
    const input = AttemptSchema.parse(req.body);
    if (input.maximumBpm != null && input.cleanBpm > input.maximumBpm) {
      throw Errors.validation("Clean BPM cannot exceed maximum BPM.");
    }
    const result = await recordAttempt(user.id, input);
    res.status(201).json(result);
  })
);
