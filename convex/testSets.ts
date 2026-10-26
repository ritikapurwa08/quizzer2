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
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "submitted"))
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
  args: { id: v.union(v.id("testSets"), v.string()) },
  handler: async (ctx, args) => {
    try {
      return await ctx.db.get(args.id as Id<"testSets">);
    } catch {
      return null;
    }
  },
});

export const getByTopicAndName = query({
  args: { topicId: v.id("topics"), name: v.string() },
  handler: async (ctx, args) => {
    const sets = await ctx.db
      .query("testSets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();
    return sets.find((s) => s.name.trim() === args.name.trim()) ?? null;
  },
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

/**
 * Returns 2-3 next recommended test sets for the user:
 * - If user attempted Set 5 of a topic, recommends Set 6!
 * - If user has an in-progress attempt, recommends resuming it!
 * - Otherwise recommends fresh unattempted sets from topics.
 */
export const nextRecommendedSets = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return [];
    }

    const limit = args.limit ?? 3;

    // 1. Check for any in-progress attempt first (resume)
    const inProgressAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "in_progress"))
      .order("desc")
      .take(limit);

    // 2. Fetch submitted attempts (newest first)
    const submittedAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "submitted"))
      .order("desc")
      .take(20);

    const completedSetIds = new Set(submittedAttempts.map((a) => a.testSetId as string));
    const recommendations: Array<{
      testSetId: Id<"testSets">;
      testSetName: string;
      topicId: Id<"topics">;
      topicName: string;
      subjectId: Id<"subjects">;
      subjectName: string;
      questionCount: number;
      badgeText: string;
      type: "resume" | "next_in_topic" | "new_topic";
    }> = [];

    const addedSetIds = new Set<string>();

    // Add in-progress attempts first
    for (const inProgress of inProgressAttempts) {
      if (recommendations.length >= limit) break;
      const testSet = await ctx.db.get(inProgress.testSetId);
      if (!testSet) continue;
      const topic = await ctx.db.get(testSet.topicId);
      if (!topic) continue;
      const subject = await ctx.db.get(topic.subjectId);
      if (!subject) continue;

      recommendations.push({
        testSetId: testSet._id,
        testSetName: testSet.name,
        topicId: topic._id,
        topicName: topic.nameHindi || topic.name,
        subjectId: subject._id,
        subjectName: subject.nameHindi || subject.name,
        questionCount: testSet.questionCount,
        badgeText: "Resume Test",
        type: "resume",
      });
      addedSetIds.add(testSet._id as string);
    }

    // Now look at recently submitted attempts to find next set in the same topic
    const seenTopicIds = new Set<string>();
    for (const sub of submittedAttempts) {
      if (recommendations.length >= limit) break;
      const testSet = await ctx.db.get(sub.testSetId);
      if (!testSet) continue;
      const topicId = testSet.topicId as string;
      if (seenTopicIds.has(topicId)) continue;
      seenTopicIds.add(topicId);

      // Find sibling sets in this topic ordered by order
      const siblingSets = await ctx.db
        .query("testSets")
        .withIndex("by_topic", (q) => q.eq("topicId", testSet.topicId))
        .collect();
      siblingSets.sort((a, b) => a.order - b.order);

      // Find the first sibling set with order > current set's order that hasn't been completed
      const nextSet = siblingSets.find(
        (s) => s.order > testSet.order && !completedSetIds.has(s._id as string) && !addedSetIds.has(s._id as string)
      );
      if (nextSet) {
        const topic = await ctx.db.get(nextSet.topicId);
        if (topic) {
          const subject = await ctx.db.get(topic.subjectId);
          if (subject) {
            recommendations.push({
              testSetId: nextSet._id,
              testSetName: nextSet.name,
              topicId: topic._id,
              topicName: topic.nameHindi || topic.name,
              subjectId: subject._id,
              subjectName: subject.nameHindi || subject.name,
              questionCount: nextSet.questionCount,
              badgeText: "Next in Topic",
              type: "next_in_topic",
            });
            addedSetIds.add(nextSet._id as string);
          }
        }
      }
    }

    // If still need more to reach limit, recommend fresh unattempted sets
    if (recommendations.length < limit) {
      const allSets = await ctx.db.query("testSets").take(30);
      for (const set of allSets) {
        if (recommendations.length >= limit) break;
        if (!completedSetIds.has(set._id as string) && !addedSetIds.has(set._id as string) && set.questionCount > 0) {
          const topic = await ctx.db.get(set.topicId);
          if (topic) {
            const subject = await ctx.db.get(topic.subjectId);
            if (subject) {
              recommendations.push({
                testSetId: set._id,
                testSetName: set.name,
                topicId: topic._id,
                topicName: topic.nameHindi || topic.name,
                subjectId: subject._id,
                subjectName: subject.nameHindi || subject.name,
                questionCount: set.questionCount,
                badgeText: "Recommended Practice",
                type: "new_topic",
              });
              addedSetIds.add(set._id as string);
            }
          }
        }
      }
    }

    return recommendations;
  },
});

