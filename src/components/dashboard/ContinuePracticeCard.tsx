"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Sparkles, BookOpen, ArrowRight, RotateCcw } from "lucide-react";
import { getSubjectSectionIcon } from "@/components/icons/QuizzerIcons";

export function ContinuePracticeCard() {
  const recommendations = useQuery(api.testSets.nextRecommendedSets, { limit: 3 });

  if (recommendations === undefined) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-44 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 rounded-2xl border border-border/70 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-3.5 w-16 rounded" />
              </div>
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-8 w-full rounded-xl" />
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
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Continue Practice · Next Available Tests
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recommendations.map((rec) => {
          const SectionIcon = getSubjectSectionIcon(rec.subjectName);

          return (
            <Card
              key={rec.testSetId}
              className="p-4 rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
            >
              {/* Header: Subject & Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <SectionIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[11px] font-semibold text-muted-foreground truncate">
                    {rec.subjectName}
                  </span>
                </div>

                <Badge
                  variant={rec.type === "resume" ? "default" : "outline"}
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 tracking-tight"
                >
                  {rec.badgeText}
                </Badge>
              </div>

              {/* Title & Topic info */}
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors font-hindi line-clamp-1">
                  {rec.testSetName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-hindi">
                  <span className="truncate">{rec.topicName}</span>
                  <span className="text-border">·</span>
                  <span className="tabular-nums shrink-0">{rec.questionCount} Questions</span>
                </div>
              </div>

              {/* Action Button */}
              <Button asChild className="w-full h-8.5 rounded-xl text-xs font-bold shadow-2xs gap-1.5 mt-1">
                <Link href={`/quiz/${rec.testSetId}`}>
                  {rec.type === "resume" ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" /> Resume Attempt
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" /> Start Test Now
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
