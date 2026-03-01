import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
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
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/subjects", label: "Subjects & Assessments", icon: BookOpen },
  { to: "/import", label: "Import Data", icon: Upload },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

// Colour dot per class
const CLASS_COLORS: Record<ClassFilter, string> = {
  "All Classes": "bg-muted-foreground",
  "Year 8": "bg-chart-1",
  "Year 9": "bg-chart-2",
  "Form 3": "bg-chart-3",
  "Grade 10": "bg-chart-4",
};

export default function Layout() {
  const { clear, identity } = useInternetIdentity();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classMenuOpen, setClassMenuOpen] = useState(false);
  const { selectedClass, setSelectedClass } = useClassFilter();

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
          "fixed left-0 top-0 z-30 flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary/20">
            <GraduationCap className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold leading-none text-sidebar-foreground">
              EduTrack
            </h1>
            <p className="mt-0.5 text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">
              Performance Tracker
            </p>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Class selector */}
        <div className="border-b border-sidebar-border px-3 py-3">
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Viewing Class
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setClassMenuOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-md bg-sidebar-accent px-3 py-2.5 text-sm font-semibold text-sidebar-accent-foreground transition-colors hover:bg-sidebar-primary/20"
              aria-expanded={classMenuOpen}
              aria-haspopup="menu"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    CLASS_COLORS[selectedClass],
                  )}
                />
                <span>{selectedClass}</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-sidebar-foreground/50 transition-transform duration-200",
                  classMenuOpen && "rotate-180",
                )}
              />
            </button>

            {classMenuOpen && (
              <ul
                className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-sidebar-border bg-sidebar shadow-elevated list-none p-0 m-0"
                aria-label="Select class"
              >
                {ALL_CLASS_OPTIONS.map((cls) => (
                  <li key={cls}>
                    <button
                      type="button"
                      onClick={() => handleClassSelect(cls)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors",
                        cls === selectedClass
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full shrink-0",
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
          <ul className="space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive =
                to === "/" ? currentPath === "/" : currentPath.startsWith(to);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
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
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-bold text-sidebar-primary">
              T
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-medium text-sidebar-foreground">
                Teacher
              </p>
              <p className="truncate text-[10px] text-sidebar-foreground/50 font-mono">
                {shortPrincipal}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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
            className="rounded-md p-2 hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-foreground">
              EduTrack
            </span>
          </div>
          {/* Mobile class indicator */}
          <div className="ml-auto flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                CLASS_COLORS[selectedClass],
              )}
            />
            {selectedClass}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card px-6 py-3 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
