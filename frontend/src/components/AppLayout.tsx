import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Compass,
  Feather,
  KeyRound,
  Library,
  LogOut,
  Menu,
  ScrollText,
  X,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { cn, initials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

const NAV = [
  { to: "/app", label: "The Hearth", icon: ScrollText, end: true },
  { to: "/app/chat", label: "Ask the Scout", icon: Feather },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/library", label: "My Library", icon: Library },
  { to: "/app/profile", label: "Profile", icon: KeyRound },
];

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // React to forced logout (e.g. refresh-token failure from the API client).
  useEffect(() => {
    const handler = () => {
      logout();
      navigate("/login", { replace: true });
    };
    window.addEventListener("bookmind:logout", handler);
    return () => window.removeEventListener("bookmind:logout", handler);
  }, [logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-full bg-ink-950">
      {/* Sidebar — a tall carved bookshelf */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r-2 border-brand-950/70 bg-gradient-to-b from-ink-900 to-ink-950 bg-wood-grain backdrop-blur transition-transform duration-500 ease-in-out lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* faint candle-glow seam down the shelf's inner edge */}
        <span className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-brand-700/40 to-transparent" />

        <div className="flex h-20 items-center justify-between border-b border-brand-950/60 px-5 shelf">
          <Logo />
          <button
            className="rounded-xl p-1.5 text-ink-400 transition hover:bg-ink-800 hover:text-ink-100 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-300 ease-in-out",
                  isActive
                    ? "bg-brand-600/15 text-brand-200 shadow-glow"
                    : "text-ink-300 hover:bg-ink-800/70 hover:text-ink-50",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-brand-400 transition-all duration-300",
                      isActive ? "opacity-100 shadow-glow" : "opacity-0",
                    )}
                  />
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                      isActive && "drop-shadow-[0_0_6px_rgba(229,169,60,0.55)]",
                    )}
                  />
                  <span className="font-serif tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-brand-950/60 p-3 shelf">
          {/* Choose your world */}
          <div className="mb-3 px-1">
            <p className="eyebrow mb-1.5 px-1">Choose your world</p>
            <ThemeSwitcher labeled className="w-full" />
          </div>
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-700/40 bg-gradient-to-br from-brand-500 to-brand-700 font-cinzel text-sm font-bold text-ink-950 shadow-glow">
              {user ? initials(user.full_name || user.username) : <KeyRound className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-100">
                {user?.full_name || user?.username}
              </p>
              <p className="truncate text-xs text-ink-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-ink-300 transition-all duration-300 hover:bg-ink-800/70 hover:text-ink-50"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-serif tracking-wide">Close the ledger</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-brand-950/60 bg-ink-950/80 px-4 backdrop-blur lg:hidden">
          <button
            className="rounded-xl p-1.5 text-ink-300 transition hover:bg-ink-800 hover:text-ink-100"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-800/40 bg-brand-600/12 text-brand-300 shadow-glow">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-wide text-ink-50">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 font-serif text-sm italic text-ink-400">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions}
    </div>
  );
}
