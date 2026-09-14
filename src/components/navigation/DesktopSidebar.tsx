import { NavLink } from "react-router-dom";
import {
  Home,
  BookOpen,
  ListMusic,
  Flame,
  LineChart,
  Timer,
  CalendarDays,
  Settings,
  Drum,
  User as UserIcon,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { getCurriculumState } from "../../services/curriculumService";
import { useLocalDbVersion } from "../../hooks/useLocalDb";

interface NavLinkItem {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
}

const MAIN_NAV: NavLinkItem[] = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/practice", label: "Practice", icon: ListMusic },
  { to: "/shed", label: "Shed", icon: Flame },
  { to: "/progress", label: "Progress", icon: LineChart },
];

const TOOLS_NAV: NavLinkItem[] = [
  { to: "/metronome", label: "Metronome", icon: Timer },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
];

const SYSTEM_NAV: NavLinkItem[] = [
  { to: "/settings", label: "Settings", icon: Settings },
];

export function DesktopSidebar() {
  useLocalDbVersion();
  const { user } = useAppContext();
  const state = getCurriculumState();

  const renderNavLink = ({ to, label, icon: Icon, end }: NavLinkItem) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
          isActive
            ? "bg-gold-500/10 text-gold-300 font-semibold border-l-2 border-gold-500 shadow-sm"
            : "text-parchment/60 hover:bg-charcoal-800/60 hover:text-parchment",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`h-4 w-4 transition-colors ${
              isActive ? "text-gold-400" : "text-parchment/40 group-hover:text-parchment/70"
            }`}
            aria-hidden="true"
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-charcoal-800 bg-charcoal-950/95 backdrop-blur-md lg:flex"
    >
      <div className="flex flex-col space-y-6 p-5">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 pt-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-400 shadow-inner">
            <Drum className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-parchment">Kofi Emma</h1>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gold-400/80">
              Abele Drums Coach
            </p>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-6">
          {/* MAIN */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-parchment/40">
              Main
            </span>
            <div className="mt-1.5 space-y-0.5">{MAIN_NAV.map(renderNavLink)}</div>
          </div>

          {/* TOOLS */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-parchment/40">
              Tools
            </span>
            <div className="mt-1.5 space-y-0.5">{TOOLS_NAV.map(renderNavLink)}</div>
          </div>

          {/* SYSTEM */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-parchment/40">
              System
            </span>
            <div className="mt-1.5 space-y-0.5">{SYSTEM_NAV.map(renderNavLink)}</div>
          </div>
        </nav>
      </div>

      {/* User Profile Status Footer */}
      <div className="border-t border-charcoal-800/80 p-4">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-xl border border-charcoal-800 bg-charcoal-900/50 p-2.5 transition-colors hover:border-gold-500/30 hover:bg-charcoal-800/50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-charcoal-800 text-gold-400">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-parchment">
              {user?.name || "Drummer"}
            </p>
            <p className="truncate text-[10px] text-parchment/50">
              {user?.experienceLevel ? `${user.experienceLevel.charAt(0) + user.experienceLevel.slice(1).toLowerCase()} · ` : ""}
              Level {state.currentPhaseNumber}
            </p>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500" title="Local storage active" />
        </NavLink>
      </div>
    </aside>
  );
}
