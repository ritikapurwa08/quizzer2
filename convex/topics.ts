import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/permissions";

export const listBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();
    return topics.sort((a, b) => a.order - b.order);
  },
});

export const get = query({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getBySlug = query({
  args: { subjectId: v.id("subjects"), slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("topics")
      .withIndex("by_subject_slug", (q) =>
        q.eq("subjectId", args.subjectId).eq("slug", args.slug),
      )
      .unique();
  },
});

export const create = mutation({
  args: { subjectId: v.id("subjects"), name: v.string(), nameHindi: v.optional(v.string()), slug: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("topics")
      .withIndex("by_subject_slug", (q) =>
        q.eq("subjectId", args.subjectId).eq("slug", args.slug),
      )
      .unique();
    if (existing) throw new Error(`Topic slug "${args.slug}" already exists in this subject`);

    const siblings = await ctx.db
      .query("topics")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();

    return await ctx.db.insert("topics", {
      subjectId: args.subjectId,
      name: args.name,
      nameHindi: args.nameHindi,
      slug: args.slug,
      order: siblings.length,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("topics"),
    name: v.optional(v.string()),
    nameHindi: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const sets = await ctx.db
      .query("testSets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.id))
      .collect();
    for (const set of sets) {
      const questions = await ctx.db
        .query("questions")
        .withIndex("by_test_set", (q) => q.eq("testSetId", set._id))
        .collect();
      for (const question of questions) await ctx.db.delete(question._id);
      await ctx.db.delete(set._id);
    }
    await ctx.db.delete(args.id);
  },
});
