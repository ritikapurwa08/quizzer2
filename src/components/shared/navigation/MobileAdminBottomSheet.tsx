"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, X, Sun, Moon, LogOut, Bookmark, ListChecks, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, type NavItem } from "./navItems";

interface MobileAdminBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  userEmail?: string;
  displayName: string;
  initials: string;
  isAdmin: boolean;
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
  isAdmin,
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background font-bold text-sm shrink-0 shadow-2xs">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-foreground truncate max-w-[170px]">
                  {displayName}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1.5 py-0 font-bold",
                    isAdmin
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {isAdmin ? "ADMIN" : "STUDENT"}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground truncate block max-w-[200px]">
                {userEmail || "Student Account"}
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

        {/* Body content */}
        <div className="py-3.5 space-y-4 overflow-y-auto">
          {/* Admin Management Section (Admin Only) */}
          {isAdmin && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Admin Console
                </span>
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="text-[10px] font-semibold text-primary flex items-center gap-0.5 hover:underline"
                >
                  Direct Dashboard <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="p-1 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-0.5">
                {ADMIN_NAV_ITEMS.map((item) => {
                  const active = isItemActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all group",
                        active
                          ? "bg-foreground text-background shadow-xs font-bold"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn("h-4 w-4", active ? "text-background" : "text-amber-500")} />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student Shortcuts */}
          <div className="space-y-1.5">
            <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Quick Shortcuts
            </span>
            <div className="space-y-1">
              <Link
                href="/saved-questions"
                onClick={onClose}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/60 bg-muted/30 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="h-4 w-4 text-primary" />
                  <span>Saved Questions</span>
                </div>
              </Link>
              <Link
                href="/syllabus"
                onClick={onClose}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/60 bg-muted/30 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <span>Syllabus Tracker</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer: Theme Toggle & Logout */}
        <div className="pt-3 border-t border-border/80 flex items-center justify-between gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleTheme}
            className="h-9 px-3 rounded-xl gap-2 text-xs font-semibold cursor-pointer border-border"
          >
            {!mounted ? (
              <span className="h-4 w-4 inline-block" />
            ) : theme === "dark" ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-blue-500" />
                Dark Mode
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSignOut}
            className="h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
