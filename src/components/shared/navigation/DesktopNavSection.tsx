"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDENT_NAV_ITEMS, ADMIN_NAV_ITEMS, type NavItem } from "./navItems";

interface DesktopNavSectionProps {
  isAdmin: boolean;
  isItemActive: (item: NavItem) => boolean;
}

export function DesktopNavSection({ isAdmin, isItemActive }: DesktopNavSectionProps) {
  return (
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
                      active
                        ? "text-background"
                        : "text-muted-foreground group-hover:text-foreground"
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
                        active
                          ? "text-background"
                          : "text-muted-foreground group-hover:text-foreground"
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
}

