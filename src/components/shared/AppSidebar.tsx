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

// 5 items for mobile bottom nav bar for all users
const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid, exact: true },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Analytics", href: "/analytics", icon: BarChart2, exact: true },
  { label: "History", href: "/history", icon: History, exact: true },
  { label: "Saved", href: "/saved-questions", icon: Bookmark },
];

// Full student nav for desktop sidebar
const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid, exact: true },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Syllabus Tracker", href: "/syllabus", icon: ListChecks, exact: true },
  { label: "Analytics", href: "/analytics", icon: BarChart2, exact: true },
  { label: "Test History", href: "/history", icon: History, exact: true },
  { label: "Saved Questions", href: "/saved-questions", icon: Bookmark },
];

// Admin navigation items
const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Admin Overview", href: "/admin", icon: Shield, exact: true },
  { label: "55 Topics Pool", href: "/admin/pool", icon: Database, exact: true },
  { label: "Dedup Review", href: "/admin/dedup", icon: GitCompare, exact: true },
  { label: "Import Sets", href: "/admin/import", icon: FileUp, exact: true },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const { theme, setTheme } = useTheme();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close admin bottom sheet on route change
  useEffect(() => {
    setAdminMenuOpen(false);
  }, [pathname]);

  const isAdmin = isUserAdmin(me);
  const displayName = me?.name || me?.email?.split("@")[0] || "Student";
  const initials = displayName.slice(0, 2).toUpperCase();

  // In active quiz session, hide mobile UI to avoid distractions (Focus Mode)
  const isQuizActive = Boolean(pathname?.startsWith("/quiz/") && !pathname?.includes("/results"));

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  function isItemActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname?.startsWith(item.href);
  }

  const renderDesktopNavLinks = () => (
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

      {/* Admin Navigation (Desktop, only for Admin) */}
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
      {/* ── MOBILE ADMIN BOTTOM SHEET (Admin only, slides from bottom to top) ── */}
      {isAdmin && adminMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
            onClick={() => setAdminMenuOpen(false)}
          />

          {/* Bottom Sheet Drawer */}
          <div className="relative z-10 w-full max-h-[85vh] bg-card border-t border-border rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-250 flex flex-col">
            {/* Grab handle pill */}
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-foreground">Admin Menu</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                      ADMIN
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate block max-w-[200px]">
                    {me?.email}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAdminMenuOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Admin Links */}
            <div className="py-3.5 space-y-1.5 overflow-y-auto">
              <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Management Modules
              </span>
              {ADMIN_NAV_ITEMS.map((item) => {
                const active = isItemActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setAdminMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group",
                      active
                        ? "bg-foreground text-background shadow-xs font-bold"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", active ? "text-background" : "text-amber-500")} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Footer Profile, Theme Toggle & Logout */}
            <div className="pt-3 border-t border-border/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background font-bold text-xs shrink-0 shadow-2xs">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground">Admin Account</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-8 w-8 rounded-xl border-border cursor-pointer"
                  title="Toggle theme"
                  aria-label="Toggle theme"
                >
                  {!mounted ? (
                    <span className="h-3.5 w-3.5 inline-block" />
                  ) : theme === "dark" ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="h-8 px-2.5 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
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
                    "flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-xl min-w-0 flex-1 transition-all select-none",
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

            {/* Admin Hamburger Button: ONLY shown if user is Admin */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAdminMenuOpen((prev) => !prev)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-xl min-w-0 flex-1 transition-all select-none cursor-pointer",
                  adminMenuOpen || pathname?.startsWith("/admin")
                    ? "text-amber-500 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Admin Menu"
              >
                <div
                  className={cn(
                    "p-1 rounded-lg transition-all",
                    adminMenuOpen || pathname?.startsWith("/admin") ? "bg-amber-500/15 text-amber-500" : ""
                  )}
                >
                  <Menu className="h-5 w-5 shrink-0" />
                </div>
                <span className="text-[10px] font-semibold truncate max-w-full">
                  Admin
                </span>
              </button>
            )}
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
          {renderDesktopNavLinks()}
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
