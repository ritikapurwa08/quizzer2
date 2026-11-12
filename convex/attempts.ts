import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./lib/permissions";
import {
  calculateQuestionScore,
  DEFAULT_MARKS_PER_QUESTION,
  NEGATIVE_PENALTY_RATIO,
} from "./lib/scoring";

// Canonical RPSC Exam Standard: 2 marks per question, 1/3 negative marking per incorrect answer.
export const MARKS_PER_QUESTION = DEFAULT_MARKS_PER_QUESTION;
export const DEFAULT_NEGATIVE_MARK_VALUE = MARKS_PER_QUESTION * NEGATIVE_PENALTY_RATIO; // 2/3 ≈ 0.6667

export const start = mutation({
  args: {
    testSetId: v.union(v.id("testSets"), v.string()),
    totalQuestions: v.optional(v.number()),
    retake: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    let testSet: Doc<"testSets"> | null = null;
    try {
      testSet = (await ctx.db.get(args.testSetId as any)) as Doc<"testSets"> | null;
    } catch {
      // String testSetId
    }

    let questionsCount = testSet?.questionCount ?? args.totalQuestions ?? 20;

    // Configured duration or default 1 minute per question (minimum 10 minutes)
    const durationMinutes =
      testSet?.durationMinutes ?? Math.max(10, questionsCount);
    const totalDurationSeconds = durationMinutes * 60;

    // If retake is explicitly requested, purge any stale in_progress attempts for this set
    if (args.retake) {
      const existing = await ctx.db
        .query("attempts")
        .withIndex("by_user_test_set_status", (q) =>
          q.eq("userId", user._id).eq("testSetId", args.testSetId as any).eq("status", "in_progress"),
        )
        .collect();
      for (const a of existing) {
        await ctx.db.delete(a._id);
      }
    } else {
      // Resume an in-progress attempt for this test set if one exists and is valid
      const inProgress = await ctx.db
        .query("attempts")
        .withIndex("by_user_test_set_status", (q) =>
          q.eq("userId", user._id).eq("testSetId", args.testSetId as any).eq("status", "in_progress"),
        )
        .unique();

      if (inProgress) {
        const duration = inProgress.totalDurationSeconds || totalDurationSeconds;
        let currentElapsed = inProgress.elapsedSeconds ?? 0;
        if (!inProgress.isPaused && inProgress.lastResumedAt) {
          currentElapsed += Math.max(0, Math.floor((Date.now() - inProgress.lastResumedAt) / 1000));
        }

        // If the attempt expired while the user was away, discard it and start fresh!
        if (currentElapsed >= duration) {
          await ctx.db.delete(inProgress._id);
        } else {
          // Valid attempt: resume with fresh lastResumedAt so elapsed continues from now
          await ctx.db.patch(inProgress._id, {
            totalDurationSeconds: duration,
            elapsedSeconds: Math.min(duration, inProgress.elapsedSeconds ?? 0),
            isPaused: false,
            lastResumedAt: Date.now(),
          });
          return inProgress._id;
        }
      }
    }

    const now = Date.now();
    return await ctx.db.insert("attempts", {
      userId: user._id,
      testSetId: args.testSetId as any,
      startedAt: now,
      answers: [],
      totalQuestions: questionsCount,
      status: "in_progress",
      totalDurationSeconds,
      elapsedSeconds: 0,
      isPaused: false,
      lastResumedAt: now,
    });
  },
});


