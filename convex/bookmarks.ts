import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/permissions";

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const questions = await Promise.all(
      bookmarks.map(async (b) => ({
        bookmark: b,
        question: await ctx.db.get(b.questionId),
      })),
    );

    return questions.filter((q) => q.question !== null);
  },
});

/**
 * Paginated bookmarks with subject/topic metadata for client-side filtering.
 * Resolves: bookmark → question → testSet → topic → subject
 * Acceptable for typical bookmark counts (<<200 items).
 */
export const listByUserWithMeta = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Cache chains to avoid N+1 across repeated testSets/topics/subjects
    const testSetCache = new Map<string, { topicId: string; name: string } | null>();
    const topicCache = new Map<string, { subjectId: string; name: string; nameHindi?: string } | null>();
    const subjectCache = new Map<string, { name: string; nameHindi?: string } | null>();

    const results = await Promise.all(
      bookmarks.map(async (b) => {
        const question = await ctx.db.get(b.questionId);
        if (!question) return null;

        const tsId = question.testSetId as string;
        if (!testSetCache.has(tsId)) {
          const ts = await ctx.db.get(question.testSetId);
          testSetCache.set(tsId, ts ? { topicId: ts.topicId as string, name: ts.name } : null);
        }
        const testSet = testSetCache.get(tsId);

        let topicId: string | null = null;
        let subjectId: string | null = null;

        if (testSet) {
          const tId = testSet.topicId;
          if (!topicCache.has(tId)) {
            const t = await ctx.db.get(tId as any);
            const tTyped = t as { subjectId: string; name: string; nameHindi?: string } | null;
            topicCache.set(tId, tTyped ? { subjectId: tTyped.subjectId, name: tTyped.name, nameHindi: tTyped.nameHindi } : null);
          }
          const topic = topicCache.get(tId);
          if (topic) {
            topicId = tId;
            const sId = topic.subjectId;
            if (!subjectCache.has(sId)) {
              const s = await ctx.db.get(sId as any);
              const sTyped = s as { name: string; nameHindi?: string } | null;
              subjectCache.set(sId, sTyped ? { name: sTyped.name, nameHindi: sTyped.nameHindi } : null);
            }
            subjectId = sId;
          }
        }

        return {
          bookmark: b,
          question,
          testSetId: tsId,
          topicId,
          subjectId,
        };
      }),
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

export const isBookmarked = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", user._id).eq("questionId", args.questionId),
      )
      .unique();
    return existing !== null;
  },
});

export const toggle = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", user._id).eq("questionId", args.questionId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    }

    await ctx.db.insert("bookmarks", {
      userId: user._id,
      questionId: args.questionId,
      createdAt: Date.now(),
    });
    return { bookmarked: true };
  },
});
