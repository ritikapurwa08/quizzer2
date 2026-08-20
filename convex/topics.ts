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

/** Returns topic-level completion & attempt progress for the authenticated user across a subject. */
export const progressBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let user = null;
    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
        .unique();
    }

    const topics = await ctx.db
      .query("topics")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();

    const result: Record<
      string,
      {
        totalSets: number;
        completedSets: number;
        attemptCount: number;
        latestScore?: number;
        bestScore?: number;
        status: "not_attempted" | "in_progress" | "completed";
      }
    > = {};

    for (const topic of topics) {
      const sets = await ctx.db
        .query("testSets")
        .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
        .collect();

      const totalSets = sets.length;
      let completedSets = 0;
      let attemptCount = 0;
      let latestScore: number | undefined = undefined;
      let bestScore: number | undefined = undefined;
      let hasInProgress = false;

      if (user && totalSets > 0) {
        for (const set of sets) {
          const userAttempts = await ctx.db
            .query("attempts")
            .withIndex("by_user_test_set", (q) =>
              q.eq("userId", user._id).eq("testSetId", set._id)
            )
            .collect();

          const submitted = userAttempts.filter((a) => a.status === "submitted");
          const inProgress = userAttempts.filter((a) => a.status === "in_progress");

          if (inProgress.length > 0) hasInProgress = true;

          if (submitted.length > 0) {
            completedSets++;
            attemptCount += submitted.length;

            for (const sub of submitted) {
              if (sub.score !== undefined) {
                if (bestScore === undefined || sub.score > bestScore) {
                  bestScore = sub.score;
                }
                if (latestScore === undefined || (sub.submittedAt ?? 0) > (latestScore ?? 0)) {
                  latestScore = sub.score;
                }
              }
            }
          }
        }
      }

      let status: "not_attempted" | "in_progress" | "completed" = "not_attempted";
      if (totalSets > 0 && completedSets === totalSets) {
        status = "completed";
      } else if (completedSets > 0 || hasInProgress) {
        status = "in_progress";
      }

      result[topic._id] = {
        totalSets,
        completedSets,
        attemptCount,
        latestScore,
        bestScore,
        status,
      };
    }

    return result;
  },
});

/** Returns attempt progress for a single topic. */
export const getProgress = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let user = null;
    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
        .unique();
    }

    const sets = await ctx.db
      .query("testSets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    const totalSets = sets.length;
    let completedSets = 0;
    let attemptCount = 0;
    let latestScore: number | undefined = undefined;
    let bestScore: number | undefined = undefined;
    let hasInProgress = false;

    if (user && totalSets > 0) {
      for (const set of sets) {
        const userAttempts = await ctx.db
          .query("attempts")
          .withIndex("by_user_test_set", (q) =>
            q.eq("userId", user._id).eq("testSetId", set._id)
          )
          .collect();

        const submitted = userAttempts.filter((a) => a.status === "submitted");
        const inProgress = userAttempts.filter((a) => a.status === "in_progress");

        if (inProgress.length > 0) hasInProgress = true;

        if (submitted.length > 0) {
          completedSets++;
          attemptCount += submitted.length;

          for (const sub of submitted) {
            if (sub.score !== undefined) {
              if (bestScore === undefined || sub.score > bestScore) {
                bestScore = sub.score;
              }
              if (latestScore === undefined || (sub.submittedAt ?? 0) > (latestScore ?? 0)) {
                latestScore = sub.score;
              }
            }
          }
        }
      }
    }

    let status: "not_attempted" | "in_progress" | "completed" = "not_attempted";
    if (totalSets > 0 && completedSets === totalSets) {
      status = "completed";
    } else if (completedSets > 0 || hasInProgress) {
      status = "in_progress";
    }

    return {
      totalSets,
      completedSets,
      attemptCount,
      latestScore,
      bestScore,
      status,
    };
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
