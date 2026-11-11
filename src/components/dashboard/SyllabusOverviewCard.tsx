"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListChecks, ArrowRight, Target } from "lucide-react";

const STORAGE_KEY = "quizzer_syllabus_completed_v2";
const RAJASTHAN_GK_TOTAL_TOPICS = 55;

export function SyllabusOverviewCard() {
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Count only completed topics within the 55 Rajasthan GK syllabus scope (IDs 1-55)
          const validRajasthanGkCompleted = parsed
            .map(Number)
            .filter((id) => !isNaN(id) && id >= 1 && id <= RAJASTHAN_GK_TOTAL_TOPICS);
          setCompletedCount(new Set(validRajasthanGkCompleted).size);
        }
      }
    } catch {
      // Local storage fallback
    }
  }, []);

  const percent =
    RAJASTHAN_GK_TOTAL_TOPICS > 0
      ? Math.round((completedCount / RAJASTHAN_GK_TOTAL_TOPICS) * 100)
      : 0;

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border-0 shadow-xs bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              Syllabus Tracker
            </h2>
            <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium bg-muted/50 border-border">
              RPSC Senior Teacher (2nd Grade)
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Track your exam coverage across all 55 canonical Rajasthan GK master topics.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-xl shrink-0 h-9 px-3.5 text-xs font-semibold shadow-2xs cursor-pointer border-border/80 bg-background hover:bg-muted text-foreground">
          <Link href="/syllabus" className="inline-flex items-center gap-1.5">
            Open Syllabus Tracker <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Progress & metrics row */}
      <div className="mt-4 pt-4 border-t border-border/60">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground font-medium flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary" />
            Rajasthan GK Preparation Progress
          </span>
          <span className="font-bold text-foreground tabular-nums">
            {isMounted ? `${completedCount} of ${RAJASTHAN_GK_TOTAL_TOPICS} topics` : "Loading..."}
            <span className="ml-1.5 text-primary font-bold">({isMounted ? percent : 0}%)</span>
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${isMounted ? percent : 0}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
