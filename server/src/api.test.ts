import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./index.js";
import { cleanDatabase, createTestUser, seedMinimalCurriculum, initProgress } from "./test/dbHelpers.js";

const app = createApp();

describe("API", () => {
  beforeEach(cleanDatabase);

  it("GET /api/health returns { status: ok }", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/profile returns 404 before onboarding", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NO_USER");
  });

  it("POST /api/practice/attempt on a locked exercise returns 403 with a stable error shape", async () => {
    const user = await createTestUser();
    const { e2 } = await seedMinimalCurriculum();
    await initProgress(user.id);

    const res = await request(app)
      .post("/api/practice/attempt")
      .send({
        clientAttemptId: "http-locked-1",
        exerciseId: e2.id,
        cleanBpm: 100,
        accuracy: 95,
        durationMinutes: 10,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("EXERCISE_LOCKED");
  });

  it("GET /api/curriculum hides exercises inside a locked phase", async () => {
    const user = await createTestUser();
    await seedMinimalCurriculum();
    await initProgress(user.id);

    const res = await request(app).get("/api/curriculum");
    expect(res.status).toBe(200);
    const phase2 = res.body.phases.find((p: { number: number }) => p.number === 2);
    expect(phase2.unlocked).toBe(false);
    expect(phase2.exercises).toEqual([]);
    expect(phase2.lockedMessage).toMatch(/Master all Phase 1/);
  });

  it("GET /api/calendar/today.ics returns a well-formed calendar payload", async () => {
    const user = await createTestUser();
    await seedMinimalCurriculum();
    await initProgress(user.id);

    const res = await request(app).get("/api/calendar/today.ics");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/calendar");
    expect(res.text).toContain("BEGIN:VCALENDAR");
    expect(res.text).toContain("END:VCALENDAR");
  });
});
