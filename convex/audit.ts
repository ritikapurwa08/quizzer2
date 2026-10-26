import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const auditDuplicates = query({
  args: {},
  handler: async (ctx) => {
    const allTopics = await ctx.db.query("topics").collect();
    const topicMap = new Map(allTopics.map((t) => [t._id as string, t]));

    const allSets = await ctx.db.query("testSets").collect();
    const setMap = new Map(allSets.map((s) => [s._id as string, s]));

    const allQuestions = await ctx.db.query("questions").collect();

    // Map: topicId -> Map<key, { setId, setName, qText }>
    const seenByTopic = new Map<string, Map<string, { setId: string; setName: string; qText: string }>>();
    const duplicatesByTopic: Array<{
      topicId: string;
      topicName: string;
      topicHindi: string;
      firstSetName: string;
      secondSetName: string;
      questionText: string;
      sourceQuestionId?: string;
    }> = [];

    for (const q of allQuestions) {
      const set = setMap.get(q.testSetId as string);
      const topicId = (q.topicId as string) || (set?.topicId as string);
      if (!topicId) continue;

      if (!seenByTopic.has(topicId)) {
        seenByTopic.set(topicId, new Map());
      }
      const topicSeen = seenByTopic.get(topicId)!;

      const normText = (q.questionText || "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

      const sourceId = q.sourceQuestionId || q.meta?.sourceQuestionId;
      const key = sourceId || normText;
      const setName = set?.name || "Unknown Set";

      if (topicSeen.has(key)) {
        const existing = topicSeen.get(key)!;
        const topic = topicMap.get(topicId);
        duplicatesByTopic.push({
          topicId,
          topicName: topic?.name || "Unknown",
          topicHindi: topic?.nameHindi || "Unknown",
          firstSetName: existing.setName,
          secondSetName: setName,
          questionText: q.questionText.substring(0, 80),
          sourceQuestionId: sourceId,
        });
      } else {
        topicSeen.set(key, { setId: q.testSetId as string, setName, qText: q.questionText });
      }
    }

    // Group duplicates by topic
    const summary: Record<string, { topicHindi: string; count: number; setsAffected: Set<string> }> = {};
    for (const d of duplicatesByTopic) {
      if (!summary[d.topicId]) {
        summary[d.topicId] = { topicHindi: d.topicHindi, count: 0, setsAffected: new Set() };
      }
      summary[d.topicId].count++;
      summary[d.topicId].setsAffected.add(d.firstSetName);
      summary[d.topicId].setsAffected.add(d.secondSetName);
    }

    const report = Object.entries(summary).map(([topicId, val]) => ({
      topicId,
      topicHindi: val.topicHindi,
      duplicateCount: val.count,
      setsAffected: Array.from(val.setsAffected),
    }));

    return {
      totalQuestions: allQuestions.length,
      totalDuplicates: duplicatesByTopic.length,
      report,
      samples: duplicatesByTopic.slice(0, 30),
    };
  },
});

export const getLiveInventory = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    subjects.sort((a, b) => a.order - b.order);

    const allTopics = await ctx.db.query("topics").collect();
    allTopics.sort((a, b) => a.order - b.order);

    const allSets = await ctx.db.query("testSets").collect();
    const setMap = new Map(allSets.map((s) => [s._id as string, s]));
    const setsByTopic = new Map<string, typeof allSets>();
    for (const s of allSets) {
      const tid = s.topicId as string;
      const list = setsByTopic.get(tid);
      if (!list) setsByTopic.set(tid, [s]);
      else list.push(s);
    }

    const allQuestions = await ctx.db.query("questions").collect();
    const questionsByTopic = new Map<string, number>();
    const usedSourceIdsByTopic = new Map<string, Set<string>>();

    for (const q of allQuestions) {
      const set = setMap.get(q.testSetId as string);
      const tid = (q.topicId as string) || (set?.topicId as string);
      if (tid) {
        questionsByTopic.set(tid, (questionsByTopic.get(tid) || 0) + 1);
        const sid = q.sourceQuestionId || q.meta?.sourceQuestionId;
        if (sid) {
          let setOfIds = usedSourceIdsByTopic.get(tid);
          if (!setOfIds) {
            setOfIds = new Set();
            usedSourceIdsByTopic.set(tid, setOfIds);
          }
          setOfIds.add(sid);
        }
      }
    }

    const result = subjects.map((sub) => {
      const subTopics = allTopics
        .filter((t) => t.subjectId === sub._id)
        .map((top) => {
          const tid = top._id as string;
          const sets = setsByTopic.get(tid) || [];
          const questionCount = questionsByTopic.get(tid) || 0;
          const uniqueUsedSourceCount = usedSourceIdsByTopic.get(tid)?.size || 0;
          return {
            topicId: top._id,
            name: top.name,
            nameHindi: top.nameHindi,
            slug: top.slug,
            order: top.order,
            setCount: sets.length,
            questionCount,
            uniqueUsedSourceCount,
            sets: sets.map((s) => ({ id: s._id, name: s.name, order: s.order, count: s.questionCount })),
          };
        });

      return {
        subjectId: sub._id,
        name: sub.name,
        nameHindi: sub.nameHindi,
        slug: sub.slug,
        order: sub.order,
        topics: subTopics,
      };
    });

    return {
      totalSubjects: subjects.length,
      totalTopics: allTopics.length,
      totalSets: allSets.length,
      totalQuestions: allQuestions.length,
      subjects: result,
    };
  },
});

