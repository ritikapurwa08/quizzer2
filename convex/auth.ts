import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          ...(params.name ? { name: params.name as string } : {}),
          role: (params.role as "admin" | "student") || "student",
        };
      },
    }),
  ],
});

/**
 * One-off mutation the admin can call (from the Convex dashboard "Run Function"
 * panel, not exposed in the UI) to promote a freshly-created account to admin,
 * or to register a new student. There is no public sign-up page by design —
 * see SRD Section 5.
 */
export const upsertUserProfile = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("student")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role, name: args.name });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      role: args.role,

    });
  },
});
