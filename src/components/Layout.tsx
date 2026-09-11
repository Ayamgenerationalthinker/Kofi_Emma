import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ListMusic, BookOpen, Timer, LineChart, CalendarDays, Settings as SettingsIcon, AlertTriangle } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/practice", label: "Today's Practice", icon: ListMusic },
  { to: "/curriculum", label: "Curriculum", icon: BookOpen },
  { to: "/metronome", label: "Metronome", icon: Timer },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Layout() {
  const { storageAvailable } = useAppContext();

  return (
    <div className="min-h-screen bg-charcoal-950 text-parchment">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold-500 focus:px-3 focus:py-2 focus:text-charcoal-950">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-charcoal-800 bg-charcoal-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex flex-col leading-tight">
            <span className="font-bold tracking-tight">Gospel Drum Coach</span>
            <span className="text-xs text-gold-400/80">The Kofi Emma Method</span>
          </div>
          {!storageAvailable && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-600/50 bg-amber-950/40 px-3 py-1 text-xs text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Storage blocked — progress won't be saved
            </span>
          )}
        </div>
        <nav aria-label="Primary" className="hidden md:block border-t border-charcoal-800">
          <div className="mx-auto flex max-w-6xl gap-1 px-4">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
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

      <main id="main-content" className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-10">
        <Outlet />
      </main>

      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-charcoal-800 bg-charcoal-950/95 backdrop-blur md:hidden">
        {NAV_ITEMS.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              ["flex flex-col items-center gap-1 py-2 text-[11px]", isActive ? "text-gold-300" : "text-parchment/50"].join(" ")
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
