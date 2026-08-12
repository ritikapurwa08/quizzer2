import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Target } from "lucide-react";

interface WeakSubject {
  name: string;
  accuracy: number;
}

function DonutRing({ percentage }: { percentage: number }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference * (1 - Math.min(100, Math.max(0, percentage)) / 100);
  const formatted = Math.round(percentage);

  return (
    <div className="relative flex items-center justify-center h-10 w-10 shrink-0 select-none">
      <svg className="h-10 w-10" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          strokeWidth="3.5"
          className="stroke-muted/30 fill-none"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          className="stroke-destructive fill-none transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[8.5px] font-bold text-foreground leading-none tabular-nums tracking-tighter">
          {formatted}%
        </span>
      </div>
    </div>
  );
}

export function WeakSubjectsCard({ subjects }: { subjects: WeakSubject[] }) {
  return (
    <Card className="p-4 sm:p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between">
      <div className="flex flex-row items-center justify-between mb-3.5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-destructive" />
          Weak Subjects
        </h2>
        {subjects.length > 0 && (
          <Badge variant="destructive" className="text-[10px] px-2 py-0.5 rounded-full">
            Needs Practice
          </Badge>
        )}
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Weak subjects show up here"
          description="Complete a few practice tests to pinpoint low-accuracy topics."
          className="py-6"
        />
      ) : (
        <div className="space-y-2">
          {subjects.map((s, idx) => (
            <div
              key={s.name}
              className="flex flex-row items-center justify-between gap-3 p-2.5 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-all group"
            >
              <div className="flex flex-row items-center gap-2.5 min-w-0 flex-1">
                <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-destructive/10 text-destructive text-[11px] font-bold shrink-0">
                  {idx + 1}
                </span>
                <span className="text-xs sm:text-sm font-semibold truncate text-foreground group-hover:text-destructive transition-colors">
                  {s.name}
                </span>
              </div>
              <DonutRing percentage={s.accuracy} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
