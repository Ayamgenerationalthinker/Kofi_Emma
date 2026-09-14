import { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  Settings as SettingsIcon,
  AlertTriangle,
  WifiOff,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useImmersive } from "../context/ImmersiveContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getCurriculumState } from "../services/curriculumService";
import { BottomNav } from "./navigation/BottomNav";
import { DesktopSidebar } from "./navigation/DesktopSidebar";
import { DesktopTopBar } from "./navigation/DesktopTopBar";
import { PWAInstallBanner } from "./PWAInstallBanner";

export function Layout() {
  const { storageAvailable } = useAppContext();
  const { immersive } = useImmersive();
  useLocalDbVersion();
  const state = getCurriculumState();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-charcoal-950 text-parchment flex flex-col justify-between">
      <a
        href="#main-content"
        hidden={immersive}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold-500 focus:px-3 focus:py-2 focus:text-charcoal-950"
      >
        Skip to content
      </a>

      {/* Desktop Persistent Left Sidebar */}
      {!immersive && <DesktopSidebar />}

      {/* Main Content Area */}
      <div className={`flex min-h-screen flex-1 flex-col ${!immersive ? "lg:pl-64" : ""}`}>
        {/* Desktop Sticky Contextual Top Bar */}
        {!immersive && <DesktopTopBar isOnline={isOnline} />}

        {/* Mobile / Tablet Compact Header */}
        <header
          hidden={immersive}
          className="sticky top-0 z-40 border-b border-charcoal-800 bg-charcoal-950/95 backdrop-blur lg:hidden"
          style={{ paddingTop: "var(--safe-area-top)" }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
            <Link to="/" className="flex items-baseline gap-2 leading-tight">
              <span className="font-bold tracking-tight text-parchment">Abele Drums Coach</span>
              <span className="rounded-full border border-gold-600/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-300">
                Level {state.currentPhaseNumber}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              {!isOnline && (
                <span className="flex items-center gap-1.5 rounded-full border border-blue-600/50 bg-blue-950/40 px-2.5 py-1 text-[11px] text-blue-300">
                  <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Offline Mode</span>
                </span>
              )}
              {!storageAvailable && (
                <span className="flex items-center gap-1.5 rounded-full border border-amber-600/50 bg-amber-950/40 px-2.5 py-1 text-[11px] text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Storage blocked</span>
                  <span className="sm:hidden">Storage blocked</span>
                </span>
              )}
              <Link
                to="/settings"
                aria-label="Settings"
                className="rounded-full p-1.5 text-parchment/60 hover:bg-charcoal-800 hover:text-gold-300"
              >
                <SettingsIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Routed Workspace */}
        <main
          id="main-content"
          className={
            immersive
              ? "mx-auto w-full max-w-2xl px-4 py-4"
              : "mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 md:px-8 md:pb-12 lg:px-10 lg:py-8"
          }
          style={immersive ? { paddingTop: "calc(1rem + var(--safe-area-top))" } : undefined}
        >
          <Outlet />
        </main>
      </div>

      <PWAInstallBanner />

      {/* Mobile Bottom Navigation (Hidden on lg+) */}
      <div className="lg:hidden" hidden={immersive}>
        <BottomNav />
      </div>
    </div>
  );
}
