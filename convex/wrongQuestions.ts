import { query } from "./_generated/server";
import { requireUser } from "./lib/permissions";

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const wrong = await ctx.db
      .query("wrongQuestions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("resolved"), false))
      .collect();

    const withQuestions = await Promise.all(
      wrong.map(async (w) => ({
        wrongQuestion: w,
        question: await ctx.db.get(w.questionId),
      })),
    );

    return withQuestions
      .filter((w) => w.question !== null)
      .sort((a, b) => {
        if (b.wrongQuestion.missCount !== a.wrongQuestion.missCount) {
          return b.wrongQuestion.missCount - a.wrongQuestion.missCount;
        }
        return b.wrongQuestion.lastMissedAt - a.wrongQuestion.lastMissedAt;
      });
  },
});
