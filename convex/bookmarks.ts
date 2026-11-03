import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./lib/permissions";

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return [];
    }
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return bookmarks.map((b) => ({
      bookmark: b,
      questionId: b.questionId,
      subjectId: b.subjectId ?? null,
      topicId: b.topicId ?? null,
    }));
  },
});

export const listQuestionIdsByUser = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return [];
    }
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return bookmarks.map((b) => b.questionId);
  },
});

/**
 * Bookmarks with subject/topic metadata for client-side filtering.
 * Returns bookmarks directly with questionId for local-first question resolution.
 */
export const listByUserWithMeta = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return [];
    }
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return bookmarks.map((b) => ({
      bookmark: b,
      questionId: b.questionId,
      subjectId: b.subjectId ?? null,
      topicId: b.topicId ?? null,
    }));
  },
});

export const isBookmarked = query({
  args: { questionId: v.string() },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return false;
    }
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
  args: {
    questionId: v.string(),
    topicId: v.optional(v.union(v.id("topics"), v.string())),
    subjectId: v.optional(v.union(v.id("subjects"), v.string())),
  },
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

    const insertSubjectId = args.subjectId && args.subjectId.length === 32 ? (args.subjectId as Id<"subjects">) : undefined;
    const insertTopicId = args.topicId && args.topicId.length === 32 ? (args.topicId as Id<"topics">) : undefined;

    await ctx.db.insert("bookmarks", {
      userId: user._id,
      questionId: args.questionId,
      subjectId: insertSubjectId,
      topicId: insertTopicId,
      createdAt: Date.now(),
    });
    return { bookmarked: true };
  },
});
