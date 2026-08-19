import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/permissions";

// RPSC Exam Standard: 2 marks per question, 1/3 (0.33) negative marking per incorrect answer.
export const MARKS_PER_QUESTION = 2.0;
export const DEFAULT_NEGATIVE_MARK_VALUE = 0.33;

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
  if (selected === undefined || selected === null) return false;
  if (Array.isArray(correct)) {
    if (!Array.isArray(selected) || selected.length !== correct.length) return false;
    return correct.every((v, i) => v === selected[i]);
  }
  return correct === selected;
}

/**
 * Server-authoritative scoring — the client never determines the final score.
 * Formula per RPSC Exam Pattern:
 * Total Score = (Correct Questions * Marks Per Question) - (Wrong Questions * Negative Marking Fee)
 * Unanswered/Skipped questions do NOT incur negative marks.
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

    let correctCount = 0;
    let wrongCount = 0;
    const scoredAnswers = [];

    for (const question of questions) {
      const answer = attempt.answers.find((a) => a.questionId === question._id);
      const isAttempted =
        answer !== undefined &&
        answer.selected !== undefined &&
        answer.selected !== null &&
        answer.selected !== "" &&
        (!Array.isArray(answer.selected) || answer.selected.length > 0);

      const isCorrect = isAttempted
        ? answersMatch(question.correctAnswer, answer.selected)
        : false;

      if (answer) {
        scoredAnswers.push({ ...answer, isCorrect });
      }

      if (isAttempted) {
        if (isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }

      // Upsert wrong questions bank for missed questions
      if (isAttempted && !isCorrect) {
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
      }
    }

    // Scoring calculation:
    // Total = (Correct * 2) - (Wrong * Negative Marking Fee)
    const marksPerQ = MARKS_PER_QUESTION;
    const negativePerQ = testSet?.negativeMarking !== false ? DEFAULT_NEGATIVE_MARK_VALUE : 0;
    const rawScore = (correctCount * marksPerQ) - (wrongCount * negativePerQ);
    const score = Number(Math.max(0, rawScore).toFixed(2));

    await ctx.db.patch(args.attemptId, {
      answers: scoredAnswers,
      score,
      submittedAt: Date.now(),
      status: "submitted",
    });

    return { score, correctCount, wrongCount, total: questions.length };
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

    return {
      attempt,
      questions: questions.sort((a, b) => a.order - b.order),
    };
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

    return {
      attempt: latest,
      questions: questions.sort((a, b) => a.order - b.order),
    };
  },
});

export const recentByUser = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.limit ?? 5;
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    const sorted = attempts
      .sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0))
      .slice(0, limit);

    const withSetNames = await Promise.all(
      sorted.map(async (a) => {
        const testSet = await ctx.db.get(a.testSetId);
        return { ...a, testSetName: testSet?.name ?? "Practice Set" };
      }),
    );

    return withSetNames;
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const withSetNames = await Promise.all(
      attempts.map(async (a) => {
        const testSet = await ctx.db.get(a.testSetId);
        return { ...a, testSetName: testSet?.name ?? "Unknown Set" };
      }),
    );

    return withSetNames.sort((a, b) => b.startedAt - a.startedAt);
  },
});

export const getInProgress = query({
  args: { testSetId: v.id("testSets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("attempts")
      .withIndex("by_user_test_set", (q) =>
        q.eq("userId", user._id).eq("testSetId", args.testSetId),
      )
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .unique();
  },
});
