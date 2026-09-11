import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireLocalUser } from "../lib/singleUser.js";
import { getProgressSummary, getBpmHistory, getAccuracyHistory } from "../services/progressService.js";

export const progressRouter = Router();

function parseRangeDays(value: unknown): number | "all" {
  if (value === "all") return "all";
  const n = Number(value ?? 30);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

progressRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const user = await requireLocalUser();
    const summary = await getProgressSummary(user.id, user.timezone);
    res.json(summary);
  })
);

progressRouter.get(
  "/bpm",
  asyncHandler(async (req, res) => {
    const user = await requireLocalUser();
    const history = await getBpmHistory(user.id, { days: parseRangeDays(req.query.range) });
    res.json({ history });
  })
);

progressRouter.get(
  "/accuracy",
  asyncHandler(async (req, res) => {
    const user = await requireLocalUser();
    const history = await getAccuracyHistory(user.id, { days: parseRangeDays(req.query.range) });
    res.json({ history });
  })
);
