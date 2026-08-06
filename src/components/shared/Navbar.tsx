"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { Bookmark, GraduationCap, History, LayoutDashboard, LogOut, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";

export function Navbar() {
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur-md transition-all shadow-xs">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-2.5">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold shrink-0 group">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-2xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">Quizzer</span>
        </Link>

        <div className="hidden sm:block flex-1 max-w-md">
          <SearchBar />
        </div>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          {/* Mobile search toggle button */}
          <button
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            className="p-2 rounded-lg hover:bg-muted sm:hidden text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title="Search"
            aria-label="Toggle search"
          >
            {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Dashboard">
            <LayoutDashboard className="h-5 w-5" />
          </Link>
          <Link href="/wrong-questions" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Wrong Questions">
            <History className="h-5 w-5" />
          </Link>
          <Link href="/bookmarks" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Bookmarks">
            <Bookmark className="h-5 w-5" />
          </Link>

          {me?.role === "admin" && (
            <Link href="/admin" className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all ml-1">
              Admin
            </Link>
          )}

          {me && (
            <div className="flex items-center gap-2 pl-2 border-l border-border/80 ml-1">
              <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <User className="h-3.5 w-3.5 text-primary" />
                {me.name || me.email.split("@")[0]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only text-xs font-medium">Logout</span>
              </Button>
            </div>
          )}
        </nav>
      </div>

      {mobileSearchOpen && (
        <div className="sm:hidden px-4 pb-3 pt-1 border-t border-border/50 animate-in slide-in-from-top-1">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
