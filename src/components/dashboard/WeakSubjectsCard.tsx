import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Target } from "lucide-react";

interface WeakSubject {
  name: string;
  accuracy: number;
}

function DonutRing({ percentage }: { percentage: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(100, Math.max(0, percentage)) / 100);

  return (
    <div className="relative flex items-center justify-center h-9 w-9 shrink-0">
      <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r={radius}
          strokeWidth="3.5"
          className="stroke-muted fill-none"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="stroke-destructive fill-none transition-all duration-500"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-foreground">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}

export function WeakSubjectsCard({ subjects }: { subjects: WeakSubject[] }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="font-semibold text-sm mb-3">Weak Subjects</p>
      {subjects.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Weak subjects show up here"
          description="Complete a few practice tests to pinpoint low-accuracy topics."
          className="py-6"
        />
      ) : (
        <div className="space-y-2">
          {subjects.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between gap-3 p-2 rounded-lg border border-border/50 bg-card/40 hover:bg-card transition-all"
            >
              <span className="text-xs font-medium flex-1 truncate text-foreground">{s.name}</span>
              <DonutRing percentage={s.accuracy} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
