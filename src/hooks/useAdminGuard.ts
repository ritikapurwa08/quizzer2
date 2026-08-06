"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Client-side UX guard only — avoids a flash of admin UI. The real
 * security boundary is requireAdmin() inside every admin Convex
 * function. SRD Section 5.
 */
export function useAdminGuard() {
  const router = useRouter();
  const me = useQuery(api.users.me);

  useEffect(() => {
    if (me === undefined) return; // still loading
    if (me === null || me.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [me, router]);

  return { isAdmin: me?.role === "admin", isLoading: me === undefined };
}
