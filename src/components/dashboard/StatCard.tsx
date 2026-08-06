import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <Card className="flex items-center gap-2.5 p-3">
      <div className="rounded-md bg-muted p-1.5 shrink-0">
        <Icon className="h-4.5 w-4.5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-base sm:text-lg font-semibold leading-none mt-0.5">{value}</p>
      </div>
    </Card>
  );
}
