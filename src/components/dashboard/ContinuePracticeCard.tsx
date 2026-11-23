"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

/**
 * Helper to parse clean topic title and prominent part label
 * "राजस्थान का पशुपालन एवं डेयरी विकास भाग 15" -> { cleanTitle: "पशुपालन एवं डेयरी विकास", partLabel: "भाग 15" }
 */
function parseSetDisplay(name: string, fallbackTopic?: string) {
  const match = name.match(/(?:भाग|Part|Set)\s*(\d+)/i);
  const partNum = match ? match[1] : "1";
  const partLabel = `Part ${partNum}`;
  
  const rawTitle = fallbackTopic && fallbackTopic.trim().length > 0 ? fallbackTopic.trim() : name;
  let cleanTitle = rawTitle
    .replace(/(?:भाग|Part|Set)\s*\d+/i, "")
    .replace(/[-–—:]\s*$/, "")
    .trim();

  if (cleanTitle.length > 28) {
    cleanTitle = cleanTitle.replace(/^राजस्थान (?:का|के|की|में)\s+/i, "");
  }

  return {
    cleanTitle: cleanTitle || rawTitle,
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
          <Skeleton className="h-4 w-32 bg-zinc-800 rounded" />
          <Skeleton className="h-4 w-20 bg-zinc-800 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-md border border-border bg-card p-4 space-y-2.5 h-full shadow-xs"
            >
              <Skeleton className="h-4 w-3/4 rounded" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Preview mock data fallback if user has no attempts yet
  const isPreview = typeof window !== "undefined" && window.location.search.includes("preview=true");
  const fallbackMock = [
    { testSetId: "mock-1", testSetName: "अपवाह तंत्र, नदियाँ एवं झीलें भाग 25", topicName: "अपवाह तंत्र, नदियाँ एवं झीलें", questionCount: 20, type: "resume" as const },
    { testSetId: "mock-2", testSetName: "राजस्थान का भौतिक स्वरूप एवं भूगोल भाग 16", topicName: "राजस्थान का भौतिक स्वरूप एवं भूगोल", questionCount: 20, type: "resume" as const },
    { testSetId: "mock-3", testSetName: "राजस्थान का सामान्य ज्ञान भाग 1", topicName: "राजस्थान का सामान्य ज्ञान", questionCount: 20, type: "next_in_topic" as const },
    { testSetId: "mock-4", testSetName: "राजस्थान की प्राचीन सभ्यताएँ Part 1", topicName: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल", questionCount: 20, type: "new_topic" as const },
  ];

  const rawList = recommendations && recommendations.length > 0 ? recommendations : isPreview ? fallbackMock : [];
  const displayCards = rawList.slice(0, 4);

  if (displayCards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          CONTINUE PRACTICE
        </h2>
        <Link
          href="/subjects"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0"
        >
          All Topics <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Ultra-Minimalist 2-Line Cards: Desktop 4-col, Mobile 1-col */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {displayCards.map((rec) => {
          const { cleanTitle, partLabel } = parseSetDisplay(rec.testSetName, rec.topicName);
          const isResume = rec.type === "resume";

          return (
            <Link
              key={rec.testSetId}
              href={`/quiz/${rec.testSetId}`}
              className="block group focus-visible:outline-hidden h-full"
            >
              <Card className="rounded-md border border-border bg-card hover:border-border/80 p-4 transition-colors cursor-pointer space-y-2 h-full flex flex-col justify-center shadow-xs">
                {/* Line 1: Topic title in clean white text */}
                <h3
                  className="text-sm font-medium text-foreground group-hover:text-primary transition-colors font-hindi truncate"
                  title={cleanTitle}
                >
                  {cleanTitle}
                </h3>

                {/* Line 2: Minimal single-line hint */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isResume ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span className="font-medium text-foreground/80">{partLabel} · Resume</span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                      <span className="font-medium text-foreground/80">{partLabel} · Start</span>
                    </>
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
