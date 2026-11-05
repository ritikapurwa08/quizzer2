"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS, type NavItem } from "./navItems";

interface MobileBottomNavBarProps {
  pathname: string;
  isAdmin: boolean;
  adminMenuOpen: boolean;
  onToggleAdminMenu: () => void;
  isItemActive: (item: NavItem) => boolean;
}

export function MobileBottomNavBar({
  pathname,
  isAdmin,
  adminMenuOpen,
  onToggleAdminMenu,
  isItemActive,
}: MobileBottomNavBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-md safe-bottom print:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-1 py-1">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-xl min-w-0 flex-1 transition-all select-none",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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

        {/* Admin Hamburger Button: ONLY shown if user is Admin */}
        {isAdmin && (
          <button
            type="button"
            onClick={onToggleAdminMenu}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-xl min-w-0 flex-1 transition-all select-none cursor-pointer",
              adminMenuOpen || pathname?.startsWith("/admin")
                ? "text-amber-500 font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Admin Menu"
          >
            <div
              className={cn(
                "p-1 rounded-lg transition-all",
                adminMenuOpen || pathname?.startsWith("/admin")
                  ? "bg-amber-500/15 text-amber-500"
                  : ""
              )}
            >
              <Menu className="h-5 w-5 shrink-0" />
            </div>
            <span className="text-[10px] font-semibold truncate max-w-full">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
}
