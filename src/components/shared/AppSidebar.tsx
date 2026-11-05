"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useTheme } from "next-themes";
import { api } from "../../../convex/_generated/api";
import { isUserAdmin } from "@/lib/constants";
import { QuizzerLogoIcon } from "@/components/icons/QuizzerIcons";
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

  return (
    <>
      {/* ── MOBILE ADMIN BOTTOM SHEET (Admin only) ── */}
      {isAdmin && (
        <MobileAdminBottomSheet
          isOpen={adminMenuOpen}
          onClose={() => setAdminMenuOpen(false)}
          pathname={pathname || ""}
          userEmail={me?.email}
          displayName={displayName}
          initials={initials}
          theme={theme}
          mounted={mounted}
          onToggleTheme={handleToggleTheme}
          onSignOut={handleSignOut}
          isItemActive={isItemActive}
        />
      )}

      {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
      {!isQuizActive && (
        <MobileBottomNavBar
          pathname={pathname || ""}
          isAdmin={isAdmin}
          adminMenuOpen={adminMenuOpen}
          onToggleAdminMenu={() => setAdminMenuOpen((prev) => !prev)}
          isItemActive={isItemActive}
        />
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
