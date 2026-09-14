import { useLocation, Link } from "react-router-dom";
import { WifiOff, AlertTriangle, ChevronRight, Sparkles } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { getCurriculumState } from "../../services/curriculumService";
import { useLocalDbVersion } from "../../hooks/useLocalDb";

function getBreadcrumb(pathname: string): { section?: string; current: string } {
  if (pathname === "/") return { current: "Command Center" };
  if (pathname === "/learn") return { current: "Academy Directory" };
  if (pathname.startsWith("/curriculum/")) return { section: "Learn", current: "Exercise Studio" };
  if (pathname === "/curriculum") return { section: "Learn", current: "8-Level Curriculum" };
  if (pathname.startsWith("/rudiments/")) return { section: "Learn", current: "Rudiment Studio" };
  if (pathname === "/rudiments") return { section: "Learn", current: "40 PAS Rudiments" };
  if (pathname === "/double-bass") return { section: "Learn", current: "Double Bass School" };
  if (pathname === "/practice") return { current: "Daily Practice Shed" };
  if (pathname === "/shed") return { current: "Shed Laboratories" };
  if (pathname === "/shed-tracks") return { section: "Shed", current: "Drumless Shed Tracks" };
  if (pathname.startsWith("/shed-tracks/")) return { section: "Shed", current: "Track Detail" };
  if (pathname === "/tempo-builder") return { section: "Shed", current: "Tempo Builder" };
  if (pathname === "/fills") return { section: "Shed", current: "Fill Trainer" };
  if (pathname === "/transitions") return { section: "Shed", current: "Transition Trainer" };
  if (pathname === "/live-church") return { section: "Shed", current: "Live Church Engine" };
  if (pathname === "/call-and-response") return { section: "Shed", current: "Call & Response" };
  if (pathname === "/mic-coach") return { section: "Shed", current: "Mic Tempo Coach" };
  if (pathname === "/library") return { section: "Learn", current: "Knowledge Base" };
  if (pathname === "/metronome") return { section: "Tools", current: "Web Audio Metronome" };
  if (pathname === "/calendar") return { section: "Tools", current: "Calendar & Reminders" };
  if (pathname === "/progress") return { current: "Progress & Mastery" };
  if (pathname === "/settings") return { current: "Settings" };
  if (pathname === "/achievements") return { section: "Progress", current: "Achievements" };

  return { current: "Abele Drums Coach" };
}

interface DesktopTopBarProps {
  isOnline: boolean;
}

export function DesktopTopBar({ isOnline }: DesktopTopBarProps) {
  useLocalDbVersion();
  const location = useLocation();
  const { storageAvailable } = useAppContext();
  const state = getCurriculumState();
  const { section, current } = getBreadcrumb(location.pathname);

  return (
    <header className="sticky top-0 z-20 hidden border-b border-charcoal-800 bg-charcoal-950/80 backdrop-blur-md lg:block">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-8">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm font-medium">
          {section && (
            <>
              <span className="text-parchment/40">{section}</span>
              <ChevronRight className="h-4 w-4 text-parchment/20" />
            </>
          )}
          <span className="font-bold text-parchment">{current}</span>
        </div>

        {/* Right: Status Indicators & Quick Actions */}
        <div className="flex items-center gap-3">
          {!isOnline && (
            <span className="flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-300">
              <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Offline Ready</span>
            </span>
          )}

          {!storageAvailable && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Storage Blocked</span>
            </span>
          )}

          {/* Level Badge */}
          <Link
            to="/curriculum"
            className="flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-300 transition-colors hover:border-gold-500/50 hover:bg-gold-500/20"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold-400" />
            <span>Level {state.currentPhaseNumber}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
