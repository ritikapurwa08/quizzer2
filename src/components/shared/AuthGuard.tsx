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
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Animated spinner — two concentric rings */}
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            {/* Outer ring */}
            <span
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              aria-hidden="true"
            />
            {/* Spinning arc */}
            <span
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"
              aria-hidden="true"
            />
            {/* Inner dot */}
            <span
              className="h-3 w-3 rounded-full bg-primary/40"
              aria-hidden="true"
            />
          </div>

          {/* Text */}
          <div className="space-y-1.5">
            <p className="text-base font-semibold tracking-tight text-foreground">
              Verify Session
            </p>
            <p className="text-sm text-muted-foreground">
              Checking your session, please wait…
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
