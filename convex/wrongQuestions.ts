import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./lib/permissions";

/**
 * Paginated wrong-questions query.
 * Returns wrong questions metadata with questionId for local-first question resolution.
 */
export const listByUserPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    subjectId: v.optional(v.id("subjects")),
    topicId: v.optional(v.id("topics")),
    sortBy: v.optional(
      v.union(
        v.literal("latest"),
        v.literal("most_missed"),
        v.literal("oldest"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const sortBy = args.sortBy ?? "latest";
    const filterTopic = args.topicId;
    const filterSubject = args.subjectId;

    if (sortBy === "most_missed") {
      let queryBuilder;
      if (filterTopic) {
        queryBuilder = ctx.db
          .query("wrongQuestions")
          .withIndex("by_user_topic", (q) =>
            q.eq("userId", user._id).eq("topicId", filterTopic),
          );
      } else if (filterSubject) {
        queryBuilder = ctx.db
          .query("wrongQuestions")
          .withIndex("by_user_subject", (q) =>
            q.eq("userId", user._id).eq("subjectId", filterSubject),
          );
      } else {
        queryBuilder = ctx.db
          .query("wrongQuestions")
          .withIndex("by_user_resolved", (q) =>
            q.eq("userId", user._id).eq("resolved", false),
          );
      }

      const all = await queryBuilder
        .filter((q) => q.eq(q.field("resolved"), false))
        .collect();

      all.sort((a, b) => {
        if (b.missCount !== a.missCount) return b.missCount - a.missCount;
        return b.lastMissedAt - a.lastMissedAt;
      });

      // Manual pagination
      const numItems = args.paginationOpts.numItems;
      const cursor = args.paginationOpts.cursor;
      const startIdx = cursor ? parseInt(cursor, 10) : 0;
      const page = all.slice(startIdx, startIdx + numItems);
      const isDone = startIdx + numItems >= all.length;

      return {
        page: page.map((w) => ({
          wrongQuestion: w,
          questionId: w.questionId,
        })),
        isDone,
        continueCursor: isDone ? null : String(startIdx + numItems),
      };
    }

    // Index-backed query for latest / oldest
    let baseQuery;
    if (filterTopic) {
      baseQuery = ctx.db
        .query("wrongQuestions")
        .withIndex("by_user_topic", (q) =>
          q.eq("userId", user._id).eq("topicId", filterTopic),
        )
        .filter((q) => q.eq(q.field("resolved"), false));
    } else if (filterSubject) {
      baseQuery = ctx.db
        .query("wrongQuestions")
        .withIndex("by_user_subject", (q) =>
          q.eq("userId", user._id).eq("subjectId", filterSubject),
        )
        .filter((q) => q.eq(q.field("resolved"), false));
    } else {
      baseQuery = ctx.db
        .query("wrongQuestions")
        .withIndex("by_user_last_missed", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("resolved"), false));
    }

    const ordered =
      sortBy === "oldest" ? baseQuery.order("asc") : baseQuery.order("desc");

    const result = await ordered.paginate(args.paginationOpts);

    return {
      ...result,
      page: result.page.map((w) => ({
        wrongQuestion: w,
        questionId: w.questionId,
      })),
    };
  },
});

/** Backward-compat shim — used by the quiz submit flow. */
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const wrong = await ctx.db
      .query("wrongQuestions")
      .withIndex("by_user_last_missed", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("resolved"), false))
      .order("desc")
      .collect();

    return wrong.map((w) => ({
      wrongQuestion: w,
      questionId: w.questionId,
    }));
  },
});

/** Mark a wrong question as resolved (user has mastered it). */
export const markResolved = mutation({
  args: { wrongQuestionId: v.id("wrongQuestions") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const wq = await ctx.db.get(args.wrongQuestionId);
    if (!wq || wq.userId !== user._id) throw new Error("Not found");
    await ctx.db.patch(args.wrongQuestionId, { resolved: true });
  },
});

/**
 * Wrong-questions with subject/topic metadata and subject breakdown counts.
 * Enables rich filtering by subject and topic on the client side.
 */
export const listByUserWithMeta = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return { items: [], subjectsWithCounts: [] };
    }

    const wrong = await ctx.db
      .query("wrongQuestions")
      .withIndex("by_user_resolved", (q) =>
        q.eq("userId", user._id).eq("resolved", false),
      )
      .order("desc")
      .collect();

    const subjects = await ctx.db.query("subjects").collect();
    const subMap = new Map<string, { subjectId: string; name: string; nameHindi?: string; count: number }>();
    for (const s of subjects) {
      subMap.set(s._id, {
        subjectId: s._id,
        name: s.name,
        nameHindi: s.nameHindi,
        count: 0,
      });
    }

    for (const w of wrong) {
      if (w.subjectId && subMap.has(w.subjectId)) {
        subMap.get(w.subjectId)!.count += 1;
      }
    }

    return {
      items: wrong.map((w) => ({
        wrongQuestion: w,
        questionId: w.questionId,
        subjectId: w.subjectId ?? null,
        topicId: w.topicId ?? null,
      })),
      subjectsWithCounts: Array.from(subMap.values()).filter((s) => s.count > 0),
    };
  },
});

export const recordWrong = mutation({
  args: {
    questionId: v.string(),
    subjectId: v.optional(v.union(v.id("subjects"), v.string())),
    topicId: v.optional(v.union(v.id("topics"), v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("wrongQuestions")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", user._id).eq("questionId", args.questionId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastMissedAt: Date.now(),
        missCount: existing.missCount + 1,
        resolved: false,
      });
      return existing._id;
    }

    const insertSubjectId = args.subjectId && args.subjectId.length === 32 ? (args.subjectId as Id<"subjects">) : undefined;
    const insertTopicId = args.topicId && args.topicId.length === 32 ? (args.topicId as Id<"topics">) : undefined;

    return await ctx.db.insert("wrongQuestions", {
      userId: user._id,
      questionId: args.questionId,
      subjectId: insertSubjectId,
      topicId: insertTopicId,
      lastMissedAt: Date.now(),
      missCount: 1,
      resolved: false,
    });
  },
});
