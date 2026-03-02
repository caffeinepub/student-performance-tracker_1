import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  ALL_CLASS_OPTIONS,
  type ClassFilter,
  useClassFilter,
} from "../context/ClassContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/subjects", label: "Subjects & Assessments", icon: BookOpen },
  { to: "/import", label: "Import Data", icon: Upload },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

// Amber-gold indicator dot per class
const CLASS_COLORS: Record<ClassFilter, string> = {
  "All Classes": "bg-sidebar-foreground/40",
  "Year 8": "bg-chart-1",
  "Year 9": "bg-chart-2",
  "Form 3": "bg-chart-3",
  "Grade 10": "bg-chart-4",
};

// Active nav indicator dot colors (using amber gold for active)
const NAV_INDICATOR_ACTIVE = "bg-sidebar-primary";

export default function Layout() {
  const { clear, identity } = useInternetIdentity();
  const { actor, isFetching: actorLoading } = useActor();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classMenuOpen, setClassMenuOpen] = useState(false);
  const { selectedClass, setSelectedClass } = useClassFilter();

  const backendConnecting = actorLoading || !actor;

  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-4)}`
    : "";

  const handleClassSelect = (cls: ClassFilter) => {
    setSelectedClass(cls);
    setClassMenuOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 flex h-full w-64 flex-col transition-transform duration-300 lg:relative lg:translate-x-0",
          "sidebar-gradient text-sidebar-foreground",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          background:
            "linear-gradient(180deg, oklch(0.13 0.04 260) 0%, oklch(0.17 0.05 260) 100%)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/20 ring-1 ring-sidebar-primary/30">
            <GraduationCap className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-none text-sidebar-foreground tracking-tight">
              EduTrack
            </h1>
            <p className="mt-0.5 text-[9px] text-sidebar-foreground/40 uppercase tracking-[0.15em]">
              Performance Tracker
            </p>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Class selector */}
        <div className="border-b border-sidebar-border px-3 py-3">
          <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/30">
            Viewing Class
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setClassMenuOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-lg bg-sidebar-accent px-3 py-2.5 text-sm font-semibold text-sidebar-accent-foreground transition-colors hover:bg-sidebar-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              aria-expanded={classMenuOpen}
              aria-haspopup="menu"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    CLASS_COLORS[selectedClass],
                  )}
                />
                <span>{selectedClass}</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-sidebar-foreground/40 transition-transform duration-200",
                  classMenuOpen && "rotate-180",
                )}
              />
            </button>

            {classMenuOpen && (
              <ul
                className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar shadow-elevated list-none p-1 m-0"
                aria-label="Select class"
              >
                {ALL_CLASS_OPTIONS.map((cls) => (
                  <li key={cls}>
                    <button
                      type="button"
                      onClick={() => handleClassSelect(cls)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        cls === selectedClass
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          CLASS_COLORS[cls],
                        )}
                      />
                      {cls}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive =
                to === "/" ? currentPath === "/" : currentPath.startsWith(to);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {/* Active indicator dot — amber gold */}
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0 transition-all duration-200",
                        isActive
                          ? cn(NAV_INDICATOR_ACTIVE, "opacity-100")
                          : "bg-transparent opacity-0 group-hover:opacity-40 group-hover:bg-sidebar-foreground",
                      )}
                    />
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/60 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/25 text-xs font-bold text-sidebar-primary ring-1 ring-sidebar-primary/30">
              T
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold text-sidebar-foreground">
                Teacher
              </p>
              <p className="truncate text-[10px] text-sidebar-foreground/40 font-mono">
                {shortPrincipal}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={clear}
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-foreground text-lg tracking-tight">
              EduTrack
            </span>
          </div>
          {/* Mobile class indicator */}
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                CLASS_COLORS[selectedClass],
              )}
            />
            {selectedClass}
          </div>
        </header>

        {/* Backend connecting banner */}
        {backendConnecting && (
          <div
            className="flex items-center justify-center gap-2.5 border-b px-4 py-2.5 text-xs"
            style={{
              background: "oklch(0.97 0.012 75)",
              borderColor: "oklch(0.88 0.06 75)",
              color: "oklch(0.35 0.08 75)",
            }}
          >
            <Loader2
              className="h-3.5 w-3.5 animate-spin shrink-0"
              style={{ color: "oklch(0.55 0.14 75)" }}
            />
            <span className="animate-pulse-slow font-medium">
              Connecting to backend — please wait, this may take a few seconds
              on first load…
            </span>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card px-6 py-3 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
