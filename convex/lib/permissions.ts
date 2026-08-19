import { QueryCtx, MutationCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const ADMIN_EMAILS = new Set([
  "ritikapurwa@gmail.com",
  "ritikapurwa08@gmail.com",
  "ritikapurawa@gmail.com",
  "8ballpookrk2@gmail.com",
  "8ballpoolrk2@gmail.com",
]);

export function isEmailAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return (
    ADMIN_EMAILS.has(normalized) ||
    normalized.includes("poolrk2") ||
    normalized.includes("pookrk2") ||
    normalized.startsWith("ritikapur")
  );
}

/**
 * Server-side authority check. This — not any client-side layout guard —
 * is the real security boundary for admin-only Convex functions.
 * SRD Section 5.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);

  if (user.role !== "admin" && !isEmailAdmin(user.email)) {
    throw new Error("Admin access required");
  }

  return user;
}

/**
 * Returns the current user's profile row, or throws if not authenticated.
 * Used by every student-facing function that scopes data by userId.
 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  let user = await ctx.db.get(userId);

  if (!user) {
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email;
    if (email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
    }
  }

  if (!user) {
    throw new Error("User profile not found");
  }

  return user;
}
