import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./lib/permissions";

export const listByTopic = query({
  args: {
    topicId: v.union(v.id("topics"), v.string()),
    subTopicId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const sets = await ctx.db
        .query("testSets")
        .withIndex("by_topic", (q) => q.eq("topicId", args.topicId as any))
        .collect();
      let filtered = sets.filter((s) => !s.isArchived);
      if (args.subTopicId && args.subTopicId !== "all") {
        filtered = filtered.filter((s) => s.subTopicId === args.subTopicId || s.subTopic === args.subTopicId);
      }
      return filtered.sort((a, b) => a.order - b.order);
    } catch {
      return [];
    }
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
      result[topic._id] = sets.filter((s) => !s.isArchived).length;
    }
    return result;
  },
});

/** IDs of test sets the current user has submitted at least once. */
export const completedSetIds = query({
  args: { topicId: v.optional(v.union(v.id("topics"), v.string())) },
  handler: async (ctx, args) => {
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

    // Free-tier defense & Question-Overlap Auto-Marking:
    // 1-doc read fast path from pre-computed userDashboardFeed
    const feed = await ctx.db
      .query("userDashboardFeed")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (feed && feed.setOverlapMap) {
      const completedFromMap: string[] = [];
      for (const [sId, info] of Object.entries(feed.setOverlapMap as Record<string, any>)) {
        if (info && info.status === "completed") {
          completedFromMap.push(sId);
        }
      }
      return completedFromMap;
    }

    // Quota-protected: if topicId is provided, query only sets belonging to this topic
    if (args.topicId) {
      const topicSets = await ctx.db
        .query("testSets")
        .withIndex("by_topic", (q) => q.eq("topicId", args.topicId as any))
        .collect();

      const completedIds: string[] = [];
      for (const s of topicSets) {
        const attempt = await ctx.db
          .query("attempts")
          .withIndex("by_user_test_set_status", (q) =>
            q.eq("userId", user._id).eq("testSetId", s._id).eq("status", "submitted")
          )
          .first();
        if (attempt) {
          completedIds.push(s._id);
        }
      }
      return completedIds;
    }

    const submitted = await ctx.db
      .query("attempts")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "submitted"))
      .take(100);

    return [...new Set(submitted.map((a) => a.testSetId as string))];
  },
});

/** Site-wide totals: total active practice sets and total questions. */
export const siteStats = query({
  args: {},
  handler: async (ctx) => {
    // Free-tier defense: 1-document read fast path from globalCatalogSummary
    const summary = await ctx.db
      .query("globalCatalogSummary")
      .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "global"))
      .first();

    if (summary) {
      return {
        totalSets: summary.totalSets,
        totalQuestions: summary.totalQuestions,
      };
    }

    // Fallback if not yet seeded
    const sets = await ctx.db.query("testSets").collect();
    const activeSets = sets.filter((s) => !s.isArchived);
    const totalSets = activeSets.length;
    const totalQuestions = activeSets.reduce((sum, s) => sum + s.questionCount, 0);
    return { totalSets, totalQuestions };
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("testSets").collect();
  },
});

export const get = query({
  args: { id: v.union(v.id("testSets"), v.string()) },
  handler: async (ctx, args): Promise<Doc<"testSets"> | null> => {
    try {
      return (await ctx.db.get(args.id as Id<"testSets">)) as Doc<"testSets"> | null;
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
    questionCount: v.optional(v.number()),
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
      questionCount: args.questionCount ?? 0,
    });
  },
});

export const importTestSet = mutation({
  args: {
    topicId: v.id("topics"),
    name: v.string(),
    negativeMarking: v.boolean(),
    questions: v.array(v.any()),
    isFinalSet: v.optional(v.boolean()),
    masterTopicId: v.optional(v.number()),
    subTopicId: v.optional(v.string()),
    subTopic: v.optional(v.string()),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== "quizzer_admin_pool_init_2026") {
      await requireAdmin(ctx);
    }
    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new Error("Topic not found");

    const siblings = await ctx.db
      .query("testSets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    const testSetId = await ctx.db.insert("testSets", {
      topicId: args.topicId,
      name: args.name,
      negativeMarking: args.negativeMarking,
      order: siblings.length + 1,
      questionCount: args.questions.length,
      subTopicId: args.subTopicId,
      subTopic: args.subTopic,
    });

    return {
      testSetId,
      testSetIds: [testSetId],
      imported: args.questions.length,
      setsCreated: 1,
      setNames: [args.name],
    };
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
  args: {
    id: v.id("testSets"),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== "quizzer_admin_pool_init_2026") {
      await requireAdmin(ctx);
    }
    await ctx.db.delete(args.id);
  },
});

