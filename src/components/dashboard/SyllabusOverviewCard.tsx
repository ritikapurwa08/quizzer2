"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SENIOR_TEACHER_SYLLABUS } from "@/lib/syllabus-data";
import { ListChecks, ArrowRight, CheckCircle2, Target } from "lucide-react";

const STORAGE_KEY = "quizzer_syllabus_completed_v1";

export function SyllabusOverviewCard() {
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const totalTopics = SENIOR_TEACHER_SYLLABUS.length;

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const completedSet = new Set(parsed);
          const count = SENIOR_TEACHER_SYLLABUS.filter((t) => completedSet.has(t.id)).length;
          setCompletedCount(count);
        }
      }
    } catch {
      // Local storage fallback
    }
  }, []);

  const percent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border border-border shadow-xs bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              Syllabus Tracker
            </h2>
            <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium bg-muted/50 border-border">
              Senior Teacher (2nd Grade)
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Monitor your exam coverage across Rajasthan GK, Current Affairs, World & India GK, and Educational Psychology.
          </p>
        </div>

        <Button asChild size="sm" className="rounded-xl shrink-0 h-9 px-3.5 text-xs font-semibold shadow-xs">
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
            Preparation Progress
          </span>
          <span className="font-bold text-foreground tabular-nums">
            {isMounted ? `${completedCount} of ${totalTopics} topics` : "Loading..."}
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
