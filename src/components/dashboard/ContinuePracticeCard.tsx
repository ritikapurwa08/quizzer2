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
  const recommendations = useQuery(api.testSets.nextRecommendedSets, { limit: 6 });

  if (recommendations === undefined) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-2.5 sm:p-3.5 rounded-md border border-border bg-card space-y-2 shadow-none">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-16 rounded" />
                <Skeleton className="h-3.5 w-12 rounded" />
              </div>
              <Skeleton className="h-8 w-full rounded" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-14 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <Skeleton className="h-7 sm:h-8 w-full rounded-sm" />
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
      {/* Section Header with Responsive Title (No Overlap/Collision) */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 min-w-0">
          <span>Continue Practice</span>
          <span className="hidden sm:inline text-muted-foreground/60">· Next Available Tests</span>
          <span className="font-bold text-foreground tabular-nums shrink-0">({recommendations.length})</span>
        </h2>
        <Link
          href="/subjects"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0"
        >
          All Topics <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* 2-Column Grid on Mobile, 3-Column on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
        {recommendations.map((rec) => {
          const SectionIcon = getSubjectSectionIcon(rec.subjectName);
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
                className="p-2.5 sm:p-3.5 rounded-md border border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between gap-2 h-full relative select-none shadow-xs"
              >
                {/* Top Row: Subject Tag with Icon + Part Badge */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <SectionIcon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        isResume ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      )}
                    />
                    <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors font-hindi truncate">
                      {shortSubject}
                    </span>
                  </div>

                  {partLabel && (
                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded-xs font-mono tracking-tight border transition-colors",
                        isResume
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-border/70 group-hover:border-primary/40"
                      )}
                    >
                      {partLabel}
                    </span>
                  )}
                </div>

                {/* Title: Compact, No Unneeded Vertical Gap */}
                <div className="my-0.5 min-h-[2rem] sm:min-h-[2.4rem] flex items-center">
                  <h3
                    className="font-medium text-xs sm:text-[13.5px] leading-snug text-foreground group-hover:text-primary transition-colors font-hindi line-clamp-2"
                    title={rec.testSetName}
                  >
                    {cleanTitle}
                  </h3>
                </div>

                {/* Status & Questions Row */}
                <div className="flex items-center justify-between text-[11px] sm:text-xs pt-1.5 mt-0.5 border-t border-border/40">
                  <span className="tabular-nums font-medium text-muted-foreground">{rec.questionCount} प्रश्न</span>
                  {isResume ? (
                    <span className="text-primary font-medium flex items-center gap-1 text-[11px] sm:text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      In Progress
                    </span>
                  ) : isNext ? (
                    <span className="text-primary/90 font-medium flex items-center gap-1 text-[11px] sm:text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Up Next
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[11px] sm:text-xs font-normal">New Practice</span>
                  )}
                </div>

                {/* Button: Compact, High Contrast Sky-Blue Theme */}
                {isResume ? (
                  <div className="w-full h-7 sm:h-8 rounded-sm font-medium text-xs flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary/90 border border-primary/40 transition-all duration-150 shadow-2xs">
                    <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white shrink-0" />
                    <span className="text-white font-medium truncate">
                      <span className="sm:hidden">Resume</span>
                      <span className="hidden sm:inline">Resume Attempt</span>
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-7 sm:h-8 rounded-sm font-medium text-xs flex items-center justify-center gap-1.5 bg-secondary/60 text-foreground border border-border/50 hover:bg-primary/10 hover:text-primary transition-all duration-150 shadow-2xs">
                    <Play className="h-3 w-3 fill-current shrink-0" />
                    <span className="truncate">
                      <span className="sm:hidden">Start Test</span>
                      <span className="hidden sm:inline">Start Practice Test</span>
                    </span>
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
