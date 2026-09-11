import "./env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./env.js";
import { healthRouter } from "./routes/health.js";
import { profileRouter } from "./routes/profile.js";
import { curriculumRouter, exercisesRouter } from "./routes/curriculum.js";
import { practiceRouter } from "./routes/practice.js";
import { progressRouter } from "./routes/progress.js";
import { calendarRouter } from "./routes/calendar.js";
import { settingsRouter } from "./routes/settings.js";
import { dataRouter } from "./routes/data.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  // Mutation endpoints get a conservative rate limit; this is a single-user
  // local app, so the goal is guarding against runaway client bugs/loops,
  // not abuse from many independent clients (section 45).
  const mutationLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false });
  app.use((req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD") return next();
    return mutationLimiter(req, res, next);
  });

  app.use("/api/health", healthRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/curriculum", curriculumRouter);
  app.use("/api/exercises", exercisesRouter);
  app.use("/api/practice", practiceRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/calendar", calendarRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api", dataRouter);

  app.use("/api", notFoundHandler);
  app.use(errorHandler);

  return app;
}

if (process.env.VITEST !== "true") {
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Gospel Drum Coach API listening on http://localhost:${env.port}`);
  });
}
