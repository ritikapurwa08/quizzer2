"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS, type NavItem } from "./navItems";

interface DesktopNavSectionProps {
  isItemActive: (item: NavItem) => boolean;
  profileOpen?: boolean;
  onOpenProfile?: () => void;
  onProfilePointerDown?: () => void;
  onProfilePointerUp?: () => void;
  onProfilePointerLeave?: () => void;
}

export function DesktopNavSection({
  isItemActive,
  profileOpen = false,
  onOpenProfile,
  onProfilePointerDown,
  onProfilePointerUp,
  onProfilePointerLeave,
}: DesktopNavSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Navigation
        </span>
        <nav className="mt-1.5 space-y-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const isProfile = item.href === "/profile";
            const active = isItemActive(item);
            const Icon = item.icon;

            const navItemClasses = cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm transition-all group select-none cursor-pointer",
              active
                ? "bg-primary/10 text-primary border border-primary/20 font-medium shadow-2xs"
                : "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground border-0 font-normal"
            );

            if (isProfile) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onPointerDown={onProfilePointerDown}
                  onPointerUp={onProfilePointerUp}
                  onPointerLeave={onProfilePointerLeave}
                  className={navItemClasses}
                  aria-label="Profile and Settings (Hold for Admin)"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={navItemClasses}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4.5 px-1.5 font-bold border-border/80"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
