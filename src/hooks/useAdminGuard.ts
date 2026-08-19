"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { isUserAdmin } from "@/lib/constants";

/**
 * Client-side UX guard only — avoids a flash of admin UI.
 * The real security boundary is requireAdmin() inside every admin Convex function.
 */
export function useAdminGuard() {
  const router = useRouter();
  const me = useQuery(api.users.me);

  const isAdmin = isUserAdmin(me);

  useEffect(() => {
    if (me === undefined) return; // still loading
    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [me, isAdmin, router]);

  return { isAdmin, isLoading: me === undefined };
}
