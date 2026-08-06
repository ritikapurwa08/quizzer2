import { Card } from "@/components/ui/card";

interface DailyPoint {
  day: string;
  count: number;
}

export function DailyProgressCard({ data }: { data: DailyPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card>
      <p className="font-medium mb-3">Daily Progress</p>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet — attempt a test to start your streak.</p>
      ) : (
        <div className="flex items-end gap-1 h-20">
          {data.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${d.day}: ${d.count} questions`}>
              <div
                className="w-full rounded-sm bg-primary/70"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
