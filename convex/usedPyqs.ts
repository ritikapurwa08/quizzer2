import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/permissions";

/**
 * Returns distinct used sourceQuestionIds for the selected topic.
 * Enables reactive exclusion in client-side PYQ retrieval.
 */
export const getUsedSourceQuestionIds = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("usedPyqs")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    const uniqueIds = Array.from(new Set(records.map((r) => r.sourceQuestionId)));
    return uniqueIds;
  },
});

/**
 * Returns used count and list of sourceQuestionIds for a topic.
 */
export const getUsageStats = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("usedPyqs")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    const uniqueIds = Array.from(new Set(records.map((r) => r.sourceQuestionId)));
    return {
      usedCount: uniqueIds.length,
      sourceQuestionIds: uniqueIds,
    };
  },
});

/**
 * Admin-only: Clear used PYQs tracking for a topic.
 */
export const clearTopicUsage = mutation({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const records = await ctx.db
      .query("usedPyqs")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    for (const r of records) {
      await ctx.db.delete(r._id);
    }

    return { cleared: records.length };
  },
});
