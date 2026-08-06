import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Global search across Subject / Topic / Test Set names (SRD Section 11).
 * Appropriate as a simple substring scan given expected Phase 1 volume;
 * revisit with a proper search index if the catalog grows large.
 */
export const global = query({
  args: { term: v.string() },
  handler: async (ctx, args) => {
    const term = args.term.trim().toLowerCase();
    if (term.length === 0) return { subjects: [], topics: [], testSets: [] };

    const [subjects, topics, testSets] = await Promise.all([
      ctx.db.query("subjects").collect(),
      ctx.db.query("topics").collect(),
      ctx.db.query("testSets").collect(),
    ]);

    const matchedSubjects = subjects.filter((s) => s.name.toLowerCase().includes(term));

    const matchedTopics = await Promise.all(
      topics
        .filter((t) => t.name.toLowerCase().includes(term))
        .map(async (t) => ({ topic: t, subject: await ctx.db.get(t.subjectId) })),
    );

    const matchedTestSets = await Promise.all(
      testSets
        .filter((s) => s.name.toLowerCase().includes(term))
        .map(async (s) => {
          const topic = await ctx.db.get(s.topicId);
          const subject = topic ? await ctx.db.get(topic.subjectId) : null;
          return { testSet: s, topic, subject };
        }),
    );

    return { subjects: matchedSubjects, topics: matchedTopics, testSets: matchedTestSets };
  },
});
