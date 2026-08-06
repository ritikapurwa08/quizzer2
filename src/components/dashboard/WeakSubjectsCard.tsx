import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Target } from "lucide-react";

interface WeakSubject {
  name: string;
  accuracy: number;
}

export function WeakSubjectsCard({ subjects }: { subjects: WeakSubject[] }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="font-medium mb-3">Weak Subjects</p>
      {subjects.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No weak areas identified"
          description="Attempt a few tests to see your weak subjects here."
          className="py-6"
        />
      ) : (
        <div className="space-y-2">
          {subjects.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="text-sm flex-1 truncate">{s.name}</span>
              <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-destructive"
                  style={{ width: `${Math.min(100, s.accuracy)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right">
                {s.accuracy.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
