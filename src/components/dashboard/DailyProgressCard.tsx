"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingUp, Flame } from "lucide-react";
import { cn, getSubjectDisplayName } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DailyPoint {
  day: string; // ISO format "YYYY-MM-DD"
  count: number;
  bySubject?: Record<string, number>;
}

interface Subject {
  _id: string;
  name: string;
  nameHindi?: string;
}

const MONTH_NAMES: Record<number, string> = {
  0: "Jan",
  1: "Feb",
  2: "Mar",
  3: "Apr",
  4: "May",
  5: "Jun",
  6: "Jul",
  7: "Aug",
  8: "Sep",
  9: "Oct",
  10: "Nov",
  11: "Dec",
};

function formatDate(isoDate: string): { label: string; tooltip: string } {
  try {
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthName = MONTH_NAMES[month] ?? `${month + 1}`;
      return {
        label: `${day}`,
        tooltip: `${day} ${monthName} ${year}`,
      };
    }
  } catch {
    // fallback
  }
  return { label: isoDate.slice(-2), tooltip: isoDate };
}

type Period = "today" | "7" | "30";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  "7": "7 Days",
  "30": "30 Days",
};

interface DailyProgressCardProps {
  data: DailyPoint[];
  subjects?: Subject[];
}

export function DailyProgressCard({ data, subjects = [] }: DailyProgressCardProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>("7");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");

  // Filter by period
  const filteredByPeriod = useMemo<DailyPoint[]>(() => {
    if (period === "today") {
      const today = new Date().toISOString().slice(0, 10);
      const pt = data.find((d) => d.day === today);
      return pt ? [pt] : [];
    }
    const days = period === "7" ? 7 : 30;
    return data.slice(-days);
  }, [data, period]);

  // Apply subject filter via bySubject breakdown
  const filtered = useMemo<DailyPoint[]>(() => {
    if (selectedSubjectId === "all") return filteredByPeriod;
    return filteredByPeriod.map((d) => ({
      ...d,
      count: d.bySubject?.[selectedSubjectId] ?? 0,
    }));
  }, [filteredByPeriod, selectedSubjectId]);

  const max = Math.max(1, ...filtered.map((d) => d.count));
  const totalSolved = filtered.reduce((sum, d) => sum + d.count, 0);
  const activeDays = filtered.filter((d) => d.count > 0).length;

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-foreground">
            Daily Practice Progress
          </h2>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-warning font-semibold bg-warning/10 px-2 py-0.5 rounded-full border border-warning/20">
              <Flame className="h-3 w-3 fill-current" />
              {activeDays} {activeDays === 1 ? "Active Day" : "Active Days"}
            </span>
            <span className="text-muted-foreground font-medium hidden xs:inline">
              {totalSolved} {totalSolved === 1 ? "Question" : "Questions"} Solved
            </span>
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {/* Period segmented control */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden h-7">
          {(["today", "7", "30"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "px-2.5 text-[11px] font-semibold transition-colors h-full cursor-pointer",
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Subject filter — shadcn Select for dark-mode compatible dropdown */}
        {subjects.length > 0 && (
          <Select value={selectedSubjectId} onValueChange={(v) => setSelectedSubjectId(v ?? "all")}>
            <SelectTrigger
              id="daily-progress-subject"
              size="sm"
              className="h-7 w-auto min-w-28 max-w-44 text-[11px] font-medium rounded-lg"
              aria-label="Filter by Subject"
            >
              <SelectValue placeholder="All Subjects">
                {(v: string | null) => {
                  if (!v || v === "all") return "All Subjects";
                  const s = subjects.find((x) => x._id === v);
                  return s ? getSubjectDisplayName(s) : "All Subjects";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-[11px]">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s._id} value={s._id} className="text-[11px]">
                  {getSubjectDisplayName(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No practice recorded in this period"
          description="Solve questions daily to maintain your study streak."
          className="py-4"
        />
      ) : (
        <div className="relative pt-6">
          {/* Hover Tooltip */}
          <div className="h-6 mb-1.5 flex items-center justify-center text-xs">
            {hoveredIdx !== null && filtered[hoveredIdx] ? (
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-muted/80 border border-border text-foreground animate-in fade-in-0 duration-150">
                <span className="font-semibold text-primary">
                  {formatDate(filtered[hoveredIdx].day).tooltip}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="font-bold text-foreground">
                  {filtered[hoveredIdx].count} {filtered[hoveredIdx].count === 1 ? "question" : "questions"} solved
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground/60 select-none">
                Hover over a bar to view daily details
              </span>
            )}
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-1 sm:gap-2 h-28 sm:h-32 px-1">
            {filtered.map((d, idx) => {
              const { label, tooltip } = formatDate(d.day);
              const heightPercent = Math.max(8, Math.round((d.count / max) * 100));
              const isHovered = hoveredIdx === idx;
              const hasActivity = d.count > 0;

              return (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer select-none group"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx((prev) => (prev === idx ? null : prev))}
                  title={`${tooltip}: ${d.count} questions`}
                >
                  <div className="w-full flex items-end justify-center h-full">
                    <div
                      className={cn(
                        "w-full max-w-[28px] rounded-t-md transition-all duration-200",
                        hasActivity
                          ? isHovered
                            ? "bg-primary shadow-sm scale-y-[1.03]"
                            : "bg-primary/70 group-hover:bg-primary/90"
                          : "bg-muted/40 group-hover:bg-muted/60",
                      )}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-mono leading-none transition-colors",
                      isHovered
                        ? "text-primary font-bold"
                        : hasActivity
                          ? "text-muted-foreground group-hover:text-foreground font-medium"
                          : "text-muted-foreground/40",
                    )}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
