"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, X, Sun, Moon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, type NavItem } from "./navItems";

interface MobileAdminBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  userEmail?: string;
  displayName: string;
  initials: string;
  theme?: string;
  mounted: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
  isItemActive: (item: NavItem) => boolean;
}

export function MobileAdminBottomSheet({
  isOpen,
  onClose,
  pathname,
  userEmail,
  displayName,
  initials,
  theme,
  mounted,
  onToggleTheme,
  onSignOut,
  isItemActive,
}: MobileAdminBottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
        onClick={onClose}
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
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                >
                  ADMIN
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground truncate block max-w-[200px]">
                {userEmail}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
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
                onClick={onClose}
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
              onClick={onToggleTheme}
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
              onClick={onSignOut}
              className="h-8 px-2.5 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
