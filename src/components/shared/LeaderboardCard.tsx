"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Trophy, Medal } from "lucide-react";
import { cn, getSubjectDisplayName } from "@/lib/utils";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

interface LeaderboardCardProps {
  subjects: { _id: string; name: string; nameHindi?: string }[];
}

const RANK_STYLES = [
  "bg-amber-400/15 text-amber-500 border-amber-400/30",
  "bg-slate-300/20 text-slate-400 border-slate-300/30",
  "bg-orange-400/15 text-orange-400 border-orange-400/30",
];

export function LeaderboardCard({ subjects }: LeaderboardCardProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?._id ?? "",
  );

  const entries = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any).leaderboard.topScoresBySubject,
    selectedSubjectId ? { subjectId: selectedSubjectId as Id<"subjects"> } : "skip",
  ) as Array<{ rank: number; userId: string; displayName: string; bestScore: number; testsAttempted: number }> | undefined;

  const selectedSubject = subjects.find((s) => s._id === selectedSubjectId);

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-500 shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-foreground font-hindi">
            शीर्ष स्कोरर (Top 10)
          </h2>
        </div>

        {/* Subject filter */}
        {subjects.length > 1 && (
          <div className="relative">
            <select
              id="leaderboard-subject-filter"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="h-7 rounded-lg border border-border bg-background text-xs font-medium text-foreground px-2 pr-6 appearance-none cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary font-hindi"
              aria-label="विषय चुनें"
            >
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

      {/* Leaderboard table */}
      {entries === undefined && <LoadingState size="sm" />}

      {entries?.length === 0 && (
        <EmptyState
          icon={Trophy}
          title="अभी कोई डेटा नहीं"
          description="इस विषय में पहला टेस्ट देकर लीडरबोर्ड पर अपनी जगह बनाएं।"
          className="py-4"
        />
      )}

      {entries && entries.length > 0 && (
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <div
              key={entry.userId}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors",
                entry.rank <= 3
                  ? RANK_STYLES[entry.rank - 1]
                  : "border-border/60 bg-muted/20",
              )}
            >
              {/* Rank */}
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums bg-background/60">
                {entry.rank <= 3 ? (
                  <Medal className="h-3.5 w-3.5" />
                ) : (
                  entry.rank
                )}
              </span>

              {/* Name */}
              <span className="flex-1 text-xs font-medium text-foreground truncate font-hindi">
                {entry.displayName}
              </span>

              {/* Stats */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-muted-foreground font-hindi">
                  {entry.testsAttempted} टेस्ट
                </span>
                <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-md bg-background/80 text-foreground border border-border/60">
                  {entry.bestScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSubject && (
        <p className="text-[10px] text-muted-foreground/60 text-center font-hindi">
          {getSubjectDisplayName(selectedSubject)} — सर्वश्रेष्ठ स्कोर के आधार पर
        </p>
      )}
    </Card>
  );
}
