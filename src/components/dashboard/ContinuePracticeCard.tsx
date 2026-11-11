"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, RotateCcw, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Short, clean subject tags for card header
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
 * Helper to parse clean title and prominent part label
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
  // Strictly fetch up to 4 recommended practice sets
  const recommendations = useQuery(api.testSets.nextRecommendedSets, { limit: 4 });

  if (recommendations === undefined) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        {/* Exactly 4 skeleton cards matching Subject Card vertical height */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-3 sm:p-3.5 rounded-2xl border-0 bg-card space-y-2.5 shadow-xs flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-3.5 w-14 rounded" />
                </div>
                <Skeleton className="h-4 w-10 rounded-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Guard: Strictly clamp to max 4 cards (with preview mock support)
  const isPreview = typeof window !== "undefined" && window.location.search.includes("preview=true");
  const fallbackMock = [
    { testSetId: "mock-1", testSetName: "राजस्थान की मृदा भाग 8", subjectName: "राजस्थान सामान्य ज्ञान एवं भूगोल", questionCount: 20, type: "resume" as const },
    { testSetId: "mock-2", testSetName: "राजस्थान की मृदा भाग 6", subjectName: "राजस्थान सामान्य ज्ञान एवं भूगोल", questionCount: 20, type: "resume" as const },
    { testSetId: "mock-3", testSetName: "भौतिक स्वरूप एवं भूगोल भाग 40", subjectName: "राजस्थान सामान्य ज्ञान एवं भूगोल", questionCount: 20, type: "next_in_topic" as const },
    { testSetId: "mock-4", testSetName: "राजस्थान का सामान्य ज्ञान भाग 1", subjectName: "राजस्थान सामान्य ज्ञान एवं भूगोल", questionCount: 20, type: "new" as const },
  ];

  const rawList = recommendations && recommendations.length > 0 ? recommendations : isPreview ? fallbackMock : [];
  const displayCards = rawList.slice(0, 4);

  if (displayCards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Section Header with Responsive Title */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 min-w-0">
          <span>Continue Practice</span>
          <span className="hidden sm:inline text-muted-foreground/60">· Next Available Tests</span>
          <span className="font-bold text-foreground tabular-nums shrink-0">({displayCards.length})</span>
        </h2>
        <Link
          href="/subjects"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0"
        >
          All Topics <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Strictly 4 Cards: Symmetrical 2x2 on Mobile, 4x1 on Desktop — Compact Height Matching Subject Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        {displayCards.map((rec) => {
          const shortSubject = getShortSubjectTag(rec.subjectName);
          const { cleanTitle, partLabel } = parseSetDisplay(rec.testSetName);
          const isResume = rec.type === "resume";
          const isNext = rec.type === "next_in_topic";

          return (
            <Link
              key={rec.testSetId}
              href={`/quiz/${rec.testSetId}`}
              className="block group focus-visible:outline-hidden h-full"
            >
              <Card
                className="p-3 sm:p-3.5 rounded-2xl border-0 bg-card hover:bg-muted/30 transition-all flex flex-col justify-between gap-2.5 h-full relative select-none shadow-xs"
              >
                {/* Top Row: Action Icon + Subject on left, Part badge + Chevron on right */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition-colors duration-150",
                        isResume
                          ? "bg-primary text-white shadow-2xs"
                          : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                      )}
                    >
                      {isResume ? (
                        <RotateCcw className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors font-hindi truncate">
                      {shortSubject}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {partLabel && (
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono tracking-tight transition-colors",
                          isResume
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}
                      >
                        {partLabel}
                      </span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Bottom Row: Clean Title + Status/Question count (No clunky long button!) */}
                <div>
                  <h3
                    className="font-medium text-xs sm:text-[13.5px] leading-snug text-foreground group-hover:text-primary transition-colors font-hindi line-clamp-1 sm:line-clamp-2"
                    title={rec.testSetName}
                  >
                    {cleanTitle}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                    <span className="tabular-nums font-medium">{rec.questionCount} प्रश्न</span>
                    {isResume ? (
                      <span className="text-primary font-medium flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        In Progress
                      </span>
                    ) : isNext ? (
                      <span className="text-primary/90 font-medium flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Up Next
                      </span>
                    ) : (
                      <span className="text-muted-foreground/80">New Practice</span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
