import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./lib/permissions";

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return [];
    }
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

export const listQuestionIdsByUser = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return [];
    }
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return bookmarks.map((b) => b.questionId);
  },
});

/**
 * Paginated bookmarks with subject/topic metadata for client-side filtering.
 * Resolves: bookmark → question → testSet → topic → subject
 * Uses compound indexes by_user_topic and by_user_subject when filtered.
 */
export const listByUserWithMeta = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return [];
    }
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

        let topicId: string | null = (b.topicId as string) ?? null;
        let subjectId: string | null = (b.subjectId as string) ?? null;
        const tsId = question.testSetId as string;

        if (!topicId || !subjectId) {
          if (!testSetCache.has(tsId)) {
            const ts = await ctx.db.get(question.testSetId);
            testSetCache.set(tsId, ts ? { topicId: ts.topicId as string, name: ts.name } : null);
          }
          const testSet = testSetCache.get(tsId);

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
  args: { questionId: v.union(v.id("questions"), v.string()) },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return false;
    }
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", user._id).eq("questionId", args.questionId as any),
      )
      .unique();
    return existing !== null;
  },
});

export const toggle = mutation({
  args: {
    questionId: v.union(v.id("questions"), v.string()),
    topicId: v.optional(v.union(v.id("topics"), v.string())),
    subjectId: v.optional(v.union(v.id("subjects"), v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", user._id).eq("questionId", args.questionId as any),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    }

    let topicId: any = args.topicId;
    let subjectId: any = args.subjectId;
    try {
      const question = (await ctx.db.get(args.questionId as any)) as Doc<"questions"> | null;
      if (question) {
        const testSet = (await ctx.db.get(question.testSetId)) as Doc<"testSets"> | null;
        if (testSet) {
          topicId = testSet.topicId;
          const topic = (await ctx.db.get(testSet.topicId)) as Doc<"topics"> | null;
          if (topic) {
            subjectId = topic.subjectId;
          }
        }
      }
    } catch {
      // String questionId
    }

    await ctx.db.insert("bookmarks", {
      userId: user._id,
      questionId: args.questionId as any,
      subjectId,
      topicId,
      createdAt: Date.now(),
    });
    return { bookmarked: true };
  },
});
