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
  LayoutDashboard,
  LogOut,
  User,
  ChevronDown,
  Shield,
  FileUp,
  BarChart2,
  LayoutGrid,
  BookOpen,
  Layers,
  FileText,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  Sparkles,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { isUserAdmin } from "@/lib/constants";

export function Navbar() {
  const me = useQuery(api.users.me);
  const subjects = useQuery(api.subjects.list) ?? [];
  const { signOut } = useAuthActions();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [notesMenuOpen, setNotesMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notesRef.current && !notesRef.current.contains(e.target as Node)) {
        setNotesMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold shrink-0 group">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
              Quizzer
            </span>
          </Link>

          {/* ── Center Desktop Nav Links ── */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            <Link
              href="/dashboard"
              className={cn(
                "px-3 py-1.5 rounded-xl transition-colors",
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
                "px-3 py-1.5 rounded-xl transition-colors font-hindi",
                pathname.startsWith("/subjects")
                  ? "bg-muted text-foreground font-bold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              अभ्यास (Practice)
            </Link>

            {/* Notes Menu Dropdown */}
            <div ref={notesRef} className="relative">
              <button
                type="button"
                onClick={() => setNotesMenuOpen((prev) => !prev)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-xl transition-colors font-hindi cursor-pointer select-none",
                  pathname.startsWith("/notes")
                    ? "bg-muted text-foreground font-bold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <span>नोट्स (Study Notes)</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    notesMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {notesMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                  <Link
                    href="/notes"
                    onClick={() => setNotesMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl text-primary hover:bg-primary/10 transition-colors font-hindi"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>सभी नोट्स (All Study Notes)</span>
                  </Link>
                  <div className="my-1 border-t border-border/60" />
                  <div className="space-y-0.5">
                    {subjects.map((sub) => (
                      <Link
                        key={sub._id}
                        href={`/notes/${sub.slug}`}
                        onClick={() => setNotesMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground/90 hover:bg-muted/60 hover:text-foreground rounded-lg transition-colors font-hindi truncate"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                        <span className="truncate">{sub.nameHindi || sub.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* ── Right side: Profile Menu with Integrated Theme Switcher ── */}
        <div className="flex items-center gap-2">
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
                            href="/admin/subjects"
                            onClick={() => setProfileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                              pathname === "/admin/subjects"
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            Subjects
                          </Link>
                          <Link
                            href="/admin/topics"
                            onClick={() => setProfileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                              pathname === "/admin/topics"
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <Layers className="h-3.5 w-3.5" />
                            Topics
                          </Link>
                          <Link
                            href="/admin/test-sets"
                            onClick={() => setProfileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                              pathname === "/admin/test-sets"
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Test Sets
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
                      href="/notes"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors font-hindi",
                        pathname.startsWith("/notes")
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <BookOpen className="h-4 w-4" />
                      Study Notes & PDFs
                    </Link>

                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                        pathname === "/dashboard"
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
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
    </header>
  );
}
