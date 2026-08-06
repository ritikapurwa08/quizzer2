"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, usePathname } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { Bookmark, GraduationCap, History, LayoutDashboard, LogOut, Search, User, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/wrong-questions", icon: History, label: "Wrong Questions" },
  { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
];

export function Navbar() {
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold shrink-0 group">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground hidden sm:block group-hover:text-primary transition-colors">
            Quizzer
          </span>
        </Link>

        {/* Desktop search — always visible, max-width ~380px */}
        <div className="hidden sm:block flex-1 max-w-sm">
          <SearchBar />
        </div>

        {/* Nav actions */}
        <nav className="ml-auto flex items-center gap-0.5">
          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground sm:hidden transition-colors cursor-pointer"
            aria-label="Toggle search"
          >
            {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          {/* Nav icon links */}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <link.icon className="h-5 w-5" />
            </Link>
          ))}

          {/* Admin pill */}
          {me?.role === "admin" && (
            <Link
              href="/admin"
              className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ml-1 shadow-xs"
            >
              Admin
            </Link>
          )}

          {/* User + Logout */}
          {me && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-border ml-1.5">
              <span className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <User className="h-3.5 w-3.5" />
                {me.name || me.email.split("@")[0]}
              </span>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="flex h-9 items-center gap-1.5 px-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-xs font-medium cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Mobile search drawer */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-4 pb-3 pt-1 border-t border-border/60 animate-in slide-in-from-top-1">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
