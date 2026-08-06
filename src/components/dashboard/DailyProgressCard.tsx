import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingUp } from "lucide-react";

interface DailyPoint {
  day: string;
  count: number;
}

export function DailyProgressCard({ data }: { data: DailyPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card className="p-4 sm:p-5 rounded-xl shadow-xs">
      <p className="font-semibold text-sm mb-3 text-foreground">Daily Progress</p>
      {data.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Daily activity shows up here"
          description="Attempt a test set to build your revision streak."
          className="py-6"
        />
      ) : (
        <div className="flex items-end gap-1.5 h-24 pt-2">
          {data.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end" title={`${d.day}: ${d.count} questions`}>
              <div
                className="w-full rounded-md bg-primary/80 hover:bg-primary transition-all shadow-2xs cursor-pointer"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: 4 }}
              />
              <span className="text-[10px] text-muted-foreground font-medium">{d.day.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
