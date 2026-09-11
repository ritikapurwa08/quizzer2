import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./lib/permissions";

/**
 * Paginated wrong-questions query.
 *
 * sortBy:
 *   "latest"      — newest missed first  (uses by_user_last_missed index, O(page) reads)
 *   "most_missed" — highest missCount first (full collect, sorted; fine for revision bank size)
 *   "oldest"      — oldest missed first   (uses by_user_last_missed, ascending)
 * wrong one 
 */
export const listByUserPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
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

    if (sortBy === "most_missed") {
      // Full collect then sort — acceptable because revision banks are typically small (<200).
      const all = await ctx.db
        .query("wrongQuestions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
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

      const withQuestions = await Promise.all(
        page.map(async (w) => ({
          wrongQuestion: w,
          question: await ctx.db.get(w.questionId),
        })),
      );

      return {
        page: withQuestions.filter((w) => w.question !== null),
        isDone,
        continueCursor: isDone ? null : String(startIdx + numItems),
      };
    }

    // Index-backed query for latest / oldest
    const baseQuery = ctx.db
      .query("wrongQuestions")
      .withIndex("by_user_last_missed", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("resolved"), false));

    const ordered =
      sortBy === "oldest" ? baseQuery.order("asc") : baseQuery.order("desc");

    const result = await ordered.paginate(args.paginationOpts);

    const withQuestions = await Promise.all(
      result.page.map(async (w) => ({
        wrongQuestion: w,
        question: await ctx.db.get(w.questionId),
      })),
    );

    return {
      ...result,
      page: withQuestions.filter((w) => w.question !== null),
    };
  },
});

/** Backward-compat shim — used by the quiz submit flow. Not called from UI. */
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

    const withQuestions = await Promise.all(
      wrong.map(async (w) => ({
        wrongQuestion: w,
        question: await ctx.db.get(w.questionId),
      })),
    );

    return withQuestions.filter((w) => w.question !== null);
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
