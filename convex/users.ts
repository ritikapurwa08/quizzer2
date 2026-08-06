import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/** Returns the current user's profile row (with role), or null if signed out. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

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

    return user;
  },
});
