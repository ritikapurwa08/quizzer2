"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Sparkles, RotateCcw, ArrowRight } from "lucide-react";
import { getSubjectSectionIcon } from "@/components/icons/QuizzerIcons";
import { cn } from "@/lib/utils";

/**
 * Short, non-truncating subject tags for compact cards
 */
function getShortSubjectTag(name: string): string {
  if (name.includes("भूगोल") || name.includes("सामान्य ज्ञान")) return "भूगोल";
  if (name.includes("इतिहास")) return "इतिहास";
  if (name.includes("कला") || name.includes("संस्कृति")) return "कला-संस्कृति";
  if (name.includes("राजव्यवस्था") || name.includes("प्रशासन")) return "राजव्यवस्था";
  if (name.includes("English")) return "English";
  return name.replace("राजस्थान ", "").slice(0, 10);
}

/**
 * Helper to parse clean title and prominent part label from names like:
 * "राजस्थान का पशुपालन एवं डेयरी विकास भाग 15" -> { cleanTitle: "पशुपालन एवं डेयरी विकास", partLabel: "भाग 15" }
 */
function parseSetDisplay(name: string) {
  const match = name.match(/(?:भाग|Part|Set)\s*(\d+)/i);
  const partLabel = match ? (name.includes("भाग") ? `भाग ${match[1]}` : `Part ${match[1]}`) : "";
  let cleanTitle = name
    .replace(/(?:भाग|Part|Set)\s*\d+/i, "")
    .replace(/[-–—:]\s*$/, "")
    .trim();

  // Strip redundant leading "राजस्थान का " or "राजस्थान के " if long
  if (cleanTitle.length > 25) {
    cleanTitle = cleanTitle.replace(/^राजस्थान (?:का|के|की)\s+/i, "");
  }

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 sm:p-4.5 rounded-2xl border border-border/70 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-14 rounded" />
              </div>
              <Skeleton className="h-9 w-full rounded" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-12 rounded" />
                <Skeleton className="h-3.5 w-16 rounded" />
              </div>
              <Skeleton className="h-8.5 w-full rounded-xl" />
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

      {/* 3-Column Responsive Grid (3 in Row 1, 2 or 3 in Row 2 — Spacious & No Collision) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {recommendations.map((rec) => {
          const SectionIcon = getSubjectSectionIcon(rec.subjectName);
          const shortSubject = getShortSubjectTag(rec.subjectName);
          const { cleanTitle, partLabel } = parseSetDisplay(rec.testSetName);
          const isResume = rec.type === "resume";

          return (
            <Link
              key={rec.testSetId}
              href={`/quiz/${rec.testSetId}`}
              className="block group focus-visible:outline-hidden"
            >
              <Card
                className={cn(
                  "p-4 sm:p-4.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 h-full relative select-none",
                  isResume
                    ? "border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/50 hover:bg-amber-500/[0.06]"
                    : "border-border/80 bg-card hover:border-primary/40 hover:bg-card/90",
                  "shadow-2xs hover:shadow-xs"
                )}
              >
                {/* Top Row: Subject Tag + Section Icon + Part Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <SectionIcon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isResume ? "text-amber-400" : "text-muted-foreground group-hover:text-primary"
                      )}
                    />
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors font-hindi truncate">
                      {shortSubject}
                    </span>
                  </div>

                  {partLabel && (
                    <span
                      className={cn(
                        "shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md font-mono tracking-tight border transition-colors",
                        isResume
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-muted text-foreground border-border/70 group-hover:border-primary/40"
                      )}
                    >
                      {partLabel}
                    </span>
                  )}
                </div>

                {/* Title & Topic Details (Ample 2-Line Height) */}
                <div className="my-auto min-h-[2.5rem] flex items-center">
                  <h3
                    className="font-bold text-sm sm:text-[14.5px] leading-snug text-foreground group-hover:text-primary transition-colors font-hindi line-clamp-2"
                    title={rec.testSetName}
                  >
                    {cleanTitle}
                  </h3>
                </div>

                {/* Status Meta Row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                  <span className="tabular-nums font-semibold text-muted-foreground">{rec.questionCount} Questions</span>
                  {isResume ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      In Progress
                    </span>
                  ) : rec.type === "next_in_topic" ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Up Next
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">New Practice</span>
                  )}
                </div>

                {/* Full-Width Sleek Action Button — Clean, Dark-Mode Native */}
                {isResume ? (
                  <div className="w-full h-8.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-amber-500/15 text-amber-300 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-black transition-all duration-150 shadow-2xs">
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Resume Attempt</span>
                  </div>
                ) : rec.type === "next_in_topic" ? (
                  <div className="w-full h-8.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-150 shadow-2xs">
                    <Play className="h-3 w-3 fill-current" />
                    <span>Start Next Part</span>
                  </div>
                ) : (
                  <div className="w-full h-8.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-muted/70 text-foreground border border-border/80 group-hover:bg-foreground group-hover:text-background transition-all duration-150 shadow-2xs">
                    <Play className="h-3 w-3 fill-current" />
                    <span>Start Practice Test</span>
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
