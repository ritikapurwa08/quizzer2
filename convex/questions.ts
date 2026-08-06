import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/permissions";
import { questionInputValidator } from "./lib/validators";

export const listByTestSet = query({
  args: { testSetId: v.id("testSets") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test_set", (q) => q.eq("testSetId", args.testSetId))
      .collect();
    return questions.sort((a, b) => a.order - b.order);
  },
});

/** Admin-only: search question text across the whole bank. */
export const search = query({
  args: { term: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.term.trim().length === 0) return [];
    const all = await ctx.db.query("questions").collect();
    const term = args.term.toLowerCase();
    return all.filter((q) => q.questionText.toLowerCase().includes(term)).slice(0, 100);
  },
});

export const update = mutation({
  args: {
    id: v.id("questions"),
    questionText: v.optional(v.string()),
    options: v.optional(v.array(v.object({ id: v.string(), text: v.string() }))),
    correctAnswer: v.optional(v.union(v.string(), v.array(v.string()))),
    explanation: v.optional(v.string()),
    reference: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const question = await ctx.db.get(args.id);
    if (!question) return;
    await ctx.db.delete(args.id);
    const testSet = await ctx.db.get(question.testSetId);
    if (testSet) {
      await ctx.db.patch(testSet._id, {
        questionCount: Math.max(0, testSet.questionCount - 1),
      });
    }
  },
});

/**
 * Bulk import — the mutation the Import wizard calls after validation
 * passes client-side. Runs atomically per test set (SRD Section 7):
 * if any insert fails, none of the batch is committed.
 */
export const bulkImport = mutation({
  args: {
    testSetId: v.id("testSets"),
    questions: v.array(questionInputValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("questions")
      .withIndex("by_test_set", (q) => q.eq("testSetId", args.testSetId))
      .collect();

    let order = existing.length;
    for (const q of args.questions) {
      await ctx.db.insert("questions", {
        testSetId: args.testSetId,
        type: q.type,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        reference: q.reference,
        difficulty: q.difficulty,
        order: order++,
        meta: q.meta,
      });
    }

    const testSet = await ctx.db.get(args.testSetId);
    if (testSet) {
      await ctx.db.patch(testSet._id, {
        questionCount: existing.length + args.questions.length,
      });
    }

    return { imported: args.questions.length };
  },
});