/** Debounced from the client on every answer selection — see useQuizSession. */
export const saveAnswer = mutation({
  args: {
    attemptId: v.id("attempts"),
    questionId: v.string(),
    selected: v.union(v.string(), v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt || attempt.userId !== user._id) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") throw new Error("Attempt already submitted");

    // No-op check: If this exact answer is already stored, return early without database I/O
    const existing = attempt.answers.find((a) => a.questionId === args.questionId);
    if (existing) {
      const isSame =
        Array.isArray(args.selected) && Array.isArray(existing.selected)
          ? args.selected.length === existing.selected.length &&
            args.selected.every((v, i) => v === (existing.selected as string[])[i])
          : existing.selected === args.selected;
      if (isSame) {
        return;
      }
    }

    const answers = attempt.answers.filter((a) => a.questionId !== args.questionId);
    answers.push({ questionId: args.questionId as any, selected: args.selected });
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
  args: {
    attemptId: v.id("attempts"),
    evaluations: v.optional(
      v.array(
        v.object({
          questionId: v.string(),
          isCorrect: v.boolean(),
          selected: v.optional(v.union(v.string(), v.array(v.string()))),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt || attempt.userId !== user._id) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") throw new Error("Attempt already submitted");

    let testSet: Doc<"testSets"> | null = null;
    try {
      testSet = (await ctx.db.get(attempt.testSetId as any)) as Doc<"testSets"> | null;
    } catch {
      // String testSetId
    }

    let correctCount = 0;
    let wrongCount = 0;
    const scoredAnswers: any[] = [];

    let wrongTopicId: any = undefined;
    let wrongSubjectId: any = undefined;
    if (testSet) {
      wrongTopicId = testSet.topicId;
      try {
        const topic = (await ctx.db.get(testSet.topicId)) as Doc<"topics"> | null;
        if (topic) {
          wrongSubjectId = topic.subjectId;
        }
      } catch {}
    }

    if (args.evaluations && args.evaluations.length > 0) {
      for (const item of args.evaluations) {
        const isAttempted =
          item.selected !== undefined &&
          item.selected !== null &&
          item.selected !== "" &&
          (!Array.isArray(item.selected) || item.selected.length > 0);

        scoredAnswers.push({
          questionId: item.questionId,
          selected: item.selected,
          isCorrect: isAttempted ? item.isCorrect : false,
        });

        if (isAttempted) {
          if (item.isCorrect) {
            correctCount++;
          } else {
            wrongCount++;
            try {
              const existingWrong = await ctx.db
                .query("wrongQuestions")
                .withIndex("by_user_question", (q) =>
                  q.eq("userId", user._id).eq("questionId", item.questionId as any),
                )
                .unique();

              if (existingWrong) {
                await ctx.db.patch(existingWrong._id, {
                  lastMissedAt: Date.now(),
                  missCount: existingWrong.missCount + 1,
                  resolved: false,
                  ...(existingWrong.subjectId ? {} : { subjectId: wrongSubjectId }),
                  ...(existingWrong.topicId ? {} : { topicId: wrongTopicId }),
                });
              } else {
                await ctx.db.insert("wrongQuestions", {
                  userId: user._id,
                  questionId: item.questionId as any,
                  subjectId: wrongSubjectId,
                  topicId: wrongTopicId,
                  lastMissedAt: Date.now(),
                  missCount: 1,
                  resolved: false,
                });
              }
            } catch {}
          }
        }
      }
    } else {
      // Fallback: copy existing answers
      for (const ans of attempt.answers) {
        scoredAnswers.push(ans);
        if (ans.isCorrect) correctCount++;
        else if (ans.selected) wrongCount++;
      }
    }

    const totalQuestionsCount =
      attempt.totalQuestions || scoredAnswers.length || 20;

    // Authoritative Canonical Scoring calculation (1/3 negative penalty):
    const scoring = calculateQuestionScore({
      correctCount,
      wrongCount,
      totalQuestions: totalQuestionsCount,
      marksPerQuestion: MARKS_PER_QUESTION,
      negativeMarkingEnabled: testSet?.negativeMarking !== false,
    });

    const now = Date.now();
    let finalElapsed = attempt.elapsedSeconds ?? 0;
    if (!attempt.isPaused) {
      finalElapsed += Math.max(0, Math.floor((now - (attempt.lastResumedAt ?? attempt.startedAt)) / 1000));
    }
    if (attempt.totalDurationSeconds) {
      finalElapsed = Math.min(attempt.totalDurationSeconds, finalElapsed);
    }

    await ctx.db.patch(args.attemptId, {
      answers: scoredAnswers,
      score: scoring.score,
      submittedAt: now,
      completedAt: now,
      status: "submitted",
      isPaused: false,
      elapsedSeconds: finalElapsed,
    });

    return {
      score: scoring.score,
      rawScore: scoring.rawScore,
      correctCount,
      wrongCount,
      total: totalQuestionsCount,
      penaltyMarks: scoring.penaltyMarks,
      penaltyPerWrong: scoring.penaltyPerWrong,
    };
  },
});

export const pause = mutation({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt || attempt.userId !== user._id) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") return { success: false, message: "Attempt already submitted" };
    if (attempt.isPaused) return { success: true, isPaused: true, elapsedSeconds: attempt.elapsedSeconds ?? 0 };

    const now = Date.now();
    const activeSegment = Math.max(0, Math.floor((now - (attempt.lastResumedAt ?? attempt.startedAt)) / 1000));
    const totalElapsed = (attempt.elapsedSeconds ?? 0) + activeSegment;
    const totalDuration = attempt.totalDurationSeconds ?? 900;
    const clampedElapsed = Math.min(totalDuration, totalElapsed);

    await ctx.db.patch(args.attemptId, {
      isPaused: true,
      pausedAt: now,
      elapsedSeconds: clampedElapsed,
    });

    return { success: true, isPaused: true, elapsedSeconds: clampedElapsed };
  },
});

export const resume = mutation({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt || attempt.userId !== user._id) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") return { success: false, message: "Attempt already submitted" };
    if (!attempt.isPaused) return { success: true, isPaused: false };

    const now = Date.now();
    await ctx.db.patch(args.attemptId, {
      isPaused: false,
      lastResumedAt: now,
    });

    return { success: true, isPaused: false };
  },
});

