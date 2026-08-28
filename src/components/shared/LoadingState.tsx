import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-10 w-10 border-[3px]",
  };

  return (
    <div
      className={cn(
        "rounded-full border-primary/20 border-t-primary animate-spin shrink-0",
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  message = "लोड हो रहा है…",
  subMessage,
  className,
  size = "md",
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center select-none",
        className
      )}
    >
      <LoadingSpinner size={size} />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground font-hindi">{message}</p>
        {subMessage && (
          <p className="text-xs text-muted-foreground">{subMessage}</p>
        )}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse max-w-4xl mx-auto py-6">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="h-16 bg-muted/60 rounded-xl" />
        <div className="h-16 bg-muted/60 rounded-xl" />
        <div className="h-16 bg-muted/60 rounded-xl" />
        <div className="h-16 bg-muted/60 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="h-20 bg-muted/40 rounded-xl" />
        <div className="h-20 bg-muted/40 rounded-xl" />
        <div className="h-20 bg-muted/40 rounded-xl" />
      </div>
    </div>
  );
}
