import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./lib/permissions";

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

/** Returns { topicId -> setCount } for all topics in a subject. */
export const countsBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();

    const result: Record<string, number> = {};
    for (const topic of topics) {
      const sets = await ctx.db
        .query("testSets")
        .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
        .collect();
      result[topic._id] = sets.length;
    }
    return result;
  },
});

/** IDs of test sets the current user has submitted at least once. */
export const completedSetIds = query({
  args: {},
  handler: async (ctx) => {
    // Use requireUser() — the canonical user-resolution path used across the
    // entire backend. The old ctx.auth.getUserIdentity().email lookup was
    // unreliable: it could silently return [] if the email was missing or
    // mismatched, causing "Completed" badges to never appear after submission.
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return [] as string[];
    }

    const submitted = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    return [...new Set(submitted.map((a) => a.testSetId as string))];
  },
});

/** Site-wide totals: total practice sets and total questions. */
export const siteStats = query({
  args: {},
  handler: async (ctx) => {
    const sets = await ctx.db.query("testSets").collect();
    const totalSets = sets.length;
    const totalQuestions = sets.reduce((sum, s) => sum + s.questionCount, 0);
    return { totalSets, totalQuestions };
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
