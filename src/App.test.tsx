import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { ImmersiveProvider } from "./context/ImmersiveContext";

function renderApp() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <ImmersiveProvider>
          <App />
        </ImmersiveProvider>
      </AppProvider>
    </MemoryRouter>
  );
}

// Exercises the full first-run flow through the real App component (no
// mocks) — no browser was available to click through this session, so this
// is the closest verification: onboarding -> profile created in
// LocalStorage -> Dashboard renders -> data persists across a "reload"
// (a fresh AppProvider mount reading the same LocalStorage).
describe("App first-run flow", () => {
  it("shows onboarding with no profile, then the dashboard after completing it", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByText("Kofi Emma")).toBeInTheDocument();
    expect(screen.getByText("Start Level 0")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Your name"), "Kwame");
    await user.click(screen.getByRole("button", { name: "Start Level 0" }));

    await waitFor(() => expect(screen.getByText(/START TODAY'S PRACTICE/i)).toBeInTheDocument());
    expect(screen.getByText("Absolute Beginner")).toBeInTheDocument();
  });

  it("persists the profile across a simulated reload (fresh AppProvider mount)", async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp();

    await user.type(screen.getByLabelText("Your name"), "Ama");
    await user.click(screen.getByRole("button", { name: "Start Level 0" }));
    await waitFor(() => expect(screen.getByText(/START TODAY'S PRACTICE/i)).toBeInTheDocument());

    unmount();

    renderApp();

    // No onboarding this time — the profile survived in localStorage.
    expect(screen.queryByText("Start Level 0")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/START TODAY'S PRACTICE/i)).toBeInTheDocument());
  });
});
