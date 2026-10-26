"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bookmark,
  GraduationCap,
  History,
  LogOut,
  User,
  ChevronDown,
  Shield,
  FileUp,
  BarChart2,
  LayoutGrid,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  BookOpen,
  ListChecks,
  Database,
  Menu,
  X,
  RotateCcw,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { isUserAdmin } from "@/lib/constants";
import { QuizzerLogoIcon } from "@/components/icons/QuizzerIcons";

export function Navbar() {
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or route change
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const isAdmin = isUserAdmin(me);
  const displayName = me?.name || me?.email?.split("@")[0] || "Student";
  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
        {/* ── Brand / Logo ── */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold shrink-0 group">
            <QuizzerLogoIcon className="h-7 w-7 transition-transform group-hover:scale-105" />
            <span className="font-semibold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
              Quizzer
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 text-xs font-semibold">
            <Link
              href="/dashboard"
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-colors",
                pathname === "/dashboard"
                  ? "bg-muted text-foreground font-bold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/subjects"
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-colors",
                pathname?.startsWith("/subjects")
                  ? "bg-muted text-foreground font-bold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              Subjects
            </Link>
            <Link
              href="/syllabus"
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-colors",
                pathname === "/syllabus"
                  ? "bg-muted text-foreground font-bold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              Syllabus
            </Link>
            <Link
              href="/history"
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-colors",
                pathname === "/history"
                  ? "bg-muted text-foreground font-bold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              History
            </Link>
            <Link
              href="/wrong-questions"
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-colors",
                pathname === "/wrong-questions"
                  ? "bg-muted text-foreground font-bold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              Wrong Qs
            </Link>
            <Link
              href="/bookmarks"
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-colors",
                pathname === "/bookmarks"
                  ? "bg-muted text-foreground font-bold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              Bookmarks
            </Link>
            <Link
              href="/analytics"
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-colors",
                pathname === "/analytics"
                  ? "bg-muted text-foreground font-bold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              Analytics
            </Link>
          </nav>
        </div>

        {/* ── Right side: Mobile Menu Button + Profile Menu ── */}
        <div className="flex items-center gap-2">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Open Navigation Menu"
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-border/80 bg-background/80 hover:bg-muted text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>

          {me !== undefined && (
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((p) => !p)}
                aria-label="User menu"
                className="flex items-center gap-2 h-9 px-2.5 rounded-xl border border-border/80 bg-background/80 hover:bg-muted text-foreground transition-all cursor-pointer text-xs font-medium shadow-xs active:scale-95"
              >
                {/* Avatar chip */}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-foreground text-[10px] font-bold shrink-0">
                  {initials || <User className="h-3.5 w-3.5" />}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate">
                  {displayName}
                </span>
                {isAdmin && (
                  <Shield className="h-3 w-3 text-primary shrink-0 hidden sm:inline" />
                )}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                    profileOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Dropdown Menu Popup */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden">
                  {/* 1. Theme Switcher Segmented Control (Top) */}
                  <div className="p-2.5 border-b border-border/70 bg-muted/30">
                    <div className="grid grid-cols-3 gap-1 bg-muted/80 p-1 rounded-xl border border-border/50">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={cn(
                          "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer select-none",
                          theme === "light"
                            ? "bg-background text-foreground shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Light Theme"
                      >
                        <Sun className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={cn(
                          "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer select-none",
                          theme === "dark"
                            ? "bg-background text-foreground shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Dark Theme"
                      >
                        <Moon className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Dark</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("system")}
                        className={cn(
                          "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer select-none",
                          theme === "system"
                            ? "bg-background text-foreground shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title="System Preference"
                      >
                        <Monitor className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Auto</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Admin Expandable Section (If Admin) */}
                  {isAdmin && (
                    <div className="border-b border-border/70">
                      <button
                        type="button"
                        onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-primary" />
                          <span>Administration</span>
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 text-muted-foreground transition-transform",
                            adminMenuOpen && "rotate-180"
                          )}
                        />
                      </button>

                      {adminMenuOpen && (
                        <div className="px-1.5 pb-1.5 space-y-0.5 bg-muted/20 animate-in fade-in-0 duration-100">
                          <Link
                            href="/admin"
                            onClick={() => setProfileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                              pathname === "/admin"
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            Admin Overview
                          </Link>
                          <Link
                            href="/admin/pool"
                            onClick={() => setProfileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                              pathname === "/admin/pool"
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <Database className="h-3.5 w-3.5" />
                            55 Topics Question Pool
                          </Link>
                          <Link
                            href="/admin/import"
                            onClick={() => setProfileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                              pathname === "/admin/import"
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <FileUp className="h-3.5 w-3.5" />
                            Import Questions
                          </Link>
                          <Link
                            href="/admin/questions"
                            onClick={() => setProfileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                              pathname === "/admin/questions"
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                            Questions
                          </Link>
                          <Link
                            href="/admin/notes"
                            onClick={() => setProfileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors font-hindi",
                              pathname === "/admin/notes"
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Notes & PDFs
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Main Navigation Links (English) */}
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/syllabus"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                        pathname === "/syllabus"
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <ListChecks className="h-4 w-4" />
                      Syllabus Tracker
                    </Link>

                    <Link
                      href="/analytics"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                        pathname === "/analytics"
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <BarChart2 className="h-4 w-4" />
                      Analytics & Progress
                    </Link>

                    <Link
                      href="/bookmarks"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                        pathname === "/bookmarks"
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <Bookmark className="h-4 w-4" />
                      Saved Bookmarks
                    </Link>

                    <Link
                      href="/wrong-questions"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                        pathname === "/wrong-questions"
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <History className="h-4 w-4" />
                      Wrong Questions Practice
                    </Link>

                    <Link
                      href="/history"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                        pathname === "/history"
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <History className="h-4 w-4" />
                      Test History
                    </Link>
                  </div>

                  {/* 4. Compact User Footer with Logout Icon Button */}
                  <div className="border-t border-border/70 p-2.5 flex items-center justify-between gap-2 bg-muted/40">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                        {initials || <User className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                          {isAdmin && (
                            <span title="Admin">
                              <Shield className="h-3 w-3 text-primary shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{me?.email || ""}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        handleSignOut();
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
                      title="Log Out"
                      aria-label="Log Out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Navigation Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card border-r border-border p-4 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200 overflow-y-auto">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 font-semibold"
                >
                  <QuizzerLogoIcon className="h-6 w-6" />
                  <span className="font-semibold text-base tracking-tight text-foreground">
                    Quizzer
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Identity Chip */}
              {me && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/50">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {initials || <User className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{me.email || ""}</p>
                  </div>
                  {isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold border border-primary/20 shrink-0">
                      ADMIN
                    </span>
                  )}
                </div>
              )}

              {/* Navigation Links Group 1: Learning */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                  Study & Syllabus
                </p>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                    pathname === "/dashboard"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="h-4 w-4 shrink-0" />
                  Dashboard
                </Link>
                <Link
                  href="/subjects"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                    pathname?.startsWith("/subjects")
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  Subjects
                </Link>
                <Link
                  href="/syllabus"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                    pathname === "/syllabus"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <ListChecks className="h-4 w-4 shrink-0" />
                  Syllabus Tracker
                </Link>
              </div>

              {/* Navigation Links Group 2: Practice & Revision */}
              <div className="space-y-1 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                  Practice & Revision
                </p>
                <Link
                  href="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                    pathname === "/history"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <History className="h-4 w-4 shrink-0" />
                  Test History
                </Link>
                <Link
                  href="/wrong-questions"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                    pathname === "/wrong-questions"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <RotateCcw className="h-4 w-4 shrink-0" />
                  Wrong Questions
                </Link>
                <Link
                  href="/bookmarks"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                    pathname === "/bookmarks"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Bookmark className="h-4 w-4 shrink-0" />
                  Saved Bookmarks
                </Link>
                <Link
                  href="/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                    pathname === "/analytics"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <BarChart2 className="h-4 w-4 shrink-0" />
                  Analytics & Progress
                </Link>
              </div>

              {/* Navigation Links Group 3: Admin Console (If Admin) */}
              {isAdmin && (
                <div className="space-y-1 pt-1 border-t border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    Admin Console
                  </p>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                      pathname === "/admin"
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4 shrink-0" />
                    Admin Overview
                  </Link>
                  <Link
                    href="/admin/pool"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                      pathname === "/admin/pool"
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Database className="h-4 w-4 shrink-0" />
                    55 Topics Pool
                  </Link>
                  <Link
                    href="/admin/import"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                      pathname === "/admin/import"
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <FileUp className="h-4 w-4 shrink-0" />
                    Import Questions
                  </Link>
                  <Link
                    href="/admin/questions"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                      pathname === "/admin/questions"
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    Question Bank
                  </Link>
                  <Link
                    href="/admin/notes"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors",
                      pathname === "/admin/notes"
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    Notes & PDFs
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Bottom: Theme Switcher & Logout */}
            <div className="pt-4 border-t border-border/70 space-y-3">
              {/* Theme Switcher */}
              <div className="grid grid-cols-3 gap-1 bg-muted/80 p-1 rounded-xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    theme === "light"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    theme === "dark"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    theme === "system"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Auto</span>
                </button>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
