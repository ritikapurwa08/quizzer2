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

/** Full-screen branded loader shown by AuthGuard while verifying session. */
export function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-5 select-none">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="h-72 w-72 rounded-full bg-primary/10 blur-[80px] animate-pulse" />
      </div>

      {/* Logo mark */}
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-lg">
        <span className="text-2xl font-bold text-primary">Q</span>
        {/* Rotating ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-primary/60 animate-spin [animation-duration:1.2s]" />
      </div>

      {/* Text */}
      <div className="space-y-1.5 text-center">
        <p className="text-sm font-semibold text-foreground font-hindi">
          सत्र सत्यापित किया जा रहा है
          <span className="inline-flex ml-1 tracking-widest text-primary animate-pulse">…</span>
        </p>
        <p className="text-xs text-muted-foreground font-hindi">कृपया प्रतीक्षा करें</p>
      </div>

      {/* Progress track */}
      <div className="w-24 h-0.5 bg-muted rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent animate-[shimmer_1.5s_infinite]" />
      </div>
    </div>
  );
}

