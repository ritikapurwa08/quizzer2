"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS, type NavItem } from "./navItems";

interface MobileBottomNavBarProps {
  pathname: string;
  isItemActive: (item: NavItem) => boolean;
  profileOpen?: boolean;
  onOpenProfile: () => void;
}

export function MobileBottomNavBar({
  pathname,
  isItemActive,
  profileOpen = false,
  onOpenProfile,
}: MobileBottomNavBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-md safe-bottom print:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5 items-center px-1 py-1">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isProfile = item.href === "#profile";
          const active = isProfile ? profileOpen : isItemActive(item);
          const Icon = item.icon;

          if (isProfile) {
            return (
              <button
                key="profile"
                type="button"
                onClick={onOpenProfile}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl min-w-0 w-full transition-all select-none cursor-pointer",
                  active ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="User Profile and Settings"
              >
                <div className={cn("p-1 rounded-lg transition-all", active ? "bg-foreground/10 text-foreground" : "")}>
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold truncate max-w-full",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl min-w-0 w-full transition-all select-none",
                active ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <div className={cn("p-1 rounded-lg transition-all", active ? "bg-foreground/10" : "")}>
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold truncate max-w-full",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
