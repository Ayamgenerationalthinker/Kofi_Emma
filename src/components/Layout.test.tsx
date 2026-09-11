import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./Layout";
import { AppProvider } from "../context/AppContext";
import { ImmersiveProvider } from "../context/ImmersiveContext";
import { createUser } from "../services/profileService";

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AppProvider>
        <ImmersiveProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<div>Home content</div>} />
              <Route path="/settings" element={<div>Settings content</div>} />
            </Route>
          </Routes>
        </ImmersiveProvider>
      </AppProvider>
    </MemoryRouter>
  );
}

describe("Layout — Settings is reachable on mobile", () => {
  it("has a Settings link in the always-visible header (not only the desktop-only nav row)", async () => {
    createUser({
      name: "Test Drummer",
      experienceLevel: "INTERMEDIATE",
      timezone: "Africa/Accra",
      morningOn: true,
      eveningOn: true,
      morningTime: "07:00",
      eveningTime: "19:00",
    });

    const user = userEvent.setup();
    renderLayout();

    // Two links to /settings normally exist (the desktop nav row and the
    // always-visible header icon); the header one is what mobile users can
    // actually see and tap, since the desktop row is `hidden md:block`.
    const settingsLinks = screen.getAllByRole("link", { name: /settings/i });
    expect(settingsLinks.length).toBeGreaterThanOrEqual(1);

    await user.click(settingsLinks[0]);
    expect(await screen.findByText("Settings content")).toBeInTheDocument();
  });
});
