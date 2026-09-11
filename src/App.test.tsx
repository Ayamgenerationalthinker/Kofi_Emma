import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { ImmersiveProvider } from "./context/ImmersiveContext";

function renderApp() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <AuthProvider>
          <ImmersiveProvider>
            <App />
          </ImmersiveProvider>
        </AuthProvider>
      </AppProvider>
    </MemoryRouter>
  );
}

async function completeOnboarding(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.type(screen.getByPlaceholderText("e.g. Kwame"), name);
  await user.click(screen.getByRole("button", { name: "START" }));

  await user.click(screen.getByRole("button", { name: "I've never played" }));
  await user.click(screen.getByRole("button", { name: "CONTINUE" }));

  await user.click(screen.getByRole("button", { name: "Gospel" }));
  await user.click(screen.getByRole("button", { name: "CONTINUE" }));

  await user.click(screen.getByRole("button", { name: "15 min" }));
  await user.click(screen.getByRole("button", { name: "CONTINUE" }));

  await user.click(screen.getByRole("button", { name: "START MY FIRST SHED" }));
}

// Exercises the full first-run flow through the real App component (no
// mocks) — no browser was available to click through this session, so this
// is the closest verification: onboarding -> profile created in
// LocalStorage -> Home renders -> data persists across a "reload" (a fresh
// AppProvider mount reading the same LocalStorage).
describe("App first-run flow", () => {
  it("shows the onboarding wizard with no profile, then the home shed launchpad after completing it", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByText("Your rhythm starts here.")).toBeInTheDocument();

    await completeOnboarding(user, "Kwame");

    await waitFor(() => expect(screen.getByText(/START SHED/i)).toBeInTheDocument());
    expect(screen.getByText(/Kwame/)).toBeInTheDocument();
  });

  it("persists the profile across a simulated reload (fresh AppProvider mount)", async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp();

    await completeOnboarding(user, "Ama");
    await waitFor(() => expect(screen.getByText(/START SHED/i)).toBeInTheDocument());

    unmount();

    renderApp();

    // No onboarding this time — the profile survived in localStorage.
    expect(screen.queryByText("Your rhythm starts here.")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/START SHED/i)).toBeInTheDocument());
  });
});
