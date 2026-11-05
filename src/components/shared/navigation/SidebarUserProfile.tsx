"use client";

import { Button } from "@/components/ui/button";
import { Sun, Moon, LogOut } from "lucide-react";

interface SidebarUserProfileProps {
  initials: string;
  displayName: string;
  isAdmin: boolean;
  theme?: string;
  mounted: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
}

export function SidebarUserProfile({
  initials,
  displayName,
  isAdmin,
  theme,
  mounted,
  onToggleTheme,
  onSignOut,
}: SidebarUserProfileProps) {
  return (
    <div className="p-3 border-t border-border/80 bg-muted/20">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background font-bold text-xs shrink-0 shadow-2xs">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {isAdmin ? "Admin User" : "Student"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
            aria-label="Toggle theme"
          >
            {!mounted ? (
              <span className="h-4 w-4 inline-block" />
            ) : theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
