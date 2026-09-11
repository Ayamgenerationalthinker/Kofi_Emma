import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Practice, SessionSummary } from "./Practice";
import { AppProvider } from "../context/AppContext";
import { AuthProvider } from "../context/AuthContext";
import { ImmersiveProvider } from "../context/ImmersiveContext";
import { createUser } from "../services/profileService";
import { getDb } from "../lib/localDb";
import { todayKey } from "../lib/dates";

function renderPractice() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <AuthProvider>
          <ImmersiveProvider>
            <Practice />
          </ImmersiveProvider>
        </AuthProvider>
      </AppProvider>
    </MemoryRouter>
  );
}

describe("Practice page — exiting a shed early", () => {
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

  it("does NOT mark today's session COMPLETED when the user exits before finishing any part", async () => {
    const user = userEvent.setup();
    renderPractice();

    await user.click(await screen.findByRole("button", { name: /^START$/ }));
    await user.click(await screen.findByRole("button", { name: /Exit Shed/i }));
    await user.click(await screen.findByRole("button", { name: /Save & Exit/i }));

    const session = getDb().sessions.find((s) => s.date === todayKey("Africa/Accra"));
    expect(session).toBeDefined();
    // This is the regression this test guards: exiting at 0/4 parts must
    // leave the session IN_PROGRESS, not COMPLETED — otherwise it would
    // count toward the streak and "minutes practiced" stats despite no
    // actual practice happening.
    expect(session!.status).not.toBe("COMPLETED");
    expect(session!.status).toBe("IN_PROGRESS");
  });

  it("returns to the intro screen after Save & Exit rather than getting stuck", async () => {
    const user = userEvent.setup();
    renderPractice();

    await user.click(await screen.findByRole("button", { name: /^START$/ }));
    await user.click(await screen.findByRole("button", { name: /Exit Shed/i }));
    await user.click(await screen.findByRole("button", { name: /Save & Exit/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /^START$/ })).toBeInTheDocument());
  });
});

function renderSessionSummary(newlyUnlocked: Parameters<typeof SessionSummary>[0]["newlyUnlocked"]) {
  return render(
    <MemoryRouter>
      <AppProvider>
        <SessionSummary totalMinutes={25} exerciseCount={4} masteredCount={1} startingBestBpm={60} newlyUnlocked={newlyUnlocked} />
      </AppProvider>
    </MemoryRouter>
  );
}

describe("SessionSummary — achievement discoverability", () => {
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

  it("links to the full Achievements page right next to a newly unlocked achievement", () => {
    renderSessionSummary(["first_practice"]);
    expect(screen.getByText(/achievement unlocked/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see all achievements/i })).toHaveAttribute("href", "/achievements");
  });

  it("does not show the achievements link on a completion screen with nothing newly unlocked", () => {
    renderSessionSummary([]);
    expect(screen.queryByRole("link", { name: /see all achievements/i })).not.toBeInTheDocument();
  });
});
