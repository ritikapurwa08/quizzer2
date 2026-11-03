"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useTheme } from "next-themes";
import {
  LayoutGrid,
  BookOpen,
  ListChecks,
  BarChart2,
  History,
  Bookmark,
  Shield,
  Database,
  FileUp,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  GitCompare,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { isUserAdmin } from "@/lib/constants";
import { QuizzerLogoIcon } from "@/components/icons/QuizzerIcons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string | number;
}

// 5 items for mobile bottom nav bar (Saved Questions confirmed by user)
const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid, exact: true },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Analytics", href: "/analytics", icon: BarChart2, exact: true },
  { label: "History", href: "/history", icon: History, exact: true },
  { label: "Saved", href: "/saved-questions", icon: Bookmark },
];

// Full student nav for desktop sidebar & mobile slideover drawer
const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid, exact: true },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Syllabus Tracker", href: "/syllabus", icon: ListChecks, exact: true },
  { label: "Analytics", href: "/analytics", icon: BarChart2, exact: true },
  { label: "Test History", href: "/history", icon: History, exact: true },
  { label: "Saved Questions", href: "/saved-questions", icon: Bookmark },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Admin Overview", href: "/admin", icon: Shield, exact: true },
  { label: "Question Pool", href: "/admin/pool", icon: Database, exact: true },
  { label: "Dedup Review", href: "/admin/dedup", icon: GitCompare, exact: true },
  { label: "Import Sets", href: "/admin/import", icon: FileUp, exact: true },
  { label: "Question Bank", href: "/admin/questions", icon: HelpCircle, exact: true },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isAdmin = isUserAdmin(me);
  const displayName = me?.name || me?.email?.split("@")[0] || "Student";
  const initials = displayName.slice(0, 2).toUpperCase();

  // In active quiz session, hide mobile UI to avoid double-stacking headers (Focus Mode)
  const isQuizActive = Boolean(pathname?.startsWith("/quiz/") && !pathname?.includes("/results"));

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  function isItemActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname?.startsWith(item.href);
  }

  const renderNavLinks = () => (
    <div className="space-y-6">
      {/* Student Navigation */}
      <div className="space-y-1">
        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Learning & Practice
        </span>
        <nav className="mt-1.5 space-y-0.5">
          {STUDENT_NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all group select-none",
                  active
                    ? "bg-foreground text-background shadow-xs font-bold"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                      active ? "text-background" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className="text-[10px] h-4.5 px-1.5 font-bold"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Navigation (conditional) */}
      {isAdmin && (
        <div className="space-y-1.5 pt-3 border-t border-border/80">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-amber-500" /> Admin Console
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              PROTECTED
            </span>
          </div>
          <div className="p-1 rounded-2xl bg-muted/40 border border-border/60 space-y-0.5">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group select-none",
                    active
                      ? "bg-foreground text-background shadow-xs font-bold"
                      : "text-muted-foreground hover:bg-background hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110",
                        active ? "text-background" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── MOBILE TOP BAR (hidden on md and above, and hidden in active quiz Focus Mode) ── */}
      {!isQuizActive && (
        <header className="sticky top-0 z-40 flex md:hidden items-center justify-between border-b border-border bg-card/90 backdrop-blur-md px-4 py-2.5">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground">
            <QuizzerLogoIcon className="h-6 w-6" />
            <span className="text-base font-bold tracking-tight">Quizzer</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-10 w-10 rounded-xl"
              aria-label="Toggle theme"
            >
              {!mounted ? (
                <span className="h-4 w-4 inline-block" />
              ) : (
                <>
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="h-10 w-10 rounded-xl border-border cursor-pointer"
              aria-label="Open menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </header>
      )}

      {/* ── MOBILE SLIDEOVER DRAWER ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-card border-r border-border h-full p-4 shadow-xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <Link href="/dashboard" className="flex items-center gap-2">
                <QuizzerLogoIcon className="h-7 w-7" />
                <div>
                  <span className="font-bold text-base tracking-tight text-foreground block leading-tight">
                    Quizzer
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground block">
                    RPSC 2nd Grade GK
                  </span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable links */}
            <div className="flex-1 overflow-y-auto py-4">
              {renderNavLinks()}
            </div>

            {/* Footer Profile, Compact Theme Toggle & Logout */}
            <div className="pt-3 border-t border-border/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background font-bold text-xs shrink-0 shadow-2xs">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {isAdmin ? "Admin User" : "Student"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
                  aria-label="Toggle theme"
                >
                  {!mounted ? (
                    <span className="h-4 w-4 inline-block" />
                  ) : theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAVIGATION BAR (hidden on md and above, hidden in quiz) ── */}
      {!isQuizActive && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-md safe-bottom print:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-around px-1 py-1">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl min-w-0 flex-1 transition-all select-none",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <div
                    className={cn(
                      "p-1 rounded-lg transition-all",
                      active ? "bg-foreground/10" : ""
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold truncate max-w-full",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ── DESKTOP PERSISTENT SIDEBAR ── */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-border bg-card print:hidden">
        {/* Brand header */}
        <div className="p-4 border-b border-border/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <QuizzerLogoIcon className="h-7 w-7 transition-transform group-hover:scale-105" />
            <div>
              <span className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors block leading-tight">
                Quizzer
              </span>
              <span className="text-[10px] font-medium text-muted-foreground block">
                RPSC 2nd Grade GK
              </span>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-3.5 scrollbar-thin">
          {renderNavLinks()}
        </div>

        {/* Footer: User profile, compact theme toggle & sign out */}
        <div className="p-3 border-t border-border/80 bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background font-bold text-xs shrink-0 shadow-2xs">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {isAdmin ? "Admin User" : "Student"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
                aria-label="Toggle theme"
              >
                {!mounted ? (
                  <span className="h-4 w-4 inline-block" />
                ) : theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
