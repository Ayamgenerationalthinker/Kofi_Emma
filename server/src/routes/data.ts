import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireLocalUser } from "../lib/singleUser.js";
import { exportUserData, importUserData } from "../services/exportImportService.js";
import { ExerciseProgressStatus } from "../domain/types.js";
import { recomputeUnlocks } from "../services/curriculumService.js";

export const dataRouter = Router();

dataRouter.get(
  "/export",
  asyncHandler(async (_req, res) => {
    const user = await requireLocalUser();
    const data = await exportUserData(user.id);
    res.setHeader("Content-Disposition", 'attachment; filename="gospel-drum-coach-export.json"');
    res.json(data);
  })
);

dataRouter.post(
  "/import",
  asyncHandler(async (req, res) => {
    const user = await requireLocalUser();
    const result = await importUserData(user.id, req.body);
    res.json(result);
  })
);

// POST /api/data/reset — section 31: destructive, so this is a hard reset back
// to LOCKED/zeroed progress rather than deleting the user profile itself.
dataRouter.post(
  "/reset",
  asyncHandler(async (req, res) => {
    const user = await requireLocalUser();
    if (req.body?.confirm !== "RESET") {
      res.status(400).json({ error: { code: "CONFIRMATION_REQUIRED", message: 'Send { "confirm": "RESET" } to proceed.' } });
      return;
    }

    await prisma.$transaction([
      prisma.exerciseAttempt.deleteMany({ where: { userId: user.id } }),
      prisma.bpmRecord.deleteMany({ where: { userId: user.id } }),
      prisma.practiceSession.deleteMany({ where: { userId: user.id } }),
      prisma.dailyLesson.deleteMany({ where: { userId: user.id } }),
      prisma.userExerciseProgress.updateMany({
        where: { userId: user.id },
        data: {
          status: ExerciseProgressStatus.LOCKED,
          cleanBpm: 0,
          bestAccuracy: 0,
          consecutiveCleanCount: 0,
          attemptsCount: 0,
          masteredAt: null,
        },
      }),
    ]);

    await recomputeUnlocks(user.id);
    res.json({ reset: true });
  })
);