/**
 * Remove 0-score attempts (especially auto-submitted or abandoned attempts)
 * to prevent them from depressing analytics and cluttering test history.
 */
export const removeZeroScoreAttempts = mutation({
  args: {
    attemptId: v.optional(v.id("attempts")),
    testSetId: v.optional(v.union(v.id("testSets"), v.string())),
    deleteAllZero: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // If specific attemptId is passed, delete it
    if (args.attemptId) {
      const attempt = await ctx.db.get(args.attemptId);
      if (!attempt || attempt.userId !== user._id) {
        return { deletedCount: 0, message: "Attempt not found" };
      }
      await ctx.db.delete(args.attemptId);
      return { deletedCount: 1, message: "Attempt deleted successfully" };
    }

    // Query all submitted attempts for this user
    const submittedAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "submitted")
      )
      .collect();

    let deletedCount = 0;
    for (const a of submittedAttempts) {
      if (args.testSetId && String(a.testSetId) !== String(args.testSetId)) {
        continue;
      }

      const score = a.score ?? 0;
      const isZeroOrNegative = score <= 0;

      const answeredCount = a.answers
        ? a.answers.filter(
            (ans: any) =>
              ans.selected !== undefined &&
              ans.selected !== null &&
              ans.selected !== "" &&
              (!Array.isArray(ans.selected) || ans.selected.length > 0)
          ).length
        : 0;

      // When deleteAllZero is true, remove any attempt with score <= 0.
      // Otherwise, remove attempts with score <= 0 where 0 questions were answered.
      const shouldDelete =
        args.deleteAllZero ?? true ? isZeroOrNegative : isZeroOrNegative && answeredCount === 0;

      if (shouldDelete) {
        await ctx.db.delete(a._id);
        deletedCount++;
      }
    }

    // Also purge abandoned in-progress attempts for this user (where answers is empty)
    const inProgressAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "in_progress")
      )
      .collect();

    for (const a of inProgressAttempts) {
      if (args.testSetId && String(a.testSetId) !== String(args.testSetId)) {
        continue;
      }
      const answeredCount = a.answers
        ? a.answers.filter(
            (ans: any) =>
              ans.selected !== undefined &&
              ans.selected !== null &&
              ans.selected !== "" &&
              (!Array.isArray(ans.selected) || ans.selected.length > 0)
          ).length
        : 0;
      if (answeredCount === 0) {
        await ctx.db.delete(a._id);
        deletedCount++;
      }
    }

    return {
      deletedCount,
      message: `Cleaned ${deletedCount} zero-score / abandoned attempt(s)`,
    };
  },
});

