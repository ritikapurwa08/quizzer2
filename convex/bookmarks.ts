import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/permissions";

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const questions = await Promise.all(
      bookmarks.map(async (b) => ({
        bookmark: b,
        question: await ctx.db.get(b.questionId),
      })),
    );

    return questions.filter((q) => q.question !== null);
  },
});

export const isBookmarked = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", user._id).eq("questionId", args.questionId),
      )
      .unique();
    return existing !== null;
  },
});

export const toggle = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", user._id).eq("questionId", args.questionId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    }

    await ctx.db.insert("bookmarks", {
      userId: user._id,
      questionId: args.questionId,
      createdAt: Date.now(),
    });
    return { bookmarked: true };
  },
});
