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
    return <AppLoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && user?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
