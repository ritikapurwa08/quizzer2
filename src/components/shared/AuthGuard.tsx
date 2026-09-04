"use client";

import { useConvexAuth, useQuery } from "convex/react";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    } else if (!authLoading && isAuthenticated && user !== undefined && user !== null) {
      if (requireAdmin && user?.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, user, requireAdmin, router]);

  if (authLoading || (isAuthenticated && user === undefined)) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4">
        {/* Soft atmospheric background glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="h-80 w-80 rounded-full bg-primary/10 blur-[100px] animate-pulse" />
        </div>

        {/* Floating frosted verification card */}
        <div className="relative flex flex-col items-center gap-5 p-7 sm:p-8 rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl shadow-2xl max-w-xs w-full text-center">
          {/* Multi-ring orbital radar spinner */}
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            {/* Ambient soft glow ring */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse" />
            
            {/* Outer static track */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            
            {/* Outer fast spinning gradient ring */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin [animation-duration:1s]" />
            
            {/* Inner reverse-spinning dashed ring */}
            <div className="absolute inset-2 rounded-full border border-dashed border-primary/40 animate-spin [animation-duration:3s] [animation-direction:reverse]" />
            
            {/* Center pulsing core indicator */}
            <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
              <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            </div>
          </div>

          {/* Hindi-first session verification text */}
          <div className="space-y-1.5 w-full">
            <h3 className="text-sm font-bold tracking-tight text-foreground font-hindi flex items-center justify-center gap-1">
              <span>सत्र सत्यापित किया जा रहा है</span>
              <span className="inline-flex tracking-widest text-primary animate-pulse">…</span>
            </h3>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-hindi">
              <span>कृपया प्रतीक्षा करें</span>
              <span className="flex items-center gap-1 pt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce" />
              </span>
            </div>
          </div>

          {/* Sleek indeterminate indicator track */}
          <div className="w-28 h-1 bg-muted rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && user?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
