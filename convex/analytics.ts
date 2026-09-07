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
export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    const testsAttempted = attempts.length;
    let totalCorrect = 0;
    let totalAnswered = 0;

    for (const attempt of attempts) {
      for (const answer of attempt.answers) {
        totalAnswered += 1;
        if (answer.isCorrect) totalCorrect += 1;
      }
    }

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

    // ── Daily progress (last 30 days) ──────────────────────────────────────
    // Maps: day → { count: total questions answered, tests: test count }
    const dailyMap = new Map<string, { count: number; tests: number }>();
    // Maps: day → subjectId → { count }
    const dailyBySubject = new Map<string, Map<string, number>>();

    // ── Caches to avoid N+1 reads ──────────────────────────────────────────
    const testSetCache = new Map<string, { topicId: string; name: string } | null>();
    const topicCache = new Map<string, { subjectId: string; name: string } | null>();
    const subjectCache = new Map<string, { name: string; nameHindi?: string } | null>();

    // ── Weak subjects ──────────────────────────────────────────────────────
    const subjectStats = new Map<string, { correct: number; total: number; name: string }>();

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

      // Accumulate weak subject stats
      const ss = subjectStats.get(topic.subjectId) ?? { correct: 0, total: 0, name: subject.name };
      for (const answer of attempt.answers) {
        ss.total += 1;
        if (answer.isCorrect) ss.correct += 1;
      }
      subjectStats.set(topic.subjectId, ss);

      // Accumulate daily progress
      if (!attempt.submittedAt) continue;
      const day = new Date(attempt.submittedAt).toISOString().slice(0, 10);
      const existing = dailyMap.get(day) ?? { count: 0, tests: 0 };
      dailyMap.set(day, {
        count: existing.count + attempt.answers.length,
        tests: existing.tests + 1,
      });

      // Per-subject daily breakdown for chart filtering
      if (!dailyBySubject.has(day)) dailyBySubject.set(day, new Map());
      const daySubjectMap = dailyBySubject.get(day)!;
      daySubjectMap.set(topic.subjectId, (daySubjectMap.get(topic.subjectId) ?? 0) + attempt.answers.length);
    }

    const weakSubjects = Array.from(subjectStats.values())
      .map((s) => ({ name: s.name, accuracy: s.total > 0 ? (s.correct / s.total) * 100 : 0 }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // Build dailyProgress array: last 30 days, sorted ascending
    const allDays = Array.from(dailyMap.entries())
      .map(([day, { count, tests }]) => ({
        day,
        count,
        tests,
        bySubject: Object.fromEntries(dailyBySubject.get(day) ?? new Map()),
      }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-30);

    return {
      testsAttempted,
      questionsSolved: totalAnswered,
      overallAccuracy: Math.round(overallAccuracy * 10) / 10,
      bookmarkCount: bookmarks.length,
      wrongQuestionCount: wrongQuestions.length,
      dailyProgress: allDays,
      weakSubjects,
    };
  },
});
