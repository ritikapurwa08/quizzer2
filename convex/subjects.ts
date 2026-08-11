import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/permissions";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    return subjects.sort((a, b) => a.order - b.order);
  },
});

/** Returns { subjectId -> setCount } across all subjects for the listing page badge. */
export const setCountsAllSubjects = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    const result: Record<string, number> = {};
    for (const subject of subjects) {
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_subject", (q) => q.eq("subjectId", subject._id))
        .collect();
      let count = 0;
      for (const topic of topics) {
        const sets = await ctx.db
          .query("testSets")
          .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
          .collect();
        count += sets.length;
      }
      result[subject._id] = count;
    }
    return result;
  },
});

export const get = query({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subjects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const create = mutation({
  args: { name: v.string(), nameHindi: v.optional(v.string()), slug: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error(`Subject slug "${args.slug}" already exists`);

    const all = await ctx.db.query("subjects").collect();
    return await ctx.db.insert("subjects", {
      name: args.name,
      nameHindi: args.nameHindi,
      slug: args.slug,
      description: args.description,
      order: all.length,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("subjects"),
    name: v.optional(v.string()),
    nameHindi: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.id))
      .collect();
    for (const topic of topics) {
      const sets = await ctx.db
        .query("testSets")
        .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
        .collect();
      for (const set of sets) {
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_test_set", (q) => q.eq("testSetId", set._id))
          .collect();
        for (const question of questions) await ctx.db.delete(question._id);
        await ctx.db.delete(set._id);
      }
      await ctx.db.delete(topic._id);
    }
    await ctx.db.delete(args.id);
  },
});
