import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { AppProvider } from "../context/AppContext";
import { AuthProvider } from "../context/AuthContext";
import { createUser } from "../services/profileService";
import { masterExercise } from "../services/curriculumService";

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
  });

  it("renders the current level, stats, and a start-shed link", async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/START SHED/i)).toBeInTheDocument());
    expect(screen.getAllByText(/Absolute Beginner/).length).toBeGreaterThan(0);
    expect(screen.getByText("Meet the Drum Kit")).toBeInTheDocument(); // today's shed headline exercise
  });

  it("shows a locked icon for locked levels", () => {
    renderDashboard();
    expect(screen.getAllByLabelText("Locked").length).toBeGreaterThan(0);
  });

  it("reflects mastery progress in the level progress bar", () => {
    masterExercise("P1-E01");
    renderDashboard();
    expect(screen.getByText("1/10 mastered")).toBeInTheDocument();
  });
});
