import { useEffect, Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAppContext } from "./context/AppContext";
import { useLocalDbVersion } from "./hooks/useLocalDb";
import { getDb } from "./lib/localDb";
import { Layout } from "./components/Layout";
import { Onboarding } from "./pages/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { Practice } from "./pages/Practice";
import { LearnHub } from "./pages/LearnHub";
import { Curriculum } from "./pages/Curriculum";
import { ExerciseDetail } from "./pages/ExerciseDetail";
import { Metronome } from "./pages/Metronome";
import { Progress } from "./pages/Progress";
import { Settings } from "./pages/Settings";
import { Shed } from "./pages/Shed";
import { RudimentsSchool } from "./pages/RudimentsSchool";
import { RudimentDetail } from "./pages/RudimentDetail";
import { DoubleBassSchool } from "./pages/DoubleBassSchool";
import { NotFound } from "./pages/NotFound";
import { useNotificationScheduler } from "./hooks/useNotificationScheduler";
import { ensureProgressInitialized } from "./services/curriculumService";
import type { Settings as SettingsDto } from "./lib/types";

// Code-split heavy interactive subpages to keep initial bundle load instantaneous
const ShedTracks = lazy(() => import("./pages/ShedTracks").then((m) => ({ default: m.ShedTracks })));
const ShedTrackDetail = lazy(() => import("./pages/ShedTrackDetail").then((m) => ({ default: m.ShedTrackDetail })));
const CalendarPage = lazy(() => import("./pages/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const Achievements = lazy(() => import("./pages/Achievements").then((m) => ({ default: m.Achievements })));
const TempoBuilder = lazy(() => import("./pages/TempoBuilder").then((m) => ({ default: m.TempoBuilder })));
const FillTrainer = lazy(() => import("./pages/FillTrainer").then((m) => ({ default: m.FillTrainer })));
const TransitionTrainer = lazy(() => import("./pages/TransitionTrainer").then((m) => ({ default: m.TransitionTrainer })));
const LiveChurch = lazy(() => import("./pages/LiveChurch").then((m) => ({ default: m.LiveChurch })));
const CallAndResponse = lazy(() => import("./pages/CallAndResponse").then((m) => ({ default: m.CallAndResponse })));
const Library = lazy(() => import("./pages/Library").then((m) => ({ default: m.Library })));
const MicCoach = lazy(() => import("./pages/MicCoach").then((m) => ({ default: m.MicCoach })));

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

  useEffect(() => {
    ensureProgressInitialized();
  }, []);

  return null;
}

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
    </div>
  );
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
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/learn" element={<LearnHub />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/curriculum/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/rudiments" element={<RudimentsSchool />} />
          <Route path="/rudiments/:rudimentId" element={<RudimentDetail />} />
          <Route path="/double-bass" element={<DoubleBassSchool />} />
          <Route path="/handbook" element={<Navigate to="/learn" replace />} />
          <Route path="/shed" element={<Shed />} />
          <Route path="/metronome" element={<Metronome />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/shed-tracks"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShedTracks />
              </Suspense>
            }
          />
          <Route
            path="/shed-tracks/:trackId"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShedTrackDetail />
              </Suspense>
            }
          />
          <Route
            path="/calendar"
            element={
              <Suspense fallback={<PageLoader />}>
                <CalendarPage />
              </Suspense>
            }
          />
          <Route
            path="/achievements"
            element={
              <Suspense fallback={<PageLoader />}>
                <Achievements />
              </Suspense>
            }
          />
          <Route
            path="/tempo-builder"
            element={
              <Suspense fallback={<PageLoader />}>
                <TempoBuilder />
              </Suspense>
            }
          />
          <Route
            path="/fills"
            element={
              <Suspense fallback={<PageLoader />}>
                <FillTrainer />
              </Suspense>
            }
          />
          <Route
            path="/transitions"
            element={
              <Suspense fallback={<PageLoader />}>
                <TransitionTrainer />
              </Suspense>
            }
          />
          <Route
            path="/live-church"
            element={
              <Suspense fallback={<PageLoader />}>
                <LiveChurch />
              </Suspense>
            }
          />
          <Route
            path="/call-and-response"
            element={
              <Suspense fallback={<PageLoader />}>
                <CallAndResponse />
              </Suspense>
            }
          />
          <Route
            path="/library"
            element={
              <Suspense fallback={<PageLoader />}>
                <Library />
              </Suspense>
            }
          />
          <Route
            path="/mic-coach"
            element={
              <Suspense fallback={<PageLoader />}>
                <MicCoach />
              </Suspense>
            }
          />
          <Route path="/onboarding" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
