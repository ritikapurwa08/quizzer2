"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useTheme } from "next-themes";
import { api } from "../../../convex/_generated/api";
import { isUserAdmin } from "@/lib/constants";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  type NavItem,
  MobileAdminBottomSheet,
  MobileBottomNavBar,
  DesktopNavSection,
  SidebarUserProfile,
} from "./navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close profile bottom sheet on route change
  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  const isAdmin = isUserAdmin(me);
  const displayName = me?.name || me?.email?.split("@")[0] || "Student";
  const initials = displayName.slice(0, 2).toUpperCase();

  // In active quiz session, hide mobile UI to avoid distractions (Focus Mode)
  const isQuizActive = Boolean(pathname?.startsWith("/quiz/") && !pathname?.includes("/results"));

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isItemActive = useCallback(
    (item: NavItem) => {
      if (item.exact) return pathname === item.href;
      return pathname?.startsWith(item.href);
    },
    [pathname]
  );

  // ── Keyboard shortcut: Ctrl + Shift + A -> /admin ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        if (isAdmin) {
          router.push("/admin");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdmin, router]);

  // ── Double-click / Long-press Admin Trigger ──
  const handleAdminTrigger = useCallback(() => {
    if (isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, router]);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback(() => {
    if (!isAdmin) return;
    longPressTimerRef.current = setTimeout(() => {
      handleAdminTrigger();
    }, 600);
  }, [isAdmin, handleAdminTrigger]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  return (
    <>
      {/* ── MOBILE TOP HEADER BAR (Mobile only, hidden during quiz) ── */}
      {!isQuizActive && (
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 border-b border-border/80 bg-card/95 backdrop-blur-md safe-top print:hidden">
          <div
            onDoubleClick={handleAdminTrigger}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="cursor-pointer"
            title={isAdmin ? "Quizzer (Double-tap or Long-press for Admin)" : "Quizzer"}
          >
            <Link href="/dashboard" className="flex items-center">
              <BrandLogo size="sm" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            onDoubleClick={handleAdminTrigger}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex items-center gap-2 p-1 pl-2.5 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted transition-colors cursor-pointer"
            aria-label="Profile and Settings"
            title={isAdmin ? "Profile (Double-tap for Admin)" : "Profile"}
          >
            <span className="text-xs font-semibold text-foreground max-w-[90px] truncate">
              {displayName}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background font-bold text-xs shadow-2xs">
              {initials}
            </div>
          </button>
        </header>
      )}

      {/* ── MOBILE USER PROFILE & ADMIN BOTTOM SHEET ── */}
      <MobileAdminBottomSheet
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        pathname={pathname || ""}
        userEmail={me?.email}
        displayName={displayName}
        initials={initials}
        isAdmin={isAdmin}
        theme={theme}
        mounted={mounted}
        onToggleTheme={handleToggleTheme}
        onSignOut={handleSignOut}
        isItemActive={isItemActive}
      />

      {/* ── MOBILE BOTTOM NAVIGATION BAR (Strictly 5 items, grid-cols-5) ── */}
      {!isQuizActive && (
        <MobileBottomNavBar
          pathname={pathname || ""}
          isItemActive={isItemActive}
          profileOpen={profileOpen}
          onOpenProfile={() => setProfileOpen(true)}
        />
      )}

      {/* ── DESKTOP PERSISTENT SIDEBAR ── */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-border bg-card print:hidden">
        {/* Brand header */}
        <div className="p-4 border-b border-border/80 flex items-center justify-between">
          <div
            onDoubleClick={handleAdminTrigger}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="cursor-pointer"
            title={isAdmin ? "Quizzer (Double-click or Ctrl+Shift+A for Admin)" : "Quizzer"}
          >
            <Link href="/dashboard" className="flex items-center">
              <BrandLogo size="md" />
            </Link>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-3.5 scrollbar-thin">
          <DesktopNavSection isAdmin={isAdmin} isItemActive={isItemActive} />
        </div>

        {/* Footer: User profile, compact theme toggle & sign out */}
        <SidebarUserProfile
          initials={initials}
          displayName={displayName}
          isAdmin={isAdmin}
          theme={theme}
          mounted={mounted}
          onToggleTheme={handleToggleTheme}
          onSignOut={handleSignOut}
        />
      </aside>
    </>
  );
}
