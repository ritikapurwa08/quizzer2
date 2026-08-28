import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="flex flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all group select-none min-h-[3.5rem]">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
          <Icon className="h-4.5 w-4.5 transition-colors" />
        </div>
        <span className="text-xs sm:text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors truncate font-hindi">
          {label}
        </span>
      </div>
      <span className="text-sm sm:text-base md:text-lg font-bold text-foreground tabular-nums shrink-0 ml-2">
        {value}
      </span>
    </div>
  );
}


