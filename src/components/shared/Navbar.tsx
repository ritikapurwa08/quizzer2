"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, usePathname } from "next/navigation";
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
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { isUserAdmin } from "@/lib/constants";

export function Navbar() {
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
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
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold shrink-0 group">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
            Quizzer
          </span>
        </Link>

        {/* ── Right side: Profile Dropdown Menu ── */}
        <div className="flex items-center gap-2">

          {/* ── Profile Dropdown Menu ── */}
          {me !== undefined && (
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((p) => !p)}
                aria-label="User menu"
                className="flex items-center gap-2 h-9 px-2.5 rounded-xl border border-border/80 bg-background/80 hover:bg-muted text-foreground transition-all cursor-pointer text-xs font-semibold shadow-xs active:scale-95"
              >
                {/* Avatar chip */}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold shrink-0">
                  {initials || <User className="h-3.5 w-3.5" />}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0", profileOpen && "rotate-180")} />
              </button>

              {/* Dropdown Menu Popup */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-border bg-card shadow-xl ring-1 ring-black/5 py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                  {/* User info header */}
                  <div className="px-3.5 py-2.5 border-b border-border/70 mb-1">
                    <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{me?.email || "No email"}</p>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    )}
                  </div>

                  {/* Main Navigation Links */}
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors",
                        pathname === "/dashboard"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>

                    <Link
                      href="/bookmarks"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors",
                        pathname === "/bookmarks"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Bookmark className="h-4 w-4" />
                      Saved Bookmarks
                    </Link>

                    <Link
                      href="/wrong-questions"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors",
                        pathname === "/wrong-questions"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <History className="h-4 w-4" />
                      Wrong Questions
                    </Link>
                  </div>

                  {/* Admin Section — STRICTLY ONLY for authorized admins */}
                  {isAdmin && (
                    <>
                      <Separator className="my-1 opacity-70" />
                      <div className="py-1">
                        <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          Administration
                        </div>
                        <Link
                          href="/admin"
                          onClick={() => setProfileOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors",
                            pathname === "/admin"
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Shield className="h-4 w-4 text-primary" />
                          Admin Console
                        </Link>
                        <Link
                          href="/admin/import"
                          onClick={() => setProfileOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors",
                            pathname === "/admin/import"
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <FileUp className="h-4 w-4 text-primary" />
                          Import Questions
                        </Link>
                      </div>
                    </>
                  )}

                  {/* Sign out */}
                  <Separator className="my-1 opacity-70" />
                  <div className="pt-1 pb-0.5">
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); handleSignOut(); }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
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
