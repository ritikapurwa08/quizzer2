import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/permissions";

// Fixed negative-marking deduction, applied app-wide per SRD Section 9/17.
const NEGATIVE_MARK_VALUE = 0.25;

export const start = mutation({
  args: { testSetId: v.id("testSets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Resume an in-progress attempt for this test set if one exists,
    // rather than creating duplicates.
    const inProgress = await ctx.db
      .query("attempts")
      .withIndex("by_user_test_set", (q) =>
        q.eq("userId", user._id).eq("testSetId", args.testSetId),
      )
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .unique();

    if (inProgress) return inProgress._id;

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test_set", (q) => q.eq("testSetId", args.testSetId))
      .collect();

    return await ctx.db.insert("attempts", {
      userId: user._id,
      testSetId: args.testSetId,
      startedAt: Date.now(),
      answers: [],
      totalQuestions: questions.length,
      status: "in_progress",
    });
  },
});

/** Debounced from the client on every answer selection — see useQuizSession. */
export const saveAnswer = mutation({
  args: {
    attemptId: v.id("attempts"),
    questionId: v.id("questions"),
    selected: v.union(v.string(), v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt || attempt.userId !== user._id) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") throw new Error("Attempt already submitted");

    const answers = attempt.answers.filter((a) => a.questionId !== args.questionId);
    answers.push({ questionId: args.questionId, selected: args.selected });
    await ctx.db.patch(args.attemptId, { answers });
  },
});

function answersMatch(correct: string | string[], selected: string | string[] | undefined) {
  if (selected === undefined) return false;
  if (Array.isArray(correct)) {
    if (!Array.isArray(selected) || selected.length !== correct.length) return false;
    return correct.every((v, i) => v === selected[i]);
  }
  return correct === selected;
}

/**
 * Server-authoritative scoring — the client never determines the final score.
 * Also upserts the wrongQuestions bank for every missed question
 * (SRD Section 4/9).
 */
export const submit = mutation({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt || attempt.userId !== user._id) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") throw new Error("Attempt already submitted");

    const testSet = await ctx.db.get(attempt.testSetId);
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test_set", (q) => q.eq("testSetId", attempt.testSetId))
      .collect();
    const questionMap = new Map(questions.map((q) => [q._id, q]));

    let score = 0;
    const scoredAnswers = [];

    for (const question of questions) {
      const answer = attempt.answers.find((a) => a.questionId === question._id);
      const isCorrect = answer
        ? answersMatch(question.correctAnswer, answer.selected)
        : false;

      if (answer) {
        scoredAnswers.push({ ...answer, isCorrect });
      }

      if (isCorrect) {
        score += 1;
      } else if (answer && testSet?.negativeMarking) {
        score -= NEGATIVE_MARK_VALUE;
      }

      if (answer && !isCorrect) {
        const existingWrong = await ctx.db
          .query("wrongQuestions")
          .withIndex("by_user_question", (q) =>
            q.eq("userId", user._id).eq("questionId", question._id),
          )
          .unique();

        if (existingWrong) {
          await ctx.db.patch(existingWrong._id, {
            lastMissedAt: Date.now(),
            missCount: existingWrong.missCount + 1,
            resolved: false,
          });
        } else {
          await ctx.db.insert("wrongQuestions", {
            userId: user._id,
            questionId: question._id,
            lastMissedAt: Date.now(),
            missCount: 1,
            resolved: false,
          });
        }
      } else if (answer && isCorrect) {
        const existingWrong = await ctx.db
          .query("wrongQuestions")
          .withIndex("by_user_question", (q) =>
            q.eq("userId", user._id).eq("questionId", question._id),
          )
          .unique();
        if (existingWrong && !existingWrong.resolved) {
          await ctx.db.patch(existingWrong._id, { resolved: true });
        }
      }
    }

    await ctx.db.patch(args.attemptId, {
      answers: scoredAnswers,
      score,
      submittedAt: Date.now(),
      status: "submitted",
    });

    return { score, totalQuestions: questions.length };
  },
});

export const getWithQuestions = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt || attempt.userId !== user._id) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test_set", (q) => q.eq("testSetId", attempt.testSetId))
      .collect();

    return { attempt, questions: questions.sort((a, b) => a.order - b.order) };
  },
});

export const latestSubmittedForTestSet = query({
  args: { testSetId: v.id("testSets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_test_set", (q) =>
        q.eq("userId", user._id).eq("testSetId", args.testSetId),
      )
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    const latest = attempts.sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0))[0];
    if (!latest) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test_set", (q) => q.eq("testSetId", args.testSetId))
      .collect();

    return { attempt: latest, questions: questions.sort((a, b) => a.order - b.order) };
  },
});

export const recentByUser = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    const sorted = attempts
      .sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0))
      .slice(0, args.limit ?? 10);

    return await Promise.all(
      sorted.map(async (attempt) => {
        const testSet = await ctx.db.get(attempt.testSetId);
        const topic = testSet ? await ctx.db.get(testSet.topicId) : null;
        const subject = topic ? await ctx.db.get(topic.subjectId) : null;
        return {
          ...attempt,
          testSetName: testSet?.name ?? "Practice Set",
          subjectName: subject?.name ?? "General",
        };
      })
    );
  },
});
