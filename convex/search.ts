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

    const subjectMap = new Map<string, (typeof subjects)[0]>();
    for (const s of subjects) subjectMap.set(s._id as string, s);

    const topicMap = new Map<string, (typeof topics)[0]>();
    for (const t of topics) topicMap.set(t._id as string, t);

    const matchedSubjects = subjects.filter((s) => s.name.toLowerCase().includes(term));

    const matchedTopics = topics
      .filter((t) => t.name.toLowerCase().includes(term))
      .map((t) => ({ topic: t, subject: subjectMap.get(t.subjectId as string) ?? null }));

    const matchedTestSets = testSets
      .filter((s) => s.name.toLowerCase().includes(term))
      .map((s) => {
        const topic = topicMap.get(s.topicId as string) ?? null;
        const subject = topic ? (subjectMap.get(topic.subjectId as string) ?? null) : null;
        return { testSet: s, topic, subject };
      });

    return { subjects: matchedSubjects, topics: matchedTopics, testSets: matchedTestSets };
  },
});