/**
 * Admin / batch cleaner to purge zero-score attempts across all users without session guards.
 */
export const purgeZeroScoreAttemptsAdmin = mutation({
  args: {
    deleteAllZero: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const allAttempts = await ctx.db.query("attempts").collect();
    let deletedCount = 0;

    for (const a of allAttempts) {
      const score = a.score ?? 0;
      const answeredCount = a.answers
        ? a.answers.filter(
            (ans: any) =>
              ans.selected !== undefined &&
              ans.selected !== null &&
              ans.selected !== "" &&
              (!Array.isArray(ans.selected) || ans.selected.length > 0)
          ).length
        : 0;

      let shouldDelete = false;
      if (a.status === "submitted") {
        if (args.deleteAllZero ?? true) {
          shouldDelete = score <= 0;
        } else {
          shouldDelete = score <= 0 && answeredCount === 0;
        }
      } else if (a.status === "in_progress") {
        shouldDelete = answeredCount === 0;
      }

      if (shouldDelete) {
        await ctx.db.delete(a._id);
        deletedCount++;
      }
    }

    return { deletedCount };
  },
});



export const getWithQuestions = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt || attempt.userId !== user._id) return null;

    return {
      attempt,
      questions: [],
    };
  },
});

export const latestSubmittedForTestSet = query({
  args: { testSetId: v.union(v.id("testSets"), v.string()) },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return null;
    }

    try {
      let latest: any = null;
      try {
        const attemptsForSet = await ctx.db
          .query("attempts")
          .withIndex("by_user_test_set_status", (q) =>
            q.eq("userId", user._id).eq("testSetId", args.testSetId as Id<"testSets">).eq("status", "submitted"),
          )
          .collect();

        if (attemptsForSet.length > 0) {
          attemptsForSet.sort((a, b) => {
            const timeA = a.submittedAt ?? a.completedAt ?? a._creationTime ?? 0;
            const timeB = b.submittedAt ?? b.completedAt ?? b._creationTime ?? 0;
            return timeB - timeA;
          });
          latest = attemptsForSet[0];
        }
      } catch {
        // withIndex may throw if args.testSetId is not a Convex Id<"testSets">
      }

      if (!latest) {
        const recentSubmitted = await ctx.db
          .query("attempts")
          .withIndex("by_user_status", (q) =>
            q.eq("userId", user._id).eq("status", "submitted"),
          )
          .order("desc")
          .take(100);

        const matching = recentSubmitted.filter(
          (a) => String(a.testSetId) === String(args.testSetId)
        );
        if (matching.length > 0) {
          matching.sort((a, b) => {
            const timeA = a.submittedAt ?? a.completedAt ?? a._creationTime ?? 0;
            const timeB = b.submittedAt ?? b.completedAt ?? b._creationTime ?? 0;
            return timeB - timeA;
          });
          latest = matching[0];
        }
      }

      if (!latest) return null;

      return {
        attempt: latest,
        questions: [],
      };
    } catch {
      return null;
    }
  },
});

export const recentByUser = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return [];
    }
    const limit = args.limit ?? 5;
    // Query submitted attempts.
    // Note: by_user_status orders by _creationTime desc, but a resumed attempt may have an older
    // _creationTime despite being submitted recently. We fetch submitted attempts, sort strictly by
    // submittedAt/completedAt desc, and take limit.
    const allSubmitted = await ctx.db
      .query("attempts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "submitted"),
      )
      .order("desc")
      .take(100);

    allSubmitted.sort((a, b) => {
      const timeA = a.submittedAt ?? a.completedAt ?? a._creationTime ?? 0;
      const timeB = b.submittedAt ?? b.completedAt ?? b._creationTime ?? 0;
      return timeB - timeA;
    });

    const sorted = allSubmitted.slice(0, limit);

    const withSetNames = await Promise.all(
      sorted.map(async (a) => {
        const testSet = await ctx.db.get(a.testSetId);
        return { ...a, testSetName: testSet?.name ?? "अभ्यास सेट" };
      }),
    );

    return withSetNames;
  },
});

