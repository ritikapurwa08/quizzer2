"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ADMIN_EMAILS } from "@/lib/constants";

/**
 * Client-side UX guard only — avoids a flash of admin UI.
 * The real security boundary is requireAdmin() inside every admin Convex function.
 *
 * Admin access is granted when the user:
 *   - has role === "admin"  (set via convex auth.upsertUserProfile)
 *   OR
 *   - has an email in the ADMIN_EMAILS allowlist (ritikapurwa@gmail.com, 8ballpookrk2@gmail.com)
 */
export function useAdminGuard() {
  const router = useRouter();
  const me = useQuery(api.users.me);

  const isAdmin =
    me?.role === "admin" ||
    (me?.email ? ADMIN_EMAILS.has(me.email.toLowerCase()) : false);

  useEffect(() => {
    if (me === undefined) return; // still loading
    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [me, isAdmin, router]);

  return { isAdmin, isLoading: me === undefined };
}
