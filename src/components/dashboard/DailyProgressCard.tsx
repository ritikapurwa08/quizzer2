"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingUp, Flame } from "lucide-react";
import { cn, getSubjectDisplayName } from "@/lib/utils";

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

const HINDI_MONTHS: Record<number, string> = {
  0: "जन",
  1: "फर",
  2: "मार्च",
  3: "अप्रै",
  4: "मई",
  5: "जून",
  6: "जुला",
  7: "अग",
  8: "सित",
  9: "अक्टू",
  10: "नव",
  11: "दिस",
};

function formatHindiDate(isoDate: string): { label: string; tooltip: string } {
  try {
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthName = HINDI_MONTHS[month] ?? `${month + 1}`;
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
  today: "आज",
  "7": "7 दिन",
  "30": "30 दिन",
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
          <h2 className="text-sm font-bold text-foreground font-hindi">
            दैनिक अभ्यास प्रगति
          </h2>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center gap-2 font-hindi text-xs">
            <span className="flex items-center gap-1 text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Flame className="h-3 w-3 fill-current" />
              {activeDays} सक्रिय दिन
            </span>
            <span className="text-muted-foreground font-medium hidden xs:inline">
              कुल {totalSolved} प्रश्न
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
                "px-2.5 text-[11px] font-semibold transition-colors h-full font-hindi",
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Subject filter */}
        {subjects.length > 0 && (
          <div className="relative">
            <select
              id="daily-progress-subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="h-7 rounded-lg border border-border bg-card text-[11px] font-medium text-foreground px-2 pr-6 appearance-none cursor-pointer hover:border-primary/50 focus:outline-none font-hindi"
              aria-label="विषय फ़िल्टर"
            >
              <option value="all">सभी विषय</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {getSubjectDisplayName(s)}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-muted-foreground">
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 8L1 3h10L6 8z" />
              </svg>
            </span>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="इस अवधि में कोई अभ्यास नहीं"
          description="प्रतिदिन प्रश्न हल करके अपनी अध्ययन निरंतरता बनाए रखें।"
          className="py-4"
        />
      ) : (
        <div className="relative pt-6">
          {/* Hover Tooltip */}
          <div className="h-6 mb-1.5 flex items-center justify-center text-xs font-hindi">
            {hoveredIdx !== null && filtered[hoveredIdx] ? (
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-muted/80 border border-border text-foreground animate-in fade-in-0 duration-150">
                <span className="font-semibold text-primary">
                  {formatHindiDate(filtered[hoveredIdx].day).tooltip}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="font-bold text-foreground">
                  {filtered[hoveredIdx].count} प्रश्न हल किए
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground/60 select-none">
                किसी दिन का विवरण देखने के लिए बार पर होवर करें
              </span>
            )}
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-1 sm:gap-2 h-28 sm:h-32 px-1">
            {filtered.map((d, idx) => {
              const { label, tooltip } = formatHindiDate(d.day);
              const heightPercent = Math.max(8, Math.round((d.count / max) * 100));
              const isHovered = hoveredIdx === idx;
              const hasActivity = d.count > 0;

              return (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer select-none group"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx((prev) => (prev === idx ? null : prev))}
                  title={`${tooltip}: ${d.count} प्रश्न`}
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
