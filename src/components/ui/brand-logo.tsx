import React from "react";
import { cn } from "@/lib/utils";

export interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({
  className,
  iconOnly = false,
  size = "md",
  ...props
}: BrandLogoProps) {
  const dimensions = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  }[size];

  const textSize = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }[size];

  return (
    <div
      className={cn("inline-flex items-center gap-2.5 select-none", className)}
      {...props}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-xs transition-transform duration-200 hover:scale-105",
          dimensions
        )}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-3/4 w-3/4"
        >
          {/* Outer Precision Q Shield / Ring */}
          <path
            d="M18 4C10.268 4 4 10.268 4 18C4 25.732 10.268 32 18 32C20.93 32 23.65 31.1 25.9 29.56L29.5 33.16L32.33 30.33L28.85 26.85C30.82 24.44 32 21.36 32 18C32 10.268 25.732 4 18 4ZM18 8C23.523 8 28 12.477 28 18C28 20.19 27.29 22.21 26.1 23.86L22.66 20.42L19.83 23.25L23.22 26.64C21.69 27.51 19.9 28 18 28C12.477 28 8 23.523 8 18C8 12.477 12.477 8 18 8Z"
            fill="currentColor"
          />
          {/* Inner Lightning / Check Spark representing Fast Mastery */}
          <path
            d="M19.5 11.5L13.5 18.5H17.5L16.5 24.5L22.5 17.5H18.5L19.5 11.5Z"
            fill="currentColor"
            className="opacity-90"
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-bold tracking-tight text-foreground", textSize)}>
            Quizzer<span className="text-primary">.</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Exam Prep
          </span>
        </div>
      )}
    </div>
  );
}

