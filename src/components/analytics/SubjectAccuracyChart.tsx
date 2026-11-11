"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SubjectAccuracyItem {
  id?: string;
  name: string;
  nameHindi?: string;
  accuracy: number; // 0-100
  correct?: number;
  total?: number;
  attempted?: number;
  totalAvailable?: number;
  remaining?: number;
}

interface SubjectAccuracyChartProps {
  data: SubjectAccuracyItem[];
  strongest?: { name: string; nameHindi?: string; accuracy: number } | null;
  weakest?: { name: string; nameHindi?: string; accuracy: number } | null;
}

function getConciseSubjectName(name: string, nameHindi?: string): string {
  const text = (nameHindi || name).trim();
  if (text.includes("कला") && text.includes("संस्कृति")) return "कला संस्कृति";
  if (text.includes("इतिहास")) return "इतिहास";
  if (text.includes("राजव्यवस्था") || text.includes("प्रशासन")) return "राजव्यवस्था";
  if (text.includes("सामान्य ज्ञान") || text.includes("राजस्थान का भूगोल")) return "राजस्थान का भूगोल";
  if (text.includes("भूगोल")) return "भूगोल";
  if (text.toLowerCase().includes("english")) return "English";
  return text
    .replace("राजस्थान ", "")
    .replace("का ", "")
    .replace("की ", "")
    .replace("के ", "")
    .replace("एवं ", "")
    .trim();
}

export function SubjectAccuracyChart({ data }: SubjectAccuracyChartProps) {
  const subjectsList = data || [];

  const attemptedCount = subjectsList.filter(
    (s) => (s.attempted ?? s.total ?? 0) > 0
  ).length;

  const topSubject = useMemo(() => {
    const attempted = subjectsList.filter((s) => (s.attempted ?? s.total ?? 0) > 0);
    if (attempted.length === 0) return null;
    return [...attempted].sort((a, b) => b.accuracy - a.accuracy)[0];
  }, [subjectsList]);

  // Clean data sorted by accuracy descending
  const sortedSubjects = useMemo(() => {
    return [...subjectsList].sort((a, b) => {
      const aAttempted = (a.attempted ?? a.total ?? 0) > 0;
      const bAttempted = (b.attempted ?? b.total ?? 0) > 0;
      if (aAttempted && !bAttempted) return -1;
      if (!aAttempted && bAttempted) return 1;
      return b.accuracy - a.accuracy;
    });
  }, [subjectsList]);

  return (
    <Card className="rounded-2xl border-0 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      {/* ── Card Header ── */}
      <CardHeader className="p-4 sm:p-5 pb-2 border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span>Subject Accuracy &amp; Mastery</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Subject performance ranked by evaluation accuracy
            </CardDescription>
          </div>

          <Badge
            variant="outline"
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full border-border/80 self-start sm:self-auto bg-muted/30"
          >
            {attemptedCount} of {subjectsList.length} Attempted
          </Badge>
        </div>
      </CardHeader>

      {/* ── Card Content: Full-Width Clean CSS Bars (No Recharts Squeeze) ── */}
      <CardContent className="p-4 sm:p-5 pt-2 pb-3 space-y-2.5">
        {sortedSubjects.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            No subject data available
          </div>
        ) : (
          sortedSubjects.map((item) => {
            const attempted = item.attempted ?? item.total ?? 0;
            const isAttempted = attempted > 0;
            const conciseName = getConciseSubjectName(item.name, item.nameHindi);
            const accuracyVal = isAttempted ? Math.round(item.accuracy) : 0;

            const isHigh = accuracyVal >= 75;
            const isMedium = accuracyVal >= 50;

            return (
              <div key={item.id || item.name} className="w-full">
                <div
                  className="relative w-full h-9 sm:h-10 rounded-xl overflow-hidden bg-secondary/80 dark:bg-muted/40 border-0 flex items-center px-3.5 select-none"
                  title={`${item.nameHindi || item.name}: ${isAttempted ? `${accuracyVal}%` : "Not Attempted"}`}
                >
                  {/* Colored Progress Fill (Subtle tint + crisp edge marker for perfect light & dark contrast) */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-xl",
                      !isAttempted
                        ? "bg-transparent"
                        : isHigh
                        ? "bg-emerald-500/20 dark:bg-emerald-500/25 border-r-2 border-emerald-500"
                        : isMedium
                        ? "bg-primary/20 dark:bg-primary/25 border-r-2 border-primary"
                        : "bg-rose-500/20 dark:bg-rose-500/25 border-r-2 border-rose-500"
                    )}
                    style={{
                      width: isAttempted ? `${Math.max(accuracyVal, 3)}%` : "0%",
                    }}
                  />

                  {/* Content Overlay — Full Width, Crisp High-Contrast Text */}
                  <div className="relative z-10 flex items-center justify-between w-full pointer-events-none">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          !isAttempted
                            ? "bg-muted-foreground/30"
                            : isHigh
                            ? "bg-emerald-500"
                            : isMedium
                            ? "bg-primary"
                            : "bg-rose-500"
                        )}
                      />
                      <span className="text-xs sm:text-sm font-medium text-foreground truncate font-sans">
                        {conciseName}
                      </span>
                      {isAttempted && item.correct !== undefined && (
                        <span className="text-[11px] text-muted-foreground hidden sm:inline tabular-nums">
                          ({item.correct}/{attempted} Qs)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-bold tabular-nums font-sans",
                          !isAttempted
                            ? "text-muted-foreground/70"
                            : isHigh
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isMedium
                            ? "text-primary"
                            : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {isAttempted ? `${accuracyVal}%` : "Not Attempted"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      {/* ── Card Footer ── */}
      <CardFooter className="p-4 sm:p-5 pt-2 pb-3.5 border-t border-border/40 text-xs text-muted-foreground flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>
            {topSubject
              ? `Leading: ${getConciseSubjectName(topSubject.name, topSubject.nameHindi)} (${Math.round(topSubject.accuracy)}% accuracy)`
              : "Solve practice sets to build your subject mastery scores"}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground/80">
          Covers all active examination syllabus subjects
        </p>
      </CardFooter>
    </Card>
  );
}
