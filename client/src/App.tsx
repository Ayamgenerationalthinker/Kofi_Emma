import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAppContext } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { LoadingState, ErrorState } from "./components/StatusStates";
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
import { useFetch } from "./hooks/useFetch";
import type { ReminderSettings, Settings as SettingsDto } from "./lib/types";

// Section 36/89 (theme): defaults to dark, honors an explicit light/system
// choice once settings load, and re-applies on OS theme change for "system".
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
  const { data } = useFetch<{ reminderSettings: ReminderSettings; settings: SettingsDto }>("/settings");
  useNotificationScheduler(data?.reminderSettings ?? null);
  useAppliedTheme(data?.settings.theme);
  return null;
}

export default function App() {
  const { user, loading, error } = useAppContext();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal-950">
        <LoadingState label="Loading Gospel Drum Coach..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal-950 p-4">
        <ErrorState message={error.message} onRetry={() => window.location.reload()} />
      </div>
    );
  }

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
