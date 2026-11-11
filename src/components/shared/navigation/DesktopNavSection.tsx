"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS, type NavItem } from "./navItems";

interface DesktopNavSectionProps {
  isItemActive: (item: NavItem) => boolean;
  profileOpen?: boolean;
  onOpenProfile: () => void;
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
            const isProfile = item.href === "#profile";
            const active = isProfile ? profileOpen : isItemActive(item);
            const Icon = item.icon;

            if (isProfile) {
              return (
                <button
                  key="profile"
                  type="button"
                  onClick={onOpenProfile}
                  onPointerDown={onProfilePointerDown}
                  onPointerUp={onProfilePointerUp}
                  onPointerLeave={onProfilePointerLeave}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group select-none cursor-pointer border-0",
                    active
                      ? "bg-foreground text-background shadow-xs font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  aria-label="Profile and Settings (Hold for Admin)"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                        active ? "text-background" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group select-none border-0",
                  active
                    ? "bg-foreground text-background shadow-xs font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                      active ? "text-background" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className="text-[10px] h-4.5 px-1.5 font-bold border-0"
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