export const getAllUsedSourceQuestionIds = query({
  args: {},
  handler: async (ctx) => {
    const allQuestions = await ctx.db.query("questions").collect();
    const allSets = await ctx.db.query("testSets").collect();
    const setMap = new Map(allSets.map((s) => [s._id as string, s]));
    const allTopics = await ctx.db.query("topics").collect();
    const topicMap = new Map(allTopics.map((t) => [t._id as string, t]));

    const usedIdsByTopicId = new Map<string, string[]>();
    const allUsedSourceIds: string[] = [];

    for (const q of allQuestions) {
      const set = setMap.get(q.testSetId as string);
      const tid = (q.topicId as string) || (set?.topicId as string);
      const sid = q.sourceQuestionId || q.meta?.sourceQuestionId;
      if (!sid) continue;

      allUsedSourceIds.push(sid);
      if (tid) {
        let list = usedIdsByTopicId.get(tid);
        if (!list) {
          list = [];
          usedIdsByTopicId.set(tid, list);
        }
        list.push(sid);
      }
    }

    const byTopic = Array.from(usedIdsByTopicId.entries()).map(([tid, sourceIds]) => {
      const topic = topicMap.get(tid);
      return {
        topicId: tid,
        name: topic?.name || "Unknown",
        nameHindi: topic?.nameHindi || "Unknown",
        order: topic?.order || 0,
        sourceIds,
      };
    });

    return {
      totalQuestions: allQuestions.length,
      totalUsedSourceIds: allUsedSourceIds.length,
      byTopic,
    };
  },
});


export const deleteTestSetWithQuestions = mutation({
  args: {
    testSetId: v.id("testSets"),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test_set", (q) => q.eq("testSetId", args.testSetId))
      .collect();

    for (const q of questions) {
      await ctx.db.delete(q._id);
    }

    await ctx.db.delete(args.testSetId);
    return {
      deletedSetId: args.testSetId,
      deletedQuestionsCount: questions.length,
    };
  },
});

export const getLatestAttemptsForInspection = query({
  args: {},
  handler: async (ctx) => {
    const attempts = await ctx.db
      .query("attempts")
      .order("desc")
      .take(10);

    return attempts.map((a) => ({
      _id: a._id,
      userId: a.userId,
      testSetId: a.testSetId,
      status: a.status,
      score: a.score,
      totalQuestions: a.totalQuestions,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
    }));
  },
});

export const getAttemptForAudit = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.attemptId);
  },
});

export const getQuestionsForAudit = query({
  args: { testSetId: v.id("testSets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("questions")
      .withIndex("by_test_set", (q) => q.eq("testSetId", args.testSetId))
      .collect();
  },
});




