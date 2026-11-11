"use client";

import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { isUserAdmin } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import {
  User,
  Shield,
  Sun,
  Moon,
  LogOut,
  Flame,
  CheckCircle2,
  Bookmark,
  Percent,
  ListChecks,
  History,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function ProfilePage() {
  const me = useQuery(api.users.me);
  const stats = useQuery(api.analytics.dashboardStats, {});
  const { signOut } = useAuthActions();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const isAdmin = isUserAdmin(me);
  const displayName = me?.name || me?.email?.split("@")[0] || "Candidate";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "User Profile" },
        ]}
      />

      {/* ── User Profile Header Card ── */}
      <Card className="p-5 sm:p-6 rounded-md border border-border bg-card shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-foreground text-background font-bold text-xl shrink-0 shadow-xs">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {displayName}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    isAdmin
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold"
                      : "bg-secondary text-secondary-foreground border-border font-semibold"
                  }
                >
                  {isAdmin ? "ADMIN" : "CANDIDATE"}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {me?.email || "Student Account"}
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>RPSC Senior Teacher (2nd Grade) Exam Preparation</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-md border-border text-xs gap-1.5 h-9 cursor-pointer"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-blue-500" />
                  <span>Dark Mode</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="rounded-md border-border text-destructive hover:bg-destructive/10 hover:border-destructive/30 text-xs gap-1.5 h-9 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Quick Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 rounded-md border border-border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Questions Solved</span>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-foreground block tabular-nums">
            {stats?.questionsSolved?.toLocaleString("en-IN") ?? "0"}
          </span>
          <span className="text-[11px] text-muted-foreground">Across verified sets</span>
        </Card>

        <Card className="p-4 rounded-md border border-border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Accuracy %</span>
            <Percent className="h-4 w-4 text-emerald-500" />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-foreground block tabular-nums">
            {stats?.overallAccuracy !== undefined ? `${stats.overallAccuracy.toFixed(1)}%` : "0.0%"}
          </span>
          <span className="text-[11px] text-muted-foreground">Overall performance</span>
        </Card>

        <Card className="p-4 rounded-md border border-border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Saved Items</span>
            <Bookmark className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-foreground block tabular-nums">
            {stats?.bookmarkCount ?? 0}
          </span>
          <span className="text-[11px] text-muted-foreground">Bookmarks &amp; wrong Qs</span>
        </Card>

        <Card className="p-4 rounded-md border border-border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Study Streak</span>
            <Flame className="h-4 w-4 text-rose-500" />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-foreground block tabular-nums">
            3 <span className="text-xs font-normal text-muted-foreground">Days</span>
          </span>
          <span className="text-[11px] text-muted-foreground">Active consistency</span>
        </Card>
      </div>

      {/* ── Quick Study Navigation ── */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Study &amp; Revision Shortcuts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/syllabus" className="group block">
            <Card className="p-4 rounded-md border border-border bg-card shadow-xs hover:border-primary/50 transition-all cursor-pointer space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-sm bg-primary/10 text-primary">
                  <ListChecks className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Syllabus Tracker</p>
                <p className="text-xs text-muted-foreground">55 Master topics checklist &amp; progress</p>
              </div>
            </Card>
          </Link>

          <Link href="/saved-questions" className="group block">
            <Card className="p-4 rounded-md border border-border bg-card shadow-xs hover:border-primary/50 transition-all cursor-pointer space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-sm bg-amber-500/10 text-amber-500">
                  <Bookmark className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Saved &amp; Review</p>
                <p className="text-xs text-muted-foreground">Wrong questions &amp; bookmarked tests</p>
              </div>
            </Card>
          </Link>

          <Link href="/history" className="group block">
            <Card className="p-4 rounded-md border border-border bg-card shadow-xs hover:border-primary/50 transition-all cursor-pointer space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-sm bg-emerald-500/10 text-emerald-500">
                  <History className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Test History</p>
                <p className="text-xs text-muted-foreground">Review previous attempts &amp; answer sheets</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* ── Admin Management Portal (Admin Users Only) ── */}
      {isAdmin && (
        <Card className="p-5 rounded-md border border-amber-500/30 bg-amber-500/5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-foreground">Admin Quick Console</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            You have administrator privileges. Manage question pools and test sets.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button asChild size="sm" variant="default" className="rounded-md text-xs font-semibold">
              <Link href="/admin">Admin Dashboard</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-md border-border text-xs font-semibold">
              <Link href="/admin/questions">Question Editor</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-md border-border text-xs font-semibold">
              <Link href="/admin/pool">55 Topic Pool</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-md border-border text-xs font-semibold">
              <Link href="/admin/import">Import Test Set</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
