import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./lib/permissions";

/**
 * All analytics are computed at read-time rather than pre-aggregated —
 * appropriate for the expected Phase 1 volume (5-10 users). See SRD
 * Section 12 / 20 for when to revisit this.
 *
 * N+1 fix: testSet/topic/subject lookups are cached in local Maps so each
 * entity is fetched at most once per query invocation.
 */
/**
 * Checks if a stored answer was actually attempted by the user.
 * Quizzer allows submitting tests with unanswered/skipped questions.
 */
function isAnswerAttempted(answer?: { selected?: string | string[] | null } | null): boolean {
  if (!answer) return false;
  const { selected } = answer;
  if (selected === undefined || selected === null || selected === "") return false;
  if (Array.isArray(selected) && selected.length === 0) return false;
  return true;
}

/**
 * Read-time analytics computation with N+1 caching.
 * Audited for accurate answered vs unanswered question semantics and local calendar date alignment.
 */
export const dashboardStats = query({
  args: {
    rangeDays: v.optional(v.number()),
    timezoneOffset: v.optional(v.number()), // Client offset in minutes (default -330 for IST)
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    const testsAttempted = attempts.length;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalAnswered = 0;
    let totalQuestionSlots = 0;

    for (const attempt of attempts) {
      totalQuestionSlots += attempt.totalQuestions;
      for (const answer of attempt.answers) {
        if (isAnswerAttempted(answer)) {
          totalAnswered += 1;
          if (answer.isCorrect) {
            totalCorrect += 1;
          } else {
            totalIncorrect += 1;
          }
        }
      }
    }

    const totalUnanswered = Math.max(0, totalQuestionSlots - totalAnswered);
    const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const wrongQuestions = await ctx.db
      .query("wrongQuestions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("resolved"), false))
      .collect();

    // ── Date range configuration ───────────────────────────────────────────
    const rangeDays = args.rangeDays ?? 30;
    // Default to IST (UTC+5:30 is -330 minutes) if not supplied
    const tzOffsetMinutes = typeof args.timezoneOffset === "number" ? args.timezoneOffset : -330;
    const tzOffsetMs = tzOffsetMinutes * 60 * 1000;

    // Helper: convert UTC epoch ms to local YYYY-MM-DD
    function toLocalDayString(epochMs: number): string {
      const localMs = epochMs - tzOffsetMs;
      return new Date(localMs).toISOString().slice(0, 10);
    }

    // Maps: day → { count: total questions answered, tests: test count }
    const dailyMap = new Map<string, { count: number; tests: number }>();
    // Maps: day → subjectId → count
    const dailyBySubject = new Map<string, Map<string, number>>();

    // ── Caches to avoid N+1 reads ──────────────────────────────────────────
    const testSetCache = new Map<string, { topicId: string; name: string } | null>();
    const topicCache = new Map<string, { subjectId: string; name: string } | null>();
    const subjectCache = new Map<string, { name: string; nameHindi?: string } | null>();

    // ── Subject stats ──────────────────────────────────────────────────────
    const subjectStats = new Map<
      string,
      { id: string; correct: number; total: number; name: string; nameHindi?: string }
    >();

    for (const attempt of attempts) {
      // Resolve subject via cached chain
      const testSetId = attempt.testSetId as string;
      if (!testSetCache.has(testSetId)) {
        const ts = await ctx.db.get(attempt.testSetId);
        testSetCache.set(testSetId, ts ? { topicId: ts.topicId as string, name: ts.name } : null);
      }
      const testSet = testSetCache.get(testSetId);
      if (!testSet) continue;

      if (!topicCache.has(testSet.topicId)) {
        const t = await ctx.db.get(testSet.topicId as any);
        const tTyped = t as { subjectId: string; name: string } | null;
        topicCache.set(testSet.topicId, tTyped ? { subjectId: tTyped.subjectId as string, name: tTyped.name } : null);
      }
      const topic = topicCache.get(testSet.topicId);
      if (!topic) continue;

      if (!subjectCache.has(topic.subjectId)) {
        const s = await ctx.db.get(topic.subjectId as any);
        const sTyped = s as { name: string; nameHindi?: string } | null;
        subjectCache.set(topic.subjectId, sTyped ? { name: sTyped.name, nameHindi: sTyped.nameHindi } : null);
      }
      const subject = subjectCache.get(topic.subjectId);
      if (!subject) continue;

      // Accumulate subject stats — only counting genuinely attempted questions
      const ss = subjectStats.get(topic.subjectId) ?? {
        id: topic.subjectId,
        correct: 0,
        total: 0,
        name: subject.name,
        nameHindi: subject.nameHindi,
      };

      let attemptAnsweredCount = 0;
      for (const answer of attempt.answers) {
        if (isAnswerAttempted(answer)) {
          attemptAnsweredCount += 1;
          ss.total += 1;
          if (answer.isCorrect) ss.correct += 1;
        }
      }
      subjectStats.set(topic.subjectId, ss);

      // Accumulate daily progress
      if (!attempt.submittedAt) continue;
      const day = toLocalDayString(attempt.submittedAt);
      const existing = dailyMap.get(day) ?? { count: 0, tests: 0 };
      dailyMap.set(day, {
        count: existing.count + attemptAnsweredCount,
        tests: existing.tests + 1,
      });

      // Per-subject daily breakdown for chart filtering
      if (!dailyBySubject.has(day)) dailyBySubject.set(day, new Map());
      const daySubjectMap = dailyBySubject.get(day)!;
      daySubjectMap.set(topic.subjectId, (daySubjectMap.get(topic.subjectId) ?? 0) + attemptAnsweredCount);
    }

    // ── Build dailyProgress array for the requested range ───────────────────
    const nowLocalMs = Date.now() - tzOffsetMs;
    const today = new Date(nowLocalMs);
    const allDays: {
      day: string;
      count: number;
      tests: number;
      bySubject: Record<string, number>;
    }[] = [];

    let totalPeriodQuestions = 0;
    let totalPeriodTests = 0;
    let activeDays = 0;

    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const day = d.toISOString().slice(0, 10);
      const entry = dailyMap.get(day) ?? { count: 0, tests: 0 };
      const bySubjectRaw = dailyBySubject.get(day) ?? new Map<string, number>();

      if (entry.count > 0 || entry.tests > 0) {
        activeDays += 1;
      }
      totalPeriodQuestions += entry.count;
      totalPeriodTests += entry.tests;

      allDays.push({
        day,
        count: entry.count,
        tests: entry.tests,
        bySubject: Object.fromEntries(bySubjectRaw),
      });
    }

    // ── All Subjects & Pool counts ─────────────────────────────────────────
    const allSubjects = await ctx.db.query("subjects").collect();
    allSubjects.sort((a, b) => a.order - b.order);

    const allTopics = await ctx.db.query("topics").collect();
    const topicToSubject = new Map<string, string>();
    for (const t of allTopics) {
      topicToSubject.set(t._id as string, t.subjectId as string);
    }

    const allTestSets = await ctx.db.query("testSets").collect();
    const subjectAvailableQuestions = new Map<string, number>();
    for (const ts of allTestSets) {
      const subId = topicToSubject.get(ts.topicId as string);
      if (subId) {
        subjectAvailableQuestions.set(
          subId,
          (subjectAvailableQuestions.get(subId) ?? 0) + (ts.questionCount ?? 0)
        );
      }
    }

    // ── Ranked Subject Accuracy list with Attempted & Remaining counts ─────
    const subjectAccuracy = allSubjects
      .map((s) => {
        const ss = subjectStats.get(s._id);
        const attempted = ss?.total ?? 0;
        const correct = ss?.correct ?? 0;
        const available = subjectAvailableQuestions.get(s._id) ?? 0;
        const remaining = Math.max(0, available - attempted);
        const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

        return {
          id: s._id,
          name: s.name,
          nameHindi: s.nameHindi || s.name,
          accuracy,
          correct,
          attempted,
          total: attempted,
          totalAvailable: available,
          remaining,
        };
      })
      .sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        if (b.attempted !== a.attempted) return b.attempted - a.attempted;
        return a.name.localeCompare(b.name);
      });

    // Weakest subjects (lowest accuracy first)
    const weakSubjects = [...subjectAccuracy]
      .filter((s) => s.attempted > 0)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // Strongest subject (highest accuracy)
    const strongestSubject =
      subjectAccuracy.filter((s) => s.attempted > 0).sort((a, b) => b.accuracy - a.accuracy)[0] ?? null;

    // Weakest subject
    const weakestSubject =
      subjectAccuracy.filter((s) => s.attempted > 0).sort((a, b) => a.accuracy - b.accuracy)[0] ?? null;

    // ── Hourly Activity breakdown for the selected range (0 to 23 hours) ──
    const hourlyMap = Array.from({ length: 24 }, (_, h) => {
      let label = "12 AM";
      if (h === 0) label = "12 AM";
      else if (h < 12) label = `${h} AM`;
      else if (h === 12) label = "12 PM";
      else label = `${h - 12} PM`;
      return {
        hour: h,
        hourLabel: label,
        correct: 0,
        incorrect: 0,
        total: 0,
        tests: 0,
      };
    });

    for (const attempt of attempts) {
      if (!attempt.submittedAt) continue;
      const attemptLocalMs = attempt.submittedAt - tzOffsetMs;
      const daysDiff = (nowLocalMs - attemptLocalMs) / (1000 * 60 * 60 * 24);
      if (daysDiff > rangeDays || daysDiff < -0.1) continue;

      const localDate = new Date(attemptLocalMs);
      const hour = localDate.getUTCHours();
      if (hour >= 0 && hour < 24) {
        hourlyMap[hour].tests += 1;
        for (const answer of attempt.answers) {
          if (isAnswerAttempted(answer)) {
            hourlyMap[hour].total += 1;
            if (answer.isCorrect) {
              hourlyMap[hour].correct += 1;
            } else {
              hourlyMap[hour].incorrect += 1;
            }
          }
        }
      }
    }

    // ── All Subjects Diagnostic Breakdown ──────────────────────────────────
    const subjectBreakdown = allSubjects.map((s) => {
      const ss = subjectStats.get(s._id);
      const total = ss?.total ?? 0;
      const correct = ss?.correct ?? 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      let status: "unattempted" | "weak" | "moderate" | "strong" = "unattempted";
      if (total > 0) {
        if (accuracy < 60) status = "weak";
        else if (accuracy < 80) status = "moderate";
        else status = "strong";
      }
      return {
        subjectId: s._id,
        name: s.name,
        nameHindi: s.nameHindi,
        order: s.order,
        totalQuestionsAttempted: total,
        correctQuestions: correct,
        accuracy,
        isAttempted: total > 0,
        status,
      };
    });

    // ── Recent Test Attempts (Latest 10) ───────────────────────────────────
    // Sort submitted attempts descending by submittedAt, take 10, then sort ascending
    // so chronological flow displays older -> newest from left to right on the bar chart.
    const sortedSubmitted = [...attempts]
      .filter((a) => typeof a.submittedAt === "number")
      .sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0))
      .slice(0, 10);

    const recentAttempts = await Promise.all(
      sortedSubmitted.reverse().map(async (a) => {
        const ts = testSetCache.get(a.testSetId as string) ?? (await ctx.db.get(a.testSetId));
        const testSetName = ts?.name ?? "अभ्यास सेट";
        const maxScore = a.totalQuestions * 2;
        const rawScore = a.score ?? 0;
        const scorePercent = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;

        let correct = 0;
        let incorrect = 0;
        for (const ans of a.answers) {
          if (isAnswerAttempted(ans)) {
            if (ans.isCorrect) correct += 1;
            else incorrect += 1;
          }
        }
        const unanswered = Math.max(0, a.totalQuestions - (correct + incorrect));

        return {
          attemptId: a._id,
          testSetId: a.testSetId,
          testSetName,
          score: rawScore,
          maxScore,
          scorePercent: Math.max(0, Math.min(100, scorePercent)),
          totalQuestions: a.totalQuestions,
          correctCount: correct,
          incorrectCount: incorrect,
          unansweredCount: unanswered,
          submittedAt: a.submittedAt ?? 0,
        };
      })
    );

    return {
      testsAttempted,
      questionsSolved: totalAnswered,
      overallAccuracy: Math.round(overallAccuracy * 10) / 10,
      bookmarkCount: bookmarks.length,
      wrongQuestionCount: wrongQuestions.length,
      dailyProgress: allDays,
      hourlyActivity: hourlyMap,
      subjectBreakdown,
      weakSubjects,
      subjectAccuracy,
      answerBreakdown: {
        correct: totalCorrect,
        incorrect: totalIncorrect,
        unanswered: totalUnanswered,
        totalQuestions: totalQuestionSlots,
        answeredCount: totalAnswered,
        accuracy: Math.round(overallAccuracy * 10) / 10,
      },
      recentAttempts,
      insights: {
        strongestSubject: strongestSubject
          ? {
              name: strongestSubject.name,
              nameHindi: strongestSubject.nameHindi,
              accuracy: strongestSubject.accuracy,
            }
          : null,
        weakestSubject: weakestSubject
          ? {
              name: weakestSubject.name,
              nameHindi: weakestSubject.nameHindi,
              accuracy: weakestSubject.accuracy,
            }
          : null,
        activeDays,
        totalPeriodQuestions,
        totalPeriodTests,
      },
    };
  },
});
