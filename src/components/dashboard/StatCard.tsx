import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <Card className="flex items-center gap-3 p-3.5 hover:border-primary/50 transition-all shadow-xs rounded-xl group">
      <div className="rounded-lg bg-primary/10 p-2 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        <Icon className="h-4.5 w-4.5 text-primary group-hover:text-primary-foreground transition-colors" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
        <p className="text-base sm:text-lg font-bold tracking-tight leading-none mt-1 text-foreground">{value}</p>
      </div>
    </Card>
  );
}
