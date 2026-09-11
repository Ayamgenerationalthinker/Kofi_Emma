import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAppContext } from "./context/AppContext";
import { useLocalDbVersion } from "./hooks/useLocalDb";
import { getDb } from "./lib/localDb";
import { Layout } from "./components/Layout";
import { Onboarding } from "./pages/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { Practice } from "./pages/Practice";
import { Curriculum } from "./pages/Curriculum";
import { ExerciseDetail } from "./pages/ExerciseDetail";
import { Metronome } from "./pages/Metronome";
import { Progress } from "./pages/Progress";
import { CalendarPage } from "./pages/CalendarPage";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";
import { useNotificationScheduler } from "./hooks/useNotificationScheduler";
import { ensureProgressInitialized } from "./services/curriculumService";
import type { Settings as SettingsDto } from "./lib/types";

// Defaults to dark, honors an explicit light/system choice, and re-applies
// on OS theme change for "system".
function useAppliedTheme(theme: SettingsDto["theme"] | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    function apply(isDark: boolean) {
      root.classList.toggle("dark", isDark);
    }
    if (theme === "light") {
      apply(false);
      return;
    }
    if (theme === "dark" || theme === undefined) {
      apply(true);
      return;
    }
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    apply(query.matches);
    const listener = (e: MediaQueryListEvent) => apply(e.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, [theme]);
}

function AppEffectsHost() {
  useLocalDbVersion();
  const db = getDb();
  useNotificationScheduler(db.reminderSettings);
  useAppliedTheme(db.settings.theme);

  // Runs once per mount, in an effect rather than during render, so it
  // never mutates the store while a component is rendering. Idempotent:
  // safe to call on every load, including for a returning user.
  useEffect(() => {
    ensureProgressInitialized();
  }, []);

  return null;
}

export default function App() {
  const { user } = useAppContext();

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  return (
    <>
      <AppEffectsHost />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/curriculum/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/metronome" element={<Metronome />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
