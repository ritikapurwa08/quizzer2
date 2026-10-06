import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Lightweight leaderboard — top 10 scorers per subject.
 *
 * Strategy (free-tier safe):
 * 1. Collect all submitted attempts across all users for the given subject.
 * 2. Aggregate best score per user.
 * 3. Return top 10, joining display name from the users table.
 *
 * This is computed at read-time. For Phase 1 volumes (5-10 users, <500 attempts)
 * this is fast. Re-evaluate if users > 100.
 */
export const topScoresBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    // 1. Resolve all topics for the subject
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();

    if (topics.length === 0) return [];

    // 2. Collect all testSet IDs for those topics
    const testSetIds: string[] = [];
    for (const topic of topics) {
      const sets = await ctx.db
        .query("testSets")
        .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
        .collect();
      for (const s of sets) testSetIds.push(s._id as string);
    }

    if (testSetIds.length === 0) return [];

    // 3. Query submitted attempts only for these testSets using compound index
    const relevantAttempts = (
      await Promise.all(
        testSetIds.map((tsId) =>
          ctx.db
            .query("attempts")
            .withIndex("by_test_set_status", (q) =>
              q.eq("testSetId", tsId as any).eq("status", "submitted"),
            )
            .collect(),
        ),
      )
    ).flat();

    // 4. Best score per user
    const bestByUser = new Map<string, { score: number; count: number }>();
    for (const attempt of relevantAttempts) {
      const userId = attempt.userId as string;
      const score = attempt.score ?? 0;
      const existing = bestByUser.get(userId);
      if (!existing) {
        bestByUser.set(userId, { score, count: 1 });
      } else {
        bestByUser.set(userId, {
          score: Math.max(existing.score, score),
          count: existing.count + 1,
        });
      }
    }

    // 5. Sort and take top 10
    const sorted = Array.from(bestByUser.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 10);

    // 6. Resolve user names
    const entries = await Promise.all(
      sorted.map(async ([userId, { score, count }], rank) => {
        const userDoc = await ctx.db.get(userId as any);
        const user = userDoc as { name?: string; email?: string } | null;
        return {
          rank: rank + 1,
          userId,
          displayName: user?.name || user?.email?.split("@")[0] || "छात्र",
          bestScore: Number(score.toFixed(2)),
          testsAttempted: count,
        };
      }),
    );

    return entries;
  },
});
