"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import {
  CheckCircle2,
  Percent,
  Bookmark,
  Flame,
  Sun,
  Moon,
  ArrowRight,
  BookOpen,
  Compass,
  Globe,
  TrendingUp,
  Landmark,
  Radio,
  FileCheck2,
  Lock,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAccuracy } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import { ContinuePracticeCard } from "@/components/dashboard/ContinuePracticeCard";
import { SyllabusOverviewCard } from "@/components/dashboard/SyllabusOverviewCard";
import { ResultHistoryItem } from "@/components/shared/ResultHistoryItem";
import { EmptyState } from "@/components/shared/EmptyState";

export default function DashboardPage() {
  const me = useQuery(api.users.me);
  const stats = useQuery(api.analytics.dashboardStats, {});
  const recent = useQuery(api.attempts.recentByUser, { limit: 5 });
  const subjects = useQuery(api.subjects.list);
  const { theme, setTheme } = useTheme();

  const displayName = me?.name ? me.name.split(" ")[0] : "Student";

  // Filter Rajasthan GK subjects from the list
  const rajasthanSubjects = (subjects || []).filter(
    (s) => !s.name.toLowerCase().includes("english")
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8 pb-16">
      {/* ── Top Row & Quick Metrics Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="typo-h1 text-foreground">
              Welcome back, {displayName}
            </h1>
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
          </div>
          <p className="typo-small text-muted-foreground mt-0.5">
            Your personalized RPSC 2nd Grade GK exam revision &amp; practice command center.
          </p>
        </div>

        {/* Right side: Streak Badge + Light/Dark Theme Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 shadow-2xs typo-small font-bold">
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>3-Day Streak</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-xl bg-card text-muted-foreground hover:text-foreground border-0 shadow-xs cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-500" />}
          </Button>
        </div>
      </div>

      {/* ── 4 Stat Cards: Desktop 4-col / Mobile 2x2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 rounded-2xl border-0 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Questions Solved</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="typo-display text-foreground block">
              {stats ? stats.questionsSolved.toLocaleString("en-IN") : <Skeleton className="h-8 w-20" />}
            </span>
            <span className="text-[11px] text-muted-foreground">Across verified sets</span>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-0 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Accuracy %</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="typo-display text-foreground block">
              {stats ? formatAccuracy(stats.overallAccuracy) : <Skeleton className="h-8 w-20" />}
            </span>
            <span className="text-[11px] text-muted-foreground">Overall success rate</span>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-0 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Saved Items</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Bookmark className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="typo-display text-foreground block">
              {stats ? stats.bookmarkCount : <Skeleton className="h-8 w-16" />}
            </span>
            <span className="text-[11px] text-muted-foreground">Bookmarks &amp; wrong Qs</span>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-0 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Active Streak</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="typo-display text-foreground block">
              3 <span className="typo-h3 font-medium text-muted-foreground">Days</span>
            </span>
            <span className="text-[11px] text-muted-foreground">Daily practice consistency</span>
          </div>
        </Card>
      </div>

      {/* ── Continue Practice Shortcut ── */}
      <section aria-label="Continue Practice">
        <ContinuePracticeCard />
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1: RAJASTHAN GENERAL KNOWLEDGE (ACTIVE)
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Rajasthan General Knowledge" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="typo-h2 text-foreground">Rajasthan General Knowledge</h2>
            <p className="typo-small text-muted-foreground">
              Official 55 Master Topics across 4 Canonical Subjects (RPSC Senior Teacher 2nd Grade)
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="typo-small text-primary hover:bg-muted border-0 gap-1 cursor-pointer">
            <Link href="/subjects">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {subjects === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5 border-0 bg-card rounded-2xl space-y-3 shadow-xs">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rajasthanSubjects.slice(0, 4).map((subject) => {
              const topicCount = subject.name.includes("इतिहास") ? "10 Topics" : "15 Topics";
              return (
                <Link
                  key={subject._id}
                  href={`/subjects/${subject._id}`}
                  className="group block"
                >
                  <Card className="p-5 border-0 bg-card rounded-2xl shadow-xs hover:shadow-md transition-all group-hover:-translate-y-0.5 space-y-3 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="typo-caption border-0 bg-muted text-muted-foreground font-semibold">
                        {topicCount}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="typo-h3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {subject.name}
                      </h3>
                      <p className="typo-small text-muted-foreground mt-1 line-clamp-1">
                        {subject.description || "Authentic practice sets with answer verification"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 typo-caption text-primary font-semibold">
                      <span>Practice Tests</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: GENERAL ENGLISH (DEDICATED 3-COLUMN GRID)
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="General English" className="space-y-4">
        <div>
          <h2 className="typo-h2 text-foreground">General English</h2>
          <p className="typo-small text-muted-foreground">
            Paper-II English Grammar, Core Syntax, Vocabulary &amp; Comprehension
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Grammar & Core Rules (Active / Practice Ready) */}
          <Link href="/subjects" className="group block">
            <Card className="p-5 border-0 bg-card rounded-2xl shadow-xs hover:shadow-md transition-all group-hover:-translate-y-0.5 space-y-3 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <Badge className="typo-caption border-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                  Active Ready
                </Badge>
              </div>

              <div>
                <h3 className="typo-h3 text-foreground group-hover:text-primary transition-colors">
                  Grammar &amp; Core Rules
                </h3>
                <p className="typo-small text-muted-foreground mt-1">
                  Tenses, voice, narration, prepositions, articles &amp; sentence transformation tests.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 typo-caption text-primary font-semibold">
                <span>Start Practice</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          {/* Column 2: Part 2: Vocabulary & Idioms (Coming Soon) */}
          <Card className="p-5 border-0 bg-card/70 rounded-2xl shadow-xs space-y-3 select-none">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="typo-caption border-0 bg-muted/80 text-muted-foreground font-semibold">
                Coming Soon
              </Badge>
            </div>

            <div>
              <h3 className="typo-h3 text-foreground/80">
                Part 2: Vocabulary &amp; Idioms
              </h3>
              <p className="typo-small text-muted-foreground mt-1">
                Synonyms, antonyms, one-word substitutions, phrasal verbs &amp; common idioms.
              </p>
            </div>

            <div className="pt-1 typo-caption text-muted-foreground font-medium">
              Curating authentic exam question sets
            </div>
          </Card>

          {/* Column 3: Part 3: Comprehension & Usage (Coming Soon) */}
          <Card className="p-5 border-0 bg-card/70 rounded-2xl shadow-xs space-y-3 select-none">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="typo-caption border-0 bg-muted/80 text-muted-foreground font-semibold">
                Coming Soon
              </Badge>
            </div>

            <div>
              <h3 className="typo-h3 text-foreground/80">
                Part 3: Comprehension &amp; Usage
              </h3>
              <p className="typo-small text-muted-foreground mt-1">
                Reading passages, cloze test passages, paragraph coherence &amp; precise usage.
              </p>
            </div>

            <div className="pt-1 typo-caption text-muted-foreground font-medium">
              In final review &amp; formatting
            </div>
          </Card>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3: INDIA & WORLD GK (4-COLUMN GRID — COMING SOON)
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="India & World GK" className="space-y-4">
        <div>
          <h2 className="typo-h2 text-foreground">India &amp; World GK</h2>
          <p className="typo-small text-muted-foreground">
            Complete syllabus modules for National &amp; Global General Knowledge
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Indian Geography */}
          <Card className="p-5 border-0 bg-card/70 rounded-2xl shadow-xs space-y-3 select-none">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
                <Compass className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="typo-caption border-0 bg-muted/80 text-muted-foreground font-semibold">
                Coming Soon
              </Badge>
            </div>
            <div>
              <h3 className="typo-h3 text-foreground/80">Indian Geography</h3>
              <p className="typo-small text-muted-foreground mt-1">
                Physical features, major rivers, monsoons, soil types, forests &amp; mineral resources.
              </p>
            </div>
          </Card>

          {/* Card 2: World Geography */}
          <Card className="p-5 border-0 bg-card/70 rounded-2xl shadow-xs space-y-3 select-none">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
                <Globe className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="typo-caption border-0 bg-muted/80 text-muted-foreground font-semibold">
                Coming Soon
              </Badge>
            </div>
            <div>
              <h3 className="typo-h3 text-foreground/80">World Geography</h3>
              <p className="typo-small text-muted-foreground mt-1">
                Continents, major ocean currents, global wind circulation, climate zones &amp; ecology.
              </p>
            </div>
          </Card>

          {/* Card 3: Indian Economy */}
          <Card className="p-5 border-0 bg-card/70 rounded-2xl shadow-xs space-y-3 select-none">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
                <TrendingUp className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="typo-caption border-0 bg-muted/80 text-muted-foreground font-semibold">
                Coming Soon
              </Badge>
            </div>
            <div>
              <h3 className="typo-h3 text-foreground/80">Indian Economy</h3>
              <p className="typo-small text-muted-foreground mt-1">
                Agricultural patterns, industrial policies, national budget, inflation &amp; GST reforms.
              </p>
            </div>
          </Card>

          {/* Card 4: Indian Polity & History */}
          <Card className="p-5 border-0 bg-card/70 rounded-2xl shadow-xs space-y-3 select-none">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
                <Landmark className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="typo-caption border-0 bg-muted/80 text-muted-foreground font-semibold">
                Coming Soon
              </Badge>
            </div>
            <div>
              <h3 className="typo-h3 text-foreground/80">Indian Polity &amp; History</h3>
              <p className="typo-small text-muted-foreground mt-1">
                Constitution, fundamental rights, parliament, supreme court &amp; national freedom struggle.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4: CURRENT AFFAIRS (COMING SOON CARD)
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Current Affairs">
        <Card className="p-6 border-0 bg-card/70 rounded-2xl shadow-xs select-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <Radio className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="typo-h3 text-foreground">
                    Current Affairs (Rajasthan, India &amp; World)
                  </h3>
                  <Badge variant="outline" className="typo-caption border-0 bg-muted text-muted-foreground font-semibold">
                    Coming Soon
                  </Badge>
                </div>
                <p className="typo-small text-muted-foreground mt-1 max-w-2xl">
                  Monthly compilations, major government flagship schemes, recent appointments, sports honors, awards, and national/international summit coverage.
                </p>
              </div>
            </div>

            <Badge variant="secondary" className="typo-caption border-0 bg-muted self-start sm:self-auto px-3 py-1 font-semibold text-muted-foreground">
              Module In Development
            </Badge>
          </div>
        </Card>
      </section>

      {/* ── Recent Attempts & Syllabus Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <Card className="p-5 border-0 bg-card shadow-xs rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="typo-h3 text-foreground">Recent Attempts</h3>
            <Button asChild variant="ghost" size="sm" className="typo-small text-primary hover:bg-muted border-0 p-0 h-auto">
              <Link href="/history">View History</Link>
            </Button>
          </div>

          {recent === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No tests attempted yet"
              description="Start practicing questions from any Rajasthan GK topic above."
              className="py-4"
            />
          ) : (
            <ul className="space-y-2">
              {recent.map((a: any) => (
                <li key={a._id}>
                  <ResultHistoryItem
                    attemptId={a._id}
                    testSetId={a.testSetId}
                    testSetName={a.testSetName}
                    submittedAt={a.submittedAt ?? 0}
                    score={a.score}
                    totalQuestions={a.totalQuestions}
                    answers={a.answers ?? []}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          <SyllabusOverviewCard />
        </div>
      </div>
    </div>
  );
}
