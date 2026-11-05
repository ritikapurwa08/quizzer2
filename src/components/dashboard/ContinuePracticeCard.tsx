"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Sparkles, RotateCcw, ArrowRight } from "lucide-react";
import { getSubjectSectionIcon } from "@/components/icons/QuizzerIcons";
import { cn } from "@/lib/utils";

/**
 * Helper to parse clean title and prominent part label from names like:
 * "राजस्थान का पशुपालन एवं डेयरी विकास भाग 15" -> { cleanTitle: "राजस्थान का पशुपालन एवं डेयरी विकास", partLabel: "भाग 15" }
 */
function parseSetDisplay(name: string) {
  const match = name.match(/(?:भाग|Part|Set)\s*(\d+)/i);
  const partLabel = match ? (name.includes("भाग") ? `भाग ${match[1]}` : `Part ${match[1]}`) : "";
  const cleanTitle = name
    .replace(/(?:भाग|Part|Set)\s*\d+/i, "")
    .replace(/[-–—:]\s*$/, "")
    .trim();

  return {
    cleanTitle: cleanTitle || name,
    partLabel,
  };
}

export function ContinuePracticeCard() {
  const recommendations = useQuery(api.testSets.nextRecommendedSets, { limit: 6 });

  if (recommendations === undefined) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-52 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-3.5 rounded-2xl border border-border/70 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-7 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Continue Practice · Next Available Tests
          <span className="font-bold text-foreground tabular-nums">({recommendations.length})</span>
        </h2>
        <Link
          href="/subjects"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          All Topics <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* 5-6 Columns Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {recommendations.map((rec) => {
          const SectionIcon = getSubjectSectionIcon(rec.subjectName);
          const { cleanTitle, partLabel } = parseSetDisplay(rec.testSetName);
          const isResume = rec.type === "resume";

          return (
            <Card
              key={rec.testSetId}
              className={cn(
                "p-3 rounded-xl border bg-card hover:border-primary/50 hover:shadow-xs transition-all flex flex-col justify-between gap-2.5 group relative select-none",
                isResume ? "border-primary/40 bg-primary/[0.02]" : "border-border/80"
              )}
            >
              {/* Top Row: Subject pill + Prominent Part Pill */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <SectionIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[10.5px] font-medium text-muted-foreground truncate font-hindi">
                    {rec.subjectName.replace("राजस्थान ", "")}
                  </span>
                </div>

                {partLabel ? (
                  <span className="shrink-0 text-[10.5px] font-black px-1.5 py-0.5 rounded-md bg-foreground text-background font-mono tracking-tight shadow-2xs">
                    {partLabel}
                  </span>
                ) : (
                  <Badge variant="outline" className="text-[9.5px] px-1.5 py-0 rounded">
                    Set
                  </Badge>
                )}
              </div>

              {/* Title & Topic Details */}
              <div className="space-y-1 my-auto">
                <h3
                  className="font-bold text-xs leading-snug text-foreground group-hover:text-primary transition-colors font-hindi line-clamp-2"
                  title={rec.testSetName}
                >
                  {cleanTitle}
                </h3>

                <div className="flex items-center justify-between text-[10.5px] text-muted-foreground">
                  <span className="tabular-nums font-semibold">{rec.questionCount} Qs</span>
                  {isResume ? (
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      In Progress
                    </span>
                  ) : rec.type === "next_in_topic" ? (
                    <span className="text-emerald-500 font-bold">Up Next</span>
                  ) : (
                    <span className="text-muted-foreground">Practice</span>
                  )}
                </div>
              </div>

              {/* Sleek Compact Action Button (No bloated full-width blocks) */}
              <Button
                asChild
                size="sm"
                variant={isResume ? "default" : "outline"}
                className={cn(
                  "w-full h-7.5 rounded-lg text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs transition-all",
                  isResume
                    ? "bg-foreground text-background hover:bg-foreground/90 font-bold"
                    : "border-border/80 hover:bg-muted text-foreground"
                )}
              >
                <Link href={`/quiz/${rec.testSetId}`}>
                  {isResume ? (
                    <>
                      <RotateCcw className="h-3 w-3" />
                      <span>Resume Attempt</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 fill-current" />
                      <span>Start Test</span>
                    </>
                  )}
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
