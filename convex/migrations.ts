import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

const TARGET_HINDI_NAMES = {
  rajput: "राजस्थान के प्रमुख राजपूत राजवंश एवं प्रशासनिक व्यवस्था (8वीं से 18वीं सदी)",
  revolt: "राजस्थान में 1857 का विद्रोह एवं ब्रिटिश संधियाँ",
  cmCouncil: "राजस्थान के मुख्यमंत्री एवं मंत्रिपरिषद",
  admin: "राज्य सचिवालय, मुख्य सचिव, संभागीय आयुक्त एवं जिला प्रशासन",
  lokayukta: "राजस्थान लोकायुक्त एवं उप-लोकायुक्त",
  rivers: "राजस्थान का अपवाह तंत्र, नदियाँ एवं झीलें",
  water: "राजस्थान की सिंचाई परियोजनाएँ, बाँध एवं जल प्रबंधन",
};

export const previewOrphanedTestSets = query({
  args: {},
  handler: async (ctx) => {
    const allTopics = await ctx.db.query("topics").collect();
    const topicMap = new Map(allTopics.map((t) => [t._id as string, t]));
    const topicByHindi = new Map(allTopics.map((t) => [t.nameHindi, t]));

    const testSets = await ctx.db.query("testSets").collect();
    const orphaned: Array<{ id: string; name: string; oldTopicId: string; targetGroup: string; targetTopicHindi: string }> = [];

    for (const ts of testSets) {
      if (topicMap.has(ts.topicId as string)) continue;

      const n = ts.name;
      let targetGroup = "unknown";
      let targetHindi = "";

      if (
        n.includes("गुहिल") ||
        n.includes("गुहिलोत") ||
        n.includes("मेवाड़") ||
        n.includes("राठौड़") ||
        n.includes("मारवाड़") ||
        n.includes("चौहान") ||
        n.includes("कछवाहा") ||
        n.includes("आमेर") ||
        n.includes("जयपुर") ||
        n.includes("गुर्जर-प्रतिहार") ||
        n.includes("राजपूत काल")
      ) {
        targetGroup = "rajput";
        targetHindi = TARGET_HINDI_NAMES.rajput;
      } else if (n.includes("1857")) {
        targetGroup = "revolt";
        targetHindi = TARGET_HINDI_NAMES.revolt;
      } else if (n.includes("मुख्यमंत्री") || n.includes("मंत्रिपरिषद") || n.includes("मंत्रिमंडल")) {
        targetGroup = "cmCouncil";
        targetHindi = TARGET_HINDI_NAMES.cmCouncil;
      } else if (n.includes("राज्य प्रशासन")) {
        targetGroup = "admin";
        targetHindi = TARGET_HINDI_NAMES.admin;
      } else if (n.includes("लोकायुक्त")) {
        targetGroup = "lokayukta";
        targetHindi = TARGET_HINDI_NAMES.lokayukta;
      } else if (n.includes("नदियाँ एवं जल संसाधन")) {
        targetGroup = "rivers";
        targetHindi = TARGET_HINDI_NAMES.rivers;
      } else if (n.includes("पारंपरिक जल स्रोत एवं जल प्रबंधन")) {
        targetGroup = "water";
        targetHindi = TARGET_HINDI_NAMES.water;
      }

      orphaned.push({
        id: ts._id,
        name: ts.name,
        oldTopicId: ts.topicId as string,
        targetGroup,
        targetTopicHindi: targetHindi,
      });
    }

    const grouped: Record<string, number> = {};
    for (const o of orphaned) {
      grouped[o.targetGroup] = (grouped[o.targetGroup] || 0) + 1;
    }

    return {
      totalTestSets: testSets.length,
      orphanedCount: orphaned.length,
      grouped,
      sample: orphaned.slice(0, 10),
    };
  },
});

