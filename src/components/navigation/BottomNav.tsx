import { NavLink } from "react-router-dom";
import { Home, ListMusic, BookOpen, Flame, LineChart, Settings } from "lucide-react";

// Mobile bottom navigation with comfortable 44px+ touch targets and safe-area padding.
const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/practice", label: "Practice", icon: ListMusic },
  { to: "/shed", label: "Shed", icon: Flame },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-charcoal-800 bg-charcoal-950/95 backdrop-blur-md"
      style={{ paddingBottom: "var(--safe-area-bottom)" }}
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            [
              "flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-bold transition-colors",
              isActive ? "text-gold-300" : "text-parchment/50 hover:text-parchment/80",
            ].join(" ")
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
