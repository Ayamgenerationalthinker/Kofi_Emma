import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { AppProvider } from "../context/AppContext";
import { AuthProvider } from "../context/AuthContext";
import { createUser } from "../services/profileService";
import { masterExercise, ensureProgressInitialized } from "../services/curriculumService";

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
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
    ensureProgressInitialized();
  });

  it("renders the current stage, routine, and start-lesson CTA", async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Start Lesson/i)).toBeInTheDocument());
    expect(screen.getAllByText(/STAGE 0 OF 10/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("5-Piece Drum Kit Anatomy & Setup").length).toBeGreaterThan(0);
  });

  it("reflects today's practice routine", () => {
    renderDashboard();
    expect(screen.getByText("Today's Routine (25 min total)")).toBeInTheDocument();
  });

  it("reflects mastery progress when an exercise is mastered", () => {
    masterExercise("S0-E01");
    renderDashboard();
    expect(screen.getByText(/1 lessons mastered/i)).toBeInTheDocument();
  });
});
