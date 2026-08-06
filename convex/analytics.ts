import { query } from "./_generated/server";
import { requireUser } from "./lib/permissions";

/**
 * All analytics are computed at read-time rather than pre-aggregated —
 * appropriate for the expected Phase 1 volume (5-10 users). See SRD
 * Section 12 / 20 for when to revisit this.
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

    // Daily progress: questions answered per day, last 14 days.
    const dailyMap = new Map<string, number>();
    for (const attempt of attempts) {
      if (!attempt.submittedAt) continue;
      const day = new Date(attempt.submittedAt).toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + attempt.answers.length);
    }

    // Weak subjects: accuracy per subject, computed via testSet -> topic -> subject chain.
    const subjectStats = new Map<string, { correct: number; total: number; name: string }>();
    for (const attempt of attempts) {
      const testSet = await ctx.db.get(attempt.testSetId);
      if (!testSet) continue;
      const topic = await ctx.db.get(testSet.topicId);
      if (!topic) continue;
      const subject = await ctx.db.get(topic.subjectId);
      if (!subject) continue;

      const stats = subjectStats.get(subject._id) ?? {
        correct: 0,
        total: 0,
        name: subject.name,
      };
      for (const answer of attempt.answers) {
        stats.total += 1;
        if (answer.isCorrect) stats.correct += 1;
      }
      subjectStats.set(subject._id, stats);
    }

    const weakSubjects = Array.from(subjectStats.values())
      .map((s) => ({ name: s.name, accuracy: s.total > 0 ? (s.correct / s.total) * 100 : 0 }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    return {
      testsAttempted,
      questionsSolved: totalAnswered,
      overallAccuracy: Math.round(overallAccuracy * 10) / 10,
      bookmarkCount: bookmarks.length,
      wrongQuestionCount: wrongQuestions.length,
      dailyProgress: Array.from(dailyMap.entries())
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day))
        .slice(-14),
      weakSubjects,
    };
  },
});
