import { NavLink } from "react-router-dom";
import { Home, ListMusic, BookOpen, Flame, LineChart } from "lucide-react";

// Section 9/109: fixed mobile bottom navigation, always visible while
// navigating. Curriculum and the Handbook both live under "Learn" so five
// labeled items stay comfortably tap-sized instead of cramming in a sixth.
const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/practice", label: "Practice", icon: ListMusic },
  { to: "/curriculum", label: "Learn", icon: BookOpen },
  { to: "/shed", label: "Shed", icon: Flame },
  { to: "/progress", label: "Progress", icon: LineChart },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-charcoal-800 bg-charcoal-950/95 backdrop-blur"
      style={{ paddingBottom: "var(--safe-area-bottom)" }}
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            [
              "flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
              isActive ? "text-gold-300" : "text-parchment/50",
            ].join(" ")
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
