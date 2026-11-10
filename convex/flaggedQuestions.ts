import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./lib/permissions";

const flagTypeValidator = v.union(
  v.literal("wrong_answer"),
  v.literal("duplicate"),
  v.literal("similar"),
  v.literal("formatting")
);

export const getForQuestion = query({
  args: { questionId: v.string() },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return null;
    }

    const flag = await ctx.db
      .query("flaggedQuestions")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", user._id).eq("questionId", args.questionId)
      )
      .first();

    return flag;
  },
});

export const listAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      await requireAdmin(ctx);
    } catch {
      return [];
    }

    const limit = args.limit ?? 200;
    const flags = await ctx.db
      .query("flaggedQuestions")
      .withIndex("by_flagged_at")
      .order("desc")
      .take(limit);

    return flags;
  },
});

export const flag = mutation({
  args: {
    questionId: v.string(),
    testSetId: v.optional(v.string()),
    questionNumber: v.optional(v.number()),
    flagType: flagTypeValidator,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("flaggedQuestions")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", user._id).eq("questionId", args.questionId)
      )
      .first();

    const timestamp = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        flagType: args.flagType,
        note: args.note !== undefined ? args.note : existing.note,
        testSetId: args.testSetId ?? existing.testSetId,
        questionNumber: args.questionNumber ?? existing.questionNumber,
        flaggedAt: timestamp,
      });
      return { id: existing._id, updated: true };
    }

    const id = await ctx.db.insert("flaggedQuestions", {
      userId: user._id,
      questionId: args.questionId,
      testSetId: args.testSetId,
      questionNumber: args.questionNumber,
      flagType: args.flagType,
      note: args.note,
      flaggedAt: timestamp,
    });

    return { id, updated: false };
  },
});

export const remove = mutation({
  args: { questionId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);

    const flags = await ctx.db
      .query("flaggedQuestions")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", user._id).eq("questionId", args.questionId)
      )
      .collect();

    for (const item of flags) {
      await ctx.db.delete(item._id);
    }

    return { removedCount: flags.length };
  },
});