export const remapOrphanedTestSets = mutation({
  args: {
    group: v.optional(v.string()), // "rajput" | "revolt" | "cmCouncil" | "admin" | "lokayukta" | "rivers" | "water" | "all"
  },
  handler: async (ctx, args) => {
    const targetGroupFilter = args.group ?? "all";

    const allTopics = await ctx.db.query("topics").collect();
    const topicMap = new Map(allTopics.map((t) => [t._id as string, t]));
    const topicByHindi = new Map(allTopics.map((t) => [t.nameHindi, t]));

    const targetTopics: Record<string, Doc<"topics"> | undefined> = {
      rajput: topicByHindi.get(TARGET_HINDI_NAMES.rajput),
      revolt: topicByHindi.get(TARGET_HINDI_NAMES.revolt),
      cmCouncil: topicByHindi.get(TARGET_HINDI_NAMES.cmCouncil),
      admin: topicByHindi.get(TARGET_HINDI_NAMES.admin),
      lokayukta: topicByHindi.get(TARGET_HINDI_NAMES.lokayukta),
      rivers: topicByHindi.get(TARGET_HINDI_NAMES.rivers),
      water: topicByHindi.get(TARGET_HINDI_NAMES.water),
    };

    // Verify all targets exist
    for (const [key, val] of Object.entries(targetTopics)) {
      if (!val) {
        throw new Error(`Target topic for "${key}" not found: ${TARGET_HINDI_NAMES[key as keyof typeof TARGET_HINDI_NAMES]}`);
      }
    }

    const testSets = await ctx.db.query("testSets").collect();

    // Group orphaned sets by target
    const setsToProcess: Array<{
      set: Doc<"testSets">;
      group: string;
      targetTopic: Doc<"topics">;
    }> = [];

    for (const ts of testSets) {
      if (topicMap.has(ts.topicId as string)) continue;

      const n = ts.name;
      let group = "";
      if (
        n.includes("गुहिल") ||
        n.includes("गुहिलोत") ||
        n.includes("मेवाड़") ||
        n.includes("राठौड़") ||
        n.includes("मारवाड़") ||
        n.includes("चौहान") ||
        n.includes("कछवाहा") ||
        n.includes("आमेर") ||
        n.includes("जयपुर") ||
        n.includes("गुर्जर-प्रतिहार") ||
        n.includes("राजपूत काल")
      ) {
        group = "rajput";
      } else if (n.includes("1857")) {
        group = "revolt";
      } else if (n.includes("मुख्यमंत्री") || n.includes("मंत्रिपरिषद") || n.includes("मंत्रिमंडल")) {
        group = "cmCouncil";
      } else if (n.includes("राज्य प्रशासन")) {
        group = "admin";
      } else if (n.includes("लोकायुक्त")) {
        group = "lokayukta";
      } else if (n.includes("नदियाँ एवं जल संसाधन")) {
        group = "rivers";
      } else if (n.includes("पारंपरिक जल स्रोत एवं जल प्रबंधन")) {
        group = "water";
      }

      if (!group) {
        console.warn(`Unrecognized orphaned test set: ${ts.name} (id: ${ts._id})`);
        continue;
      }

      if (targetGroupFilter !== "all" && targetGroupFilter !== group) {
        continue;
      }

      setsToProcess.push({
        set: ts,
        group,
        targetTopic: targetTopics[group]!,
      });
    }

    // Sort sets in logical sequence before assigning orders:
    // e.g. for rajput: Rajput Kaal -> Gurjar-Pratihar -> Chauhan -> Mewar -> Rathore -> Amer
    const dynastyWeight = (name: string): number => {
      if (name.includes("राजपूत काल")) return 1;
      if (name.includes("गुर्जर-प्रतिहार")) return 2;
      if (name.includes("चौहान")) return 3;
      if (name.includes("मेवाड़") || name.includes("गुहिल")) return 4;
      if (name.includes("राठौड़") || name.includes("मारवाड़")) return 5;
      if (name.includes("कछवाहा") || name.includes("आमेर") || name.includes("जयपुर")) return 6;
      return 10;
    };

    const extractPartNumber = (name: string): number => {
      const match = name.match(/(?:Part|भाग)\s*(\d+)/i);
      return match && match[1] ? parseInt(match[1], 10) : 0;
    };

    setsToProcess.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      if (a.group === "rajput") {
        const wA = dynastyWeight(a.set.name);
        const wB = dynastyWeight(b.set.name);
        if (wA !== wB) return wA - wB;
      }
      const partA = extractPartNumber(a.set.name);
      const partB = extractPartNumber(b.set.name);
      return partA - partB;
    });

    // Check existing testSets count in target topics to offset order
    const existingCountByTopic = new Map<string, number>();
    for (const ts of testSets) {
      if (topicMap.has(ts.topicId as string)) {
        const tid = ts.topicId as string;
        existingCountByTopic.set(tid, (existingCountByTopic.get(tid) || 0) + 1);
      }
    }

    let updatedSetsCount = 0;
    let updatedQuestionsCount = 0;
    let updatedBookmarksCount = 0;
    let updatedWrongCount = 0;

    const currentOrderOffset = new Map<string, number>();

    // Preload bookmarks and wrongQuestions to avoid repeated table scans
    const allBookmarks = await ctx.db.query("bookmarks").collect();
    const bookmarksByQuestion = new Map<string, typeof allBookmarks>();
    for (const b of allBookmarks) {
      const qid = b.questionId as string;
      const list = bookmarksByQuestion.get(qid);
      if (!list) bookmarksByQuestion.set(qid, [b]);
      else list.push(b);
    }

    const allWrong = await ctx.db.query("wrongQuestions").collect();
    const wrongByQuestion = new Map<string, typeof allWrong>();
    for (const w of allWrong) {
      const qid = w.questionId as string;
      const list = wrongByQuestion.get(qid);
      if (!list) wrongByQuestion.set(qid, [w]);
      else list.push(w);
    }

    for (const item of setsToProcess) {
      const targetTopicId = item.targetTopic._id;
      const targetSubjectId = item.targetTopic.subjectId;

      const baseOffset = existingCountByTopic.get(targetTopicId as string) || 0;
      const currentOffset = currentOrderOffset.get(targetTopicId as string) || 0;
      const newOrder = baseOffset + currentOffset;
      currentOrderOffset.set(targetTopicId as string, currentOffset + 1);

      // 1. Update testSet
      await ctx.db.patch(item.set._id, {
        topicId: targetTopicId,
        order: newOrder,
      });
      updatedSetsCount++;

      // 2. Update all questions belonging to this testSet
      const questions = await ctx.db
        .query("questions")
        .withIndex("by_test_set", (q) => q.eq("testSetId", item.set._id))
        .collect();

      for (const q of questions) {
        await ctx.db.patch(q._id, {
          topicId: targetTopicId,
          subjectId: targetSubjectId,
        });
        updatedQuestionsCount++;

        // 3. Update bookmarks pointing to this question
        const bms = bookmarksByQuestion.get(q._id as string) ?? [];
        for (const bm of bms) {
          await ctx.db.patch(bm._id, {
            topicId: targetTopicId,
            subjectId: targetSubjectId,
          });
          updatedBookmarksCount++;
        }

        // 4. Update wrongQuestions pointing to this question
        const wrs = wrongByQuestion.get(q._id as string) ?? [];
        for (const wq of wrs) {
          await ctx.db.patch(wq._id, {
            topicId: targetTopicId,
            subjectId: targetSubjectId,
          });
          updatedWrongCount++;
        }
      }
    }

    return {
      status: "success",
      filterApplied: targetGroupFilter,
      updatedSetsCount,
      updatedQuestionsCount,
      updatedBookmarksCount,
      updatedWrongCount,
    };
  },
});
