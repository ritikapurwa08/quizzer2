"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { AppLoadingScreen } from "@/components/shared/LoadingState";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  // Only query api.users.me if requireAdmin check is explicitly requested
  const user = useQuery(api.users.me, requireAdmin && isAuthenticated ? {} : "skip");
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    } else if (requireAdmin && !authLoading && isAuthenticated && user !== undefined && user !== null) {
      if (user?.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, user, requireAdmin, router]);

  // For admin routes, wait for role verification
  if (requireAdmin && (authLoading || user === undefined)) {
    return <AppLoadingScreen />;
  }

  // If user is definitively logged out on the client, unmount children while redirecting
  if (!authLoading && !isAuthenticated) {
    return null;
  }

  // For normal student routes, render children immediately (instant SSR + skeleton shell)
  return <>{children}</>;
}
