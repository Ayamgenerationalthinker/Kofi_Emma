import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "./Dashboard";

const CURRICULUM_STATE = {
  currentPhaseNumber: 1,
  currentExerciseId: "P1-E02",
  phases: [
    { id: "phase-1", number: 1, title: "The Foundation & Highlife Pocket", subtitle: "", status: "CURRENT", progress: 20, totalExercises: 10, masteredExercises: 2 },
    { id: "phase-2", number: 2, title: "Linear Subdivisions & Praise Medleys", subtitle: "", status: "LOCKED", progress: 0, totalExercises: 10, masteredExercises: 0 },
  ],
  overallProgress: 10,
};

const PROGRESS_SUMMARY = {
  masteredExercises: 2,
  lockedExercises: 30,
  totalExercises: 40,
  totalMinutesPracticed: 110,
  totalSessionsCompleted: 2,
  bestBpm: 104,
  averageAccuracy: 91,
  streak: { currentStreak: 2, longestStreak: 3, thisWeekSessions: 2 },
  hasAnyData: true,
};

const DAILY_LESSON = {
  date: "2026-01-15",
  totalMinutes: 55,
  phaseTitle: "The Foundation & Highlife Pocket",
  wasRecoverySession: false,
  coachMessage: "Today's lesson is ready. Clean first. Fast later.",
  lessonParts: [],
};

function mockApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      const body = url.includes("/curriculum/state")
        ? CURRICULUM_STATE
        : url.includes("/progress")
          ? PROGRESS_SUMMARY
          : url.includes("/practice/today")
            ? DAILY_LESSON
            : url.includes("/exercises/")
              ? { id: "P1-E02", name: "Double Stroke Control", targetBpm: 100, minimumAccuracy: 90 }
              : {};
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => body,
      });
    })
  );
}

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockApi();
  });

  it("renders the current phase, stats, and a start-practice link", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/START TODAY'S PRACTICE/i)).toBeInTheDocument());
    expect(screen.getByText("The Foundation & Highlife Pocket")).toBeInTheDocument();
    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(screen.getByText("2d")).toBeInTheDocument();
  });

  it("shows a locked icon for a locked phase", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText("Locked")).toBeInTheDocument());
  });
});
