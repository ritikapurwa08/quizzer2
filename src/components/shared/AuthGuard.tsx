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
      <div className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Animated spinner — subtle ring */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              aria-hidden="true"
            />
            <span
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"
              aria-hidden="true"
            />
            <span
              className="h-2 w-2 rounded-full bg-primary"
              aria-hidden="true"
            />
          </div>

          {/* Hindi-first session verification text */}
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-tight text-foreground font-hindi">
              सत्र सत्यापित किया जा रहा है…
            </p>
            <p className="text-xs text-muted-foreground">
              कृपया प्रतीक्षा करें…
            </p>
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
