import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { AppProvider } from "../context/AppContext";
import { createUser } from "../services/profileService";
import { masterExercise } from "../services/curriculumService";

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <Dashboard />
      </AppProvider>
    </MemoryRouter>
  );
}

describe("Dashboard page", () => {
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

  it("renders the current phase, stats, and a start-practice link", async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/START TODAY'S PRACTICE/i)).toBeInTheDocument());
    expect(screen.getByText("The Foundation & Highlife Pocket")).toBeInTheDocument();
    expect(screen.getByText("Single Stroke Control")).toBeInTheDocument(); // next milestone, before anything is mastered
  });

  it("shows a locked icon for locked phases", () => {
    renderDashboard();
    expect(screen.getAllByLabelText("Locked").length).toBeGreaterThan(0);
  });

  it("reflects mastery progress in the phase progress bar", () => {
    masterExercise("P1-E01");
    renderDashboard();
    expect(screen.getByText("1/10 mastered")).toBeInTheDocument();
  });
});
