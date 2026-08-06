import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/permissions";

export const listByTopic = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const sets = await ctx.db
      .query("testSets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();
    return sets.sort((a, b) => a.order - b.order);
  },
});

export const get = query({
  args: { id: v.id("testSets") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const create = mutation({
  args: {
    topicId: v.id("topics"),
    name: v.string(),
    negativeMarking: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const siblings = await ctx.db
      .query("testSets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    return await ctx.db.insert("testSets", {
      topicId: args.topicId,
      name: args.name,
      negativeMarking: args.negativeMarking,
      order: siblings.length,
      questionCount: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("testSets"),
    name: v.optional(v.string()),
    negativeMarking: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("testSets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test_set", (q) => q.eq("testSetId", args.id))
      .collect();
    for (const question of questions) await ctx.db.delete(question._id);
    await ctx.db.delete(args.id);
  },
});
