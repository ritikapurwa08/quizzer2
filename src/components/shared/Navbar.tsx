"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { Bookmark, GraduationCap, History, LayoutDashboard, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";

export function Navbar() {
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold shrink-0">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="font-bold tracking-tight">Quizzer</span>
        </Link>

        <div className="hidden sm:block flex-1">
          <SearchBar />
        </div>

        <nav className="ml-auto flex items-center gap-1.5 text-sm">
          <Link href="/dashboard" className="p-2 rounded-md hover:bg-muted" title="Dashboard">
            <LayoutDashboard className="h-5 w-5" />
          </Link>
          <Link href="/wrong-questions" className="p-2 rounded-md hover:bg-muted" title="Wrong Questions">
            <History className="h-5 w-5" />
          </Link>
          <Link href="/bookmarks" className="p-2 rounded-md hover:bg-muted" title="Bookmarks">
            <Bookmark className="h-5 w-5" />
          </Link>

          {me?.role === "admin" && (
            <Link href="/admin" className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground">
              Admin
            </Link>
          )}

          {me && (
            <div className="flex items-center gap-2 pl-2 border-l border-border ml-1">
              <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <User className="h-3.5 w-3.5" />
                {me.name || me.email.split("@")[0]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only text-xs">Logout</span>
              </Button>
            </div>
          )}
        </nav>
      </div>

      <div className="sm:hidden px-4 pb-3">
        <SearchBar />
      </div>
    </header>
  );
}
