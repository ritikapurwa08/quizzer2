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
    <Card className="p-4 sm:p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 font-hindi">
          <TrendingUp className="h-4 w-4 text-primary" />
          दैनिक अभ्यास प्रगति (Daily Streak)
        </h2>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="दैनिक अभ्यास यहाँ दिखेगा"
          description="प्रतिदिन प्रश्न हल करके अपनी अध्ययन निरंतरता बनाए रखें।"
          className="py-6"
        />
      ) : (
        <div className="flex items-end gap-1.5 h-24 pt-2">
          {data.map((d) => (
            <div
              key={d.day}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
              title={`${d.day}: ${d.count} questions`}
            >
              <div
                className="w-full rounded-md bg-primary/75 group-hover:bg-primary transition-all duration-200 shadow-2xs cursor-pointer"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: 4 }}
              />
              <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                {d.day.slice(0, 3)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

