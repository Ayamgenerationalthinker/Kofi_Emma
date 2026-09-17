import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Progress } from "./Progress";
import { AppProvider } from "../context/AppContext";
import { createUser } from "../services/profileService";
import { masterExercise } from "../services/curriculumService";
import { mutate, newId } from "../lib/localDb";

function renderProgress() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <Progress />
      </AppProvider>
    </MemoryRouter>
  );
}

describe("Progress page", () => {
  beforeEach(() => {
    createUser({
      name: "Test Drummer",
      experienceLevel: "INTERMEDIATE",
      timezone: "Africa/Accra",
      morningOn: true,
      eveningOn: true,
      morningTime: "07:00",
      eveningTime: "19:00",
    });
  });

  it("shows an empty state before any practice data exists", () => {
    renderProgress();
    expect(screen.getByText(/Complete your first practice session/i)).toBeInTheDocument();
  });

  it("shows real skill progress and an achievements summary once there is practice data", () => {
    masterExercise("S0-E01");
    mutate((db) => {
      db.progress["S0-E01"].attemptsCount = 1;
      db.progress["S0-E01"].cleanBpm = 65;
      db.sessions.push({
        id: newId(),
        date: "2026-01-01",
        status: "COMPLETED",
        totalMinutes: 25,
        startedAt: "2026-01-01T07:00:00.000Z",
        completedAt: "2026-01-01T07:25:00.000Z",
        dailyLessonId: null,
      });
    });

    renderProgress();

    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getAllByText("Timing").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Independence").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Keep practicing to build this skill/i).length).toBeGreaterThan(0);

    expect(screen.getByText(/Achievements unlocked/i)).toBeInTheDocument();
    expect(screen.getByText(/Shed videos studied/i)).toBeInTheDocument();
  });
});
