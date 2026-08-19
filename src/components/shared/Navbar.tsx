"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, usePathname } from "next/navigation";
import { SearchBar } from "./SearchBar";
import {
  Bookmark,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Search,
  User,
  X,
  ChevronDown,
  Shield,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ADMIN_EMAILS } from "@/lib/constants";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin =
    me?.role === "admin" ||
    (me?.email ? ADMIN_EMAILS.has(me.email.toLowerCase()) : false);

  const displayName = me?.name || me?.email?.split("@")[0] || "";
  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">

        {/* ── Brand / Logo ── */}
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold shrink-0 group">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground hidden sm:block group-hover:text-primary transition-colors">
            Quizzer
          </span>
        </Link>

        {/* ── Desktop search ── */}
        <div className="hidden sm:block flex-1 max-w-sm">
          <SearchBar />
        </div>

        {/* ── Nav actions ── */}
        <nav className="ml-auto flex items-center gap-0.5">

          {/* Mobile search toggle */}
          <Tooltip>
            <TooltipTrigger
              aria-label="Toggle search"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className="sm:hidden flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </TooltipTrigger>
            <TooltipContent>Search</TooltipContent>
          </Tooltip>

          {/* Nav icon links */}
          {NAV_LINKS.map((link) => (
            <Tooltip key={link.href}>
              <TooltipTrigger
                onClick={() => router.push(link.href)}
                aria-label={link.label}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition-colors cursor-pointer",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon className="h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent>{link.label}</TooltipContent>
            </Tooltip>
          ))}

          {/* Admin pill — only shown for authorized users */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ml-1 shadow-xs"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}

          {/* ── Profile Dropdown ── */}
          {me && (
            <>
              <Separator orientation="vertical" className="mx-2 h-5" />

              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((p) => !p)}
                  aria-label="User menu"
                  className="flex items-center gap-2 h-9 px-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer text-xs font-medium"
                >
                  {/* Avatar chip */}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                    {initials || <User className="h-4 w-4" />}
                  </span>
                  <span className="hidden sm:block max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform shrink-0", profileOpen && "rotate-180")} />
                </button>

                {/* Dropdown menu */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border bg-card shadow-lg ring-1 ring-black/5 py-1.5 z-50">
                    {/* User info */}
                    <div className="px-3 py-2 border-b border-border/60 mb-1">
                      <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{me.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          <Shield className="h-2.5 w-2.5" /> Admin
                        </span>
                      )}
                    </div>

                    {/* Admin console link */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Shield className="h-4 w-4 text-primary" />
                        Admin Console
                      </Link>
                    )}

                    {/* Sign out */}
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); handleSignOut(); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
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