/** @deprecated Use historyByUser for paginated history. Kept for admin tooling. */
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "submitted"),
      )
      .order("desc")
      .collect();

    attempts.sort((a, b) => {
      const timeA = a.submittedAt ?? a.completedAt ?? a._creationTime ?? 0;
      const timeB = b.submittedAt ?? b.completedAt ?? b._creationTime ?? 0;
      return timeB - timeA;
    });

    const withSetNames = await Promise.all(
      attempts.map(async (a) => {
        const testSet = await ctx.db.get(a.testSetId);
        return { ...a, testSetName: testSet?.name ?? "अभ्यास सेट" };
      }),
    );

    return withSetNames;
  },
});

/**
 * Paginated result history — newest first.
 * Resolves testSet name + subjectId + topicId per page for client-side filtering.
 */
export const historyByUser = query({
  args: { paginationOpts: v.object({ numItems: v.number(), cursor: v.union(v.string(), v.null()) }) },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await requireUser(ctx);
    } catch {
      return { page: [], isDone: true, continueCursor: "" };
    }
    const { numItems, cursor } = args.paginationOpts;

    // Use by_user_status index, then sort strictly by submittedAt desc
    // so any newly submitted test (even if resumed from an older in-progress attempt) appears immediately at the top!
    const allSubmitted = await ctx.db
      .query("attempts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "submitted"),
      )
      .order("desc")
      .collect();

    allSubmitted.sort((a, b) => {
      const timeA = a.submittedAt ?? a.completedAt ?? a._creationTime ?? 0;
      const timeB = b.submittedAt ?? b.completedAt ?? b._creationTime ?? 0;
      return timeB - timeA;
    });

    // Manual cursor pagination
    const startIdx = cursor ? parseInt(cursor, 10) : 0;
    const pageSlice = allSubmitted.slice(startIdx, startIdx + numItems);
    const isDone = startIdx + numItems >= allSubmitted.length;

    // Caches to resolve testSet→topic→subject without N+1
    const testSetCache = new Map<string, { name: string; topicId: string } | null>();
    const topicCache = new Map<string, { subjectId: string } | null>();

    const withMeta = await Promise.all(
      pageSlice.map(async (a) => {
        const tsId = a.testSetId as string;
        if (!testSetCache.has(tsId)) {
          const ts = await ctx.db.get(a.testSetId);
          testSetCache.set(tsId, ts ? { name: ts.name, topicId: ts.topicId as string } : null);
        }
        const testSet = testSetCache.get(tsId);

        let topicId: string | null = null;
        let subjectId: string | null = null;

        if (testSet) {
          const tId = testSet.topicId;
          if (!topicCache.has(tId)) {
            const t = await ctx.db.get(tId as any);
            const tTyped = t as { subjectId: string } | null;
            topicCache.set(tId, tTyped ? { subjectId: tTyped.subjectId } : null);
          }
          const topic = topicCache.get(tId);
          if (topic) {
            topicId = tId;
            subjectId = topic.subjectId;
          }
        }

        return {
          ...a,
          testSetName: testSet?.name ?? "अभ्यास सेट",
          topicId,
          subjectId,
        };
      }),
    );

    return {
      page: withMeta,
      isDone,
      continueCursor: isDone ? null : String(startIdx + numItems),
    };
  },
});

export const getInProgress = query({
  args: { testSetId: v.id("testSets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("attempts")
      .withIndex("by_user_test_set_status", (q) =>
        q.eq("userId", user._id).eq("testSetId", args.testSetId).eq("status", "in_progress"),
      )
      .unique();
  },
});
