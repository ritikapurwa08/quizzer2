import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, subtitle, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        "p-4 rounded-2xl border border-border/80 bg-card hover:border-border transition-all flex flex-col justify-between gap-2.5 shadow-2xs group select-none",
        className
      )}
    >
      {/* Top Header: Label + Refined Icon Container */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors font-hindi">
          {label}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </div>

      {/* Main Metric Value & Subtitle */}
      <div className="space-y-0.5">
        <div className="text-2xl sm:text-3xl font-black text-foreground tabular-nums tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}
