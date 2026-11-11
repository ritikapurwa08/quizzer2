"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS, type NavItem } from "./navItems";

interface MobileBottomNavBarProps {
  pathname: string;
  isItemActive: (item: NavItem) => boolean;
  profileOpen?: boolean;
  onOpenProfile?: () => void;
  onProfilePointerDown?: () => void;
  onProfilePointerUp?: () => void;
  onProfilePointerLeave?: () => void;
}

export function MobileBottomNavBar({
  pathname,
  isItemActive,
  profileOpen = false,
  onOpenProfile,
  onProfilePointerDown,
  onProfilePointerUp,
  onProfilePointerLeave,
}: MobileBottomNavBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-md safe-bottom shadow-lg print:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5 items-center px-1.5 py-1.5 gap-1">
        {MAIN_NAV_ITEMS.map((item) => {
          const isProfile = item.href === "/profile";
          const active = isItemActive(item);
          const Icon = item.icon;

          const pillContent = (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-1.5 px-1 rounded-xl transition-all select-none border-0",
                active
                  ? "bg-primary/10 text-primary border border-primary/20 font-medium shadow-2xs"
                  : "bg-transparent text-muted-foreground hover:text-foreground border-0 font-normal"
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10.5px] leading-tight truncate max-w-full font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </div>
          );

          if (isProfile) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onPointerDown={onProfilePointerDown}
                onPointerUp={onProfilePointerUp}
                onPointerLeave={onProfilePointerLeave}
                className="w-full flex items-center justify-center cursor-pointer border-0"
                aria-label="User Profile (Hold for Admin)"
              >
                {pillContent}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="w-full flex items-center justify-center cursor-pointer border-0"
              aria-current={active ? "page" : undefined}
            >
              {pillContent}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
