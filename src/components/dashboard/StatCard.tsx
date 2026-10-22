import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card hover:border-foreground/30 hover:shadow-xs transition-all group select-none min-h-[3.5rem]",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors duration-200">
          <Icon className="h-4.5 w-4.5 transition-colors" aria-hidden="true" />
        </div>
        <span className="text-xs sm:text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors truncate font-hindi">
          {label}
        </span>
      </div>
      <span className="text-sm sm:text-base md:text-lg font-bold text-foreground tabular-nums shrink-0 ml-2">
        {value}
      </span>
    </Card>
  );
}


