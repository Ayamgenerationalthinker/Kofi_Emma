import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ListMusic, BookOpen, Timer, LineChart, CalendarDays, Settings as SettingsIcon, Flame, AlertTriangle, Award } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useImmersive } from "../context/ImmersiveContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getCurriculumState } from "../services/curriculumService";
import { BottomNav } from "./navigation/BottomNav";

const DESKTOP_NAV_ITEMS = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/practice", label: "Practice", icon: ListMusic },
  { to: "/curriculum", label: "Learn", icon: BookOpen },
  { to: "/shed", label: "Shed", icon: Flame },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/achievements", label: "Achievements", icon: Award },
  { to: "/metronome", label: "Metronome", icon: Timer },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

// Section 71: a compact mobile header (name + current level, no wasted
// vertical space) plus a fixed bottom nav on mobile. A desktop-width top
// nav row is kept for larger screens where a thumb-reach bottom bar makes
// less sense (section 7: mobile drives the design, desktop is secondary —
// not absent).
export function Layout() {
  const { storageAvailable } = useAppContext();
  const { immersive } = useImmersive();
  useLocalDbVersion();
  const state = getCurriculumState();

  // The immersive toggle must only ever change styling, never the shape of
  // the tree around <Outlet />: an earlier version returned two structurally
  // different trees (one with header/nav, one without), which made React
  // unmount and remount the routed page — including all of its local state
  // (e.g. Practice.tsx's in-progress session stage) — the instant a lesson
  // part started and immersive flipped to true. Header/bottom-nav are now
  // just hidden, and <main>/<Outlet /> always sit in the same position.
  return (
    <div className="min-h-screen bg-charcoal-950 text-parchment">
      <a
        href="#main-content"
        hidden={immersive}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold-500 focus:px-3 focus:py-2 focus:text-charcoal-950"
      >
        Skip to content
      </a>

      <header
        hidden={immersive}
        className="sticky top-0 z-40 border-b border-charcoal-800 bg-charcoal-950/95 backdrop-blur"
        style={{ paddingTop: "var(--safe-area-top)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
          <div className="flex items-baseline gap-2 leading-tight">
            <span className="font-bold tracking-tight">Abele Drums Coach</span>
            <span className="rounded-full border border-gold-600/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-300">
              Level {state.currentPhaseNumber}
            </span>
          </div>
          {!storageAvailable && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-600/50 bg-amber-950/40 px-2.5 py-1 text-[11px] text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Storage blocked — progress won't be saved</span>
              <span className="sm:hidden">Storage blocked</span>
            </span>
          )}
        </div>
        <nav aria-label="Primary" className="hidden border-t border-charcoal-800 md:block">
          <div className="mx-auto flex max-w-6xl gap-1 px-4">
            {DESKTOP_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                    isActive ? "border-gold-500 text-gold-300" : "border-transparent text-parchment/60 hover:text-parchment",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main
        id="main-content"
        className={immersive ? "mx-auto max-w-2xl px-4 py-4" : "mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-10"}
        style={immersive ? { paddingTop: "calc(1rem + var(--safe-area-top))" } : undefined}
      >
        <Outlet />
      </main>

      <div className="md:hidden" hidden={immersive}>
        <BottomNav />
      </div>
    </div>
  );
}
