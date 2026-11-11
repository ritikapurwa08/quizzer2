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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Shield, ArrowRight, Layers, Pencil, FileUp, Sparkles } from "lucide-react";
import {
  type NavItem,
  MobileAdminBottomSheet,
  MobileBottomNavBar,
  DesktopNavSection,
  SidebarUserProfile,
  ADMIN_NAV_ITEMS,
} from "./navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close modals on route change
  useEffect(() => {
    setProfileOpen(false);
    setAdminDialogOpen(false);
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

  // ── Keyboard Shortcut: Ctrl + Shift + A -> Admin Dialog ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        if (isAdmin) {
          setAdminDialogOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdmin]);

  // ── 600ms Long-Press (Hold) on Profile to Unlock Admin ──
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleProfilePointerDown = useCallback(() => {
    if (!isAdmin) return;
    holdTimerRef.current = setTimeout(() => {
      setAdminDialogOpen(true);
    }, 600);
  }, [isAdmin]);

  const handleProfilePointerUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const handleProfilePointerLeave = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  return (
    <>
      {/* ── MOBILE USER PROFILE BOTTOM SHEET (Standard Student / Candidate Profile) ── */}
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

      {/* ── MOBILE BOTTOM NAVIGATION BAR (Strictly 5 items, grid-cols-5, zero top bar) ── */}
      {!isQuizActive && (
        <MobileBottomNavBar
          pathname={pathname || ""}
          isItemActive={isItemActive}
          profileOpen={profileOpen}
          onOpenProfile={() => setProfileOpen(true)}
          onProfilePointerDown={handleProfilePointerDown}
          onProfilePointerUp={handleProfilePointerUp}
          onProfilePointerLeave={handleProfilePointerLeave}
        />
      )}

      {/* ── DESKTOP PERSISTENT SIDEBAR (100% Student-Identical View) ── */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-0 bg-card shadow-xs print:hidden">
        {/* Brand header */}
        <div className="p-4 flex items-center justify-between border-0">
          <Link href="/dashboard" className="flex items-center">
            <BrandLogo size="md" />
          </Link>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-3.5 scrollbar-thin">
          <DesktopNavSection
            isItemActive={isItemActive}
            profileOpen={profileOpen}
            onOpenProfile={() => setProfileOpen(true)}
            onProfilePointerDown={handleProfilePointerDown}
            onProfilePointerUp={handleProfilePointerUp}
            onProfilePointerLeave={handleProfilePointerLeave}
          />
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
          onProfilePointerDown={handleProfilePointerDown}
          onProfilePointerUp={handleProfilePointerUp}
          onProfilePointerLeave={handleProfilePointerLeave}
        />
      </aside>

      {/* ── UNLOCKED ADMIN MODAL (Clean border-0 Dialog with ONLY 4 Admin Links) ── */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-card border-0 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Admin Console
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Authorized access unlocked via Profile Hold or shortcut.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAdminDialogOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted text-foreground transition-all group border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-card shadow-2xs text-primary group-hover:scale-105 transition-transform">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{item.href}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
