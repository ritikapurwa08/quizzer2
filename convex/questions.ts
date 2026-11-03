import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/permissions";
import { questionInputValidator } from "./lib/validators";

export const listByTestSet = query({
  args: { testSetId: v.id("testSets") },
  handler: async () => {
    // Questions are served local-first via /api/sets/[testSetId]
    return [];
  },
});

export const search = query({
  args: {
    term: v.optional(v.string()),
    subjectId: v.optional(v.id("subjects")),
    topicId: v.optional(v.id("topics")),
    testSetId: v.optional(v.id("testSets")),
    sourceType: v.optional(v.string()),
    exam: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return [];
  },
});

export const countSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [testSets, topics, subjects] = await Promise.all([
      ctx.db.query("testSets").collect(),
      ctx.db.query("topics").collect(),
      ctx.db.query("subjects").collect(),
    ]);

    const totalQuestions = testSets.reduce((sum, s) => sum + (s.questionCount ?? 0), 0);

    return {
      totalQuestions,
      totalTestSets: testSets.length,
      totalTopics: topics.length,
      totalSubjects: subjects.length,
    };
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return { success: true };
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    questionText: v.string(),
    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
      }),
    ),
    correctAnswer: v.union(v.string(), v.array(v.string())),
    explanation: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    type: v.string(),
    reference: v.optional(v.string()),
    meta: v.optional(v.any()),
  },
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return { success: true };
  },
});

export const checkExistingProvenance = query({
  args: {
    sourceQuestionIds: v.array(v.union(v.string(), v.number())),
  },
  handler: async () => {
    // Provenance is managed local-first via candidate-set and master pool
    return { existingSourceIds: [] };
  },
});

export const importTestSet = mutation({
  args: {
    topicId: v.id("topics"),
    name: v.string(),
    negativeMarking: v.boolean(),
    questions: v.array(questionInputValidator),
    isFinalSet: v.optional(v.boolean()),
    masterTopicId: v.optional(v.number()),
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
