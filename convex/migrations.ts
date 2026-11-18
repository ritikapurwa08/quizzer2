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

      // Questions are managed local-first via data/master-pool
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

export const upsertMaterializedViews = mutation({
  args: {
    dashboardStats: v.optional(
      v.object({
        userId: v.id("users"),
        questionsSolved: v.number(),
        overallAccuracy: v.number(),
        bookmarkCount: v.number(),
        wrongQuestionCount: v.number(),
        currentStreak: v.number(),
        bestStreak: v.number(),
        testsAttempted: v.number(),
        totalScore: v.number(),
        updatedAt: v.number(),
      })
    ),
    globalCatalogSummary: v.optional(
      v.object({
        singletonKey: v.string(),
        totalSets: v.number(),
        totalQuestions: v.number(),
        totalPublishedQuestions: v.number(),
        totalUnusedQuestions: v.number(),
        subjectBreakdown: v.array(
          v.object({
            subjectId: v.optional(v.string()),
            subjectSlug: v.string(),
            subjectName: v.string(),
            totalSets: v.number(),
            totalQuestions: v.number(),
            totalTopics: v.number(),
          })
        ),
        updatedAt: v.number(),
      })
    ),
    userDashboardFeed: v.optional(
      v.object({
        userId: v.id("users"),
        continuePractice: v.array(
          v.object({
            setId: v.string(),
            setName: v.string(),
            topicId: v.string(),
            topicName: v.string(),
            subjectId: v.optional(v.string()),
            subjectName: v.optional(v.string()),
            subTopicId: v.optional(v.string()),
            subTopicName: v.optional(v.string()),
            questionCount: v.number(),
            lastAttemptScore: v.optional(v.number()),
            lastAttemptedAt: v.optional(v.number()),
            status: v.string(),
          })
        ),
        recentAttempts: v.array(
          v.object({
            attemptId: v.string(),
            testSetId: v.string(),
            testSetName: v.string(),
            topicId: v.optional(v.string()),
            topicName: v.optional(v.string()),
            score: v.number(),
            totalQuestions: v.number(),
            correctCount: v.number(),
            accuracy: v.number(),
            submittedAt: v.number(),
          })
        ),
        setOverlapMap: v.optional(v.any()),
        updatedAt: v.number(),
      })
    ),
    userFilterCounts: v.optional(
      v.object({
        userId: v.id("users"),
        savedCount: v.number(),
        incorrectCount: v.number(),
        savedBySubject: v.array(
          v.object({
            subjectId: v.string(),
            subjectName: v.string(),
            count: v.number(),
          })
        ),
        savedByTopic: v.array(
          v.object({
            topicId: v.string(),
            topicName: v.string(),
            subjectId: v.optional(v.string()),
            count: v.number(),
          })
        ),
        incorrectBySubject: v.array(
          v.object({
            subjectId: v.string(),
            subjectName: v.string(),
            count: v.number(),
          })
        ),
        incorrectByTopic: v.array(
          v.object({
            topicId: v.string(),
            topicName: v.string(),
            subjectId: v.optional(v.string()),
            count: v.number(),
          })
        ),
        updatedAt: v.number(),
      })
    ),
    analyticsSnapshots: v.optional(
      v.object({
        userId: v.id("users"),
        overallAccuracy: v.number(),
        questionsSolved: v.number(),
        testsAttempted: v.number(),
        currentStreak: v.number(),
        bestStreak: v.number(),
        subjectMastery: v.array(
          v.object({
            subjectId: v.string(),
            subjectName: v.string(),
            accuracy: v.number(),
            totalAnswered: v.number(),
            correct: v.number(),
            incorrect: v.number(),
          })
        ),
        weakAreas: v.array(
          v.object({
            topicId: v.string(),
            topicName: v.string(),
            subjectName: v.optional(v.string()),
            accuracy: v.number(),
            totalAttempted: v.number(),
            incorrect: v.number(),
          })
        ),
        dailyActivity: v.array(
          v.object({
            date: v.string(),
            testsCount: v.number(),
            questionsCount: v.number(),
            correctCount: v.number(),
            accuracy: v.number(),
          })
        ),
        hourlyActivity: v.array(
          v.object({
            hour: v.number(),
            hourLabel: v.string(),
            tests: v.number(),
            correct: v.number(),
            incorrect: v.number(),
            total: v.number(),
          })
        ),
        updatedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results: Record<string, string> = {};

    // 1. globalCatalogSummary
    if (args.globalCatalogSummary) {
      const existing = await ctx.db
        .query("globalCatalogSummary")
        .withIndex("by_singletonKey", (q) => q.eq("singletonKey", args.globalCatalogSummary!.singletonKey))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, args.globalCatalogSummary);
        results.globalCatalogSummary = "updated";
      } else {
        await ctx.db.insert("globalCatalogSummary", args.globalCatalogSummary);
        results.globalCatalogSummary = "inserted";
      }
    }

    // 2. dashboardStats
    if (args.dashboardStats) {
      const existing = await ctx.db
        .query("dashboardStats")
        .withIndex("by_user", (q) => q.eq("userId", args.dashboardStats!.userId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, args.dashboardStats);
        results.dashboardStats = "updated";
      } else {
        await ctx.db.insert("dashboardStats", args.dashboardStats);
        results.dashboardStats = "inserted";
      }
    }

    // 3. userDashboardFeed
    if (args.userDashboardFeed) {
      const existing = await ctx.db
        .query("userDashboardFeed")
        .withIndex("by_user", (q) => q.eq("userId", args.userDashboardFeed!.userId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, args.userDashboardFeed);
        results.userDashboardFeed = "updated";
      } else {
        await ctx.db.insert("userDashboardFeed", args.userDashboardFeed);
        results.userDashboardFeed = "inserted";
      }
    }

    // 4. userFilterCounts
    if (args.userFilterCounts) {
      const existing = await ctx.db
        .query("userFilterCounts")
        .withIndex("by_user", (q) => q.eq("userId", args.userFilterCounts!.userId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, args.userFilterCounts);
        results.userFilterCounts = "updated";
      } else {
        await ctx.db.insert("userFilterCounts", args.userFilterCounts);
        results.userFilterCounts = "inserted";
      }
    }

    // 5. analyticsSnapshots
    if (args.analyticsSnapshots) {
      const existing = await ctx.db
        .query("analyticsSnapshots")
        .withIndex("by_user", (q) => q.eq("userId", args.analyticsSnapshots!.userId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, args.analyticsSnapshots);
        results.analyticsSnapshots = "updated";
      } else {
        await ctx.db.insert("analyticsSnapshots", args.analyticsSnapshots);
        results.analyticsSnapshots = "inserted";
      }
    }

    return { status: "success", results };
  },
});

export const syncCanonicalTopicsAndSets = mutation({
  args: {
    activeTopics: v.array(
      v.object({
        _id: v.id("topics"),
        subjectId: v.id("subjects"),
        name: v.string(),
        nameHindi: v.optional(v.string()),
        slug: v.string(),
        order: v.number(),
        masterTopicId: v.optional(v.number()),
      })
    ),
    archivedTopicIds: v.array(v.id("topics")),
    sets: v.array(
      v.object({
        id: v.string(),
        topicId: v.id("topics"),
        name: v.string(),
        order: v.number(),
        questionCount: v.number(),
        subTopicId: v.optional(v.string()),
        subTopic: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // 1. Update active topics
    let topicsUpdated = 0;
    for (const t of args.activeTopics) {
      const existing = await ctx.db.get(t._id);
      if (existing) {
        await ctx.db.patch(t._id, {
          name: t.name,
          nameHindi: t.nameHindi,
          slug: t.slug,
          order: t.order,
          masterTopicId: t.masterTopicId,
          isArchived: false,
        });
        topicsUpdated++;
      }
    }

    // 2. Mark obsolete topics as archived
    let topicsArchived = 0;
    for (const tid of args.archivedTopicIds) {
      const existing = await ctx.db.get(tid);
      if (existing) {
        await ctx.db.patch(tid, { isArchived: true });
        topicsArchived++;
      }
    }

    // 3. Sync sets into testSets and quizSets
    let setsSynced = 0;
    let setsArchived = 0;
    const existingTestSets = await ctx.db.query("testSets").collect();
    const testSetMap = new Map(existingTestSets.map((s) => [s._id as string, s]));
    const activeSetIdSet = new Set(args.sets.map((s) => s.id));

    // Archive any sets in Convex that are no longer in the active sets list
    for (const ts of existingTestSets) {
      if (!activeSetIdSet.has(ts._id as string) && !ts.isArchived) {
        await ctx.db.patch(ts._id, { isArchived: true });
        setsArchived++;
      }
    }

    for (const s of args.sets) {
      const existing = testSetMap.get(s.id);
      if (existing) {
        await ctx.db.patch(existing._id, {
          topicId: s.topicId,
          subTopicId: s.subTopicId,
          subTopic: s.subTopic,
          name: s.name,
          order: s.order,
          questionCount: s.questionCount,
          isArchived: false,
        });
      } else {
        // Insert with new record
        await ctx.db.insert("testSets", {
          topicId: s.topicId,
          subTopicId: s.subTopicId,
          subTopic: s.subTopic,
          name: s.name,
          order: s.order,
          questionCount: s.questionCount,
          negativeMarking: true,
          isArchived: false,
        });
      }
      setsSynced++;
    }

    return {
      status: "success",
      topicsUpdated,
      topicsArchived,
      setsSynced,
      setsArchived,
    };
  },
});