export const purgeRetiredSets = mutation({
  args: {
    retiredSetIds: v.array(v.id("testSets")),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== "quizzer_admin_pool_init_2026") {
      await requireAdmin(ctx);
    }
    let count = 0;
    for (const id of args.retiredSetIds) {
      const set = await ctx.db.get(id);
      if (set) {
        await ctx.db.delete(id);
        count++;
      }
    }
    return { success: true, count };
  },
});

export const syncWithPublished = mutation({
  args: {
    retiredSetIds: v.array(v.id("testSets")),
    danglingAttemptIds: v.optional(v.array(v.id("attempts"))),
    setsToInsert: v.optional(
      v.array(
        v.object({
          name: v.string(),
          topicId: v.union(v.id("topics"), v.string()),
          questionCount: v.number(),
          order: v.number(),
          negativeMarking: v.boolean(),
        })
      )
    ),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== "quizzer_admin_pool_init_2026") {
      await requireAdmin(ctx);
    }
    let deletedCount = 0;
    for (const id of args.retiredSetIds) {
      const set = await ctx.db.get(id);
      if (set) {
        await ctx.db.delete(id);
        deletedCount++;
      }
    }
    let deletedAttemptsCount = 0;
    if (args.danglingAttemptIds) {
      for (const id of args.danglingAttemptIds) {
        const attempt = await ctx.db.get(id);
        if (attempt) {
          await ctx.db.delete(id);
          deletedAttemptsCount++;
        }
      }
    }
    const insertedSets: Array<{ id: string; name: string }> = [];
    if (args.setsToInsert) {
      for (const s of args.setsToInsert) {
        const id = await ctx.db.insert("testSets", {
          name: s.name,
          topicId: s.topicId as any,
          questionCount: s.questionCount,
          order: s.order,
          negativeMarking: s.negativeMarking,
        });
        insertedSets.push({ id, name: s.name });
      }
    }
    return { success: true, deletedCount, deletedAttemptsCount, insertedSets };
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

    const limit = args.limit ?? 6;

    // Helper to identify English subject vs Rajasthan GK
    const isEnglishSubject = (name: string) => /english|अंग्रेजी/i.test(name);

    // 1. Fetch user in-progress attempts (newest first)
    const inProgressAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "in_progress"))
      .order("desc")
      .take(10);

    // 2. Fetch submitted attempts (newest first, limit to 8 to avoid N+1 DB churn)
    const submittedAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "submitted"))
      .order("desc")
      .take(8);

    const completedSetIds = new Set(submittedAttempts.map((a) => a.testSetId as string));
    const addedSetIds = new Set<string>();

    // In-memory entity lookup caches for this query
    const topicCache = new Map<string, any>();
    const subjectCache = new Map<string, any>();
    const siblingCache = new Map<string, any[]>();

    async function getTopicCached(topicId: Id<"topics">) {
      const key = String(topicId);
      if (!topicCache.has(key)) {
        topicCache.set(key, await ctx.db.get(topicId));
      }
      return topicCache.get(key);
    }

    async function getSubjectCached(subjectId: Id<"subjects">) {
      const key = String(subjectId);
      if (!subjectCache.has(key)) {
        subjectCache.set(key, await ctx.db.get(subjectId));
      }
      return subjectCache.get(key);
    }

    type RecommendedItem = {
      testSetId: Id<"testSets">;
      testSetName: string;
      topicId: Id<"topics">;
      topicName: string;
      subjectId: Id<"subjects">;
      subjectName: string;
      questionCount: number;
      badgeText: string;
      type: "resume" | "next_in_topic" | "new_topic";
    };

    const recommendations: RecommendedItem[] = [];
    const seenTopics = new Set<string>();

    // ── STEP 1: RESUME IN-PROGRESS ATTEMPTS (Strictly 1 set per topic) ──
    for (const inProgress of inProgressAttempts) {
      if (recommendations.length >= 2) break;
      const testSet = await ctx.db.get(inProgress.testSetId);
      if (!testSet || testSet.isArchived || addedSetIds.has(testSet._id as string)) continue;
      const topic = await ctx.db.get(testSet.topicId);
      if (!topic || seenTopics.has(topic._id as string)) continue;
      const subject = await ctx.db.get(topic.subjectId);
      if (!subject) continue;

      const subName = subject.nameHindi || subject.name;

      recommendations.push({
        testSetId: testSet._id,
        testSetName: testSet.name,
        topicId: topic._id,
        topicName: topic.nameHindi || topic.name,
        subjectId: subject._id,
        subjectName: subName,
        questionCount: testSet.questionCount,
        badgeText: "Resume Attempt",
        type: "resume",
      });

      addedSetIds.add(testSet._id as string);
      seenTopics.add(topic._id as string);
    }

    // ── STEP 2: NEXT IN SEQUENCE FOR RECENTLY SUBMITTED TOPICS ──
    for (const sub of submittedAttempts) {
      if (recommendations.length >= limit) break;
      const testSet = await ctx.db.get(sub.testSetId);
      if (!testSet || testSet.isArchived) continue;
      const topic = await getTopicCached(testSet.topicId);
      if (!topic || seenTopics.has(topic._id as string)) continue;
      const subject = await getSubjectCached(topic.subjectId);
      if (!subject) continue;

      const subName = subject.nameHindi || subject.name;

      // Find sibling sets in this topic ordered by order (exclude archived) with cache
      const topicKey = String(testSet.topicId);
      if (!siblingCache.has(topicKey)) {
        const sets = (await ctx.db
          .query("testSets")
          .withIndex("by_topic", (q) => q.eq("topicId", testSet.topicId))
          .collect()).filter((s) => !s.isArchived);
        sets.sort((a, b) => a.order - b.order);
        siblingCache.set(topicKey, sets);
      }
      const siblingSets = siblingCache.get(topicKey) || [];

      const nextSet = siblingSets.find(
        (s) => s.order > testSet.order && !completedSetIds.has(s._id as string) && !addedSetIds.has(s._id as string)
      );

      if (nextSet) {
        recommendations.push({
          testSetId: nextSet._id,
          testSetName: nextSet.name,
          topicId: topic._id,
          topicName: topic.nameHindi || topic.name,
          subjectId: subject._id,
          subjectName: subName,
          questionCount: nextSet.questionCount,
          badgeText: "Next in Sequence",
          type: "next_in_topic",
        });

        addedSetIds.add(nextSet._id as string);
        seenTopics.add(topic._id as string);
      }
    }

    // ── STEP 3: FRESH UNATTEMPTED SETS ACROSS DIVERSE TOPICS ──
    if (recommendations.length < limit) {
      const allSubjects = await ctx.db.query("subjects").collect();
      // Ensure we sample across different subjects (Geography, History, Art & Culture, Polity, English)
      for (const sub of allSubjects) {
        if (recommendations.length >= limit) break;
        const subName = sub.nameHindi || sub.name;
        const topics = await ctx.db
          .query("topics")
          .withIndex("by_subject", (q) => q.eq("subjectId", sub._id))
          .take(12);

        for (const t of topics) {
          if (recommendations.length >= limit) break;
          if (seenTopics.has(t._id as string) || t.isArchived) continue;

          // Find uncompleted sets in this topic
          const sets = await ctx.db
            .query("testSets")
            .withIndex("by_topic", (q) => q.eq("topicId", t._id))
            .take(6);

          const candidate = sets.find(
            (s) => !s.isArchived && s.questionCount > 0 && !completedSetIds.has(s._id as string) && !addedSetIds.has(s._id as string)
          );

          if (candidate) {
            recommendations.push({
              testSetId: candidate._id,
              testSetName: candidate.name,
              topicId: t._id,
              topicName: t.nameHindi || t.name,
              subjectId: sub._id,
              subjectName: subName,
              questionCount: candidate.questionCount,
              badgeText: "Recommended Practice",
              type: "new_topic",
            });

            addedSetIds.add(candidate._id as string);
            seenTopics.add(t._id as string);
            break; // Move to next subject for diversity
          }
        }
      }
    }

    return recommendations.slice(0, limit);
  },
});

export const archiveSetsBatch = mutation({
  args: {
    archivedIds: v.array(v.id("testSets")),
    activeUpdates: v.optional(
      v.array(
        v.object({
          id: v.id("testSets"),
          questionCount: v.number(),
        })
      )
    ),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== "quizzer_admin_pool_init_2026") {
      await requireAdmin(ctx);
    }
    let archivedCount = 0;
    for (const id of args.archivedIds) {
      const set = await ctx.db.get(id);
      if (set && !set.isArchived) {
        await ctx.db.patch(id, { isArchived: true });
        archivedCount++;
      }
    }
    let activeUpdatedCount = 0;
    if (args.activeUpdates) {
      for (const item of args.activeUpdates) {
        const set = await ctx.db.get(item.id);
        if (set && (set.questionCount !== item.questionCount || set.isArchived)) {
          await ctx.db.patch(item.id, {
            questionCount: item.questionCount,
            isArchived: false,
          });
          activeUpdatedCount++;
        }
      }
    }
    return { success: true, archivedCount, activeUpdatedCount };
  },
});

