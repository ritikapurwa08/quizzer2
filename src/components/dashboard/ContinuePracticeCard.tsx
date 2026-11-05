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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-3.5 rounded-2xl border border-border/70 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-7.5 w-full rounded-lg" />
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
                  "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 h-full relative select-none",
                  isResume
                    ? "border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/50 hover:bg-amber-500/[0.06]"
                    : "border-border/80 bg-card/80 hover:border-primary/50 hover:bg-card",
                  "shadow-2xs hover:shadow-xs"
                )}
              >
                {/* Top Row: Short Subject Tag + Prominent Part Pill */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <SectionIcon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        isResume ? "text-amber-400" : "text-muted-foreground group-hover:text-primary"
                      )}
                    />
                    <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors font-hindi truncate">
                      {shortSubject}
                    </span>
                  </div>

                  {partLabel && (
                    <span
                      className={cn(
                        "shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-md font-mono tracking-tight border transition-colors",
                        isResume
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-muted text-foreground border-border/70 group-hover:border-primary/40"
                      )}
                    >
                      {partLabel}
                    </span>
                  )}
                </div>

                {/* Title & Topic Details */}
                <div className="space-y-1 my-auto">
                  <h3
                    className="font-bold text-xs sm:text-[13px] leading-snug text-foreground group-hover:text-primary transition-colors font-hindi line-clamp-2"
                    title={rec.testSetName}
                  >
                    {cleanTitle}
                  </h3>
                </div>

                {/* Bottom Action Row: Harmonious Dark Design (NO blinding white buttons) */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="tabular-nums font-semibold text-muted-foreground">{rec.questionCount} Qs</span>
                    <span className="text-border">·</span>
                    {isResume ? (
                      <span className="text-amber-400 font-semibold flex items-center gap-1 text-[10.5px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        In Progress
                      </span>
                    ) : rec.type === "next_in_topic" ? (
                      <span className="text-emerald-400 font-semibold text-[10.5px]">Up Next</span>
                    ) : (
                      <span className="text-muted-foreground text-[10.5px]">Practice</span>
                    )}
                  </div>

                  {/* Sleek, Dark-Mode Action Pill */}
                  {isResume ? (
                    <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:bg-amber-500/25 group-hover:text-amber-300 transition-colors shadow-2xs">
                      <RotateCcw className="h-3 w-3" />
                      <span>Resume</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-muted/60 text-foreground border border-border/70 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200 shadow-2xs">
                      <Play className="h-2.5 w-2.5 fill-current" />
                      <span>Start</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
