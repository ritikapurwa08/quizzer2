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
        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Navigation
        </span>
        <nav className="mt-1 space-y-1">
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
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group select-none cursor-pointer border",
                    active
                      ? "bg-zinc-800/90 text-zinc-100 border-zinc-700/80 shadow-2xs font-semibold"
                      : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border-transparent"
                  )}
                  aria-label="Profile and Settings (Hold for Admin)"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                        active ? "text-primary" : "text-zinc-400 group-hover:text-zinc-200"
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
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group select-none border",
                  active
                    ? "bg-zinc-800/90 text-zinc-100 border-zinc-700/80 shadow-2xs font-semibold"
                    : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                      active ? "text-primary" : "text-zinc-400 group-hover:text-zinc-200"
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
