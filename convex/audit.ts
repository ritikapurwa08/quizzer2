import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/permissions";

export const auditDuplicates = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return {
      duplicates: [],
      duplicateCount: 0,
      topicsWithDuplicates: 0,
      totalQuestions: 0,
    };
  },
});

export const getLiveInventory = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [allTopics, allSets, allSubjects] = await Promise.all([
      ctx.db.query("topics").collect(),
      ctx.db.query("testSets").collect(),
      ctx.db.query("subjects").collect(),
    ]);

    const subjectMap = new Map(allSubjects.map((s) => [s._id as string, s]));
    const topicMap = new Map(allTopics.map((t) => [t._id as string, t]));

    const setsByTopic = new Map<string, typeof allSets>();
    for (const s of allSets) {
      const tid = s.topicId as string;
      if (!setsByTopic.has(tid)) setsByTopic.set(tid, []);
      setsByTopic.get(tid)!.push(s);
    }

    const inventory = allSubjects.map((subject) => {
      const subTopics = allTopics.filter((t) => (t.subjectId as string) === (subject._id as string));
      const topicDetails = subTopics.map((topic) => {
        const tid = topic._id as string;
        const sets = setsByTopic.get(tid) || [];
        const questionCount = sets.reduce((sum, s) => sum + (s.questionCount ?? 0), 0);
        return {
          topicId: tid,
          topicName: topic.name,
          topicHindi: topic.nameHindi || topic.name,
          setCount: sets.length,
          questionCount,
        };
      });

      return {
        subjectId: subject._id as string,
        subjectName: subject.name,
        subjectHindi: subject.nameHindi || subject.name,
        topics: topicDetails,
        totalSets: topicDetails.reduce((sum, t) => sum + t.setCount, 0),
        totalQuestions: topicDetails.reduce((sum, t) => sum + t.questionCount, 0),
      };
    });

    const totalQuestions = allSets.reduce((sum, s) => sum + (s.questionCount ?? 0), 0);

    return {
      inventory,
      totalSubjects: allSubjects.length,
      totalTopics: allTopics.length,
      totalSets: allSets.length,
      totalQuestions,
    };
  },
});

export const getSetLevelInventory = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [allSets, allTopics, allSubjects] = await Promise.all([
      ctx.db.query("testSets").collect(),
      ctx.db.query("topics").collect(),
      ctx.db.query("subjects").collect(),
    ]);

    const setInventory = allSets.map((set) => ({
      setId: set._id as string,
      setName: set.name,
      questionCount: set.questionCount ?? 0,
      topicId: set.topicId as string,
    }));

    return {
      sets: setInventory,
      totalSets: allSets.length,
      totalQuestions: allSets.reduce((sum, s) => sum + (s.questionCount ?? 0), 0),
    };
  },
});

export const deleteTestSetWithQuestions = mutation({
  args: { setId: v.id("testSets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.setId);
    return {
      success: true,
      deletedQuestionsCount: 0,
    };
  },
});

export const getQuestionsForAudit = query({
  args: { setId: v.id("testSets") },
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return [];
  },
});
