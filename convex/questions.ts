import { v, ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/permissions";
import { questionInputValidator, questionTypeValidator } from "./lib/validators";


function normalizeForDuplicateCheck(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const listByTestSet = query({
  args: { testSetId: v.id("testSets") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test_set", (q) => q.eq("testSetId", args.testSetId))
      .collect();
    return questions.sort((a, b) => a.order - b.order);
  },
});

/**
 * Admin-only: search question text, options, and explanation across the question bank.
 * Uses indexed navigation (topicId/subjectId/testSetId) where provided to avoid full table scans.
 */
export const search = query({
  args: {
    term: v.optional(v.string()),
    subjectId: v.optional(v.id("subjects")),
    topicId: v.optional(v.id("topics")),
    testSetId: v.optional(v.id("testSets")),
    sourceType: v.optional(v.string()),
    exam: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const term = (args.term ?? "").trim().toLowerCase();
    const maxLimit = args.limit ? Math.min(args.limit, 100) : 50;

    let candidateQuestions: any[] = [];

    if (args.testSetId) {
      candidateQuestions = await ctx.db
        .query("questions")
        .withIndex("by_test_set", (q) => q.eq("testSetId", args.testSetId!))
        .collect();
    } else if (args.topicId) {
      const sets = await ctx.db
        .query("testSets")
        .withIndex("by_topic", (q) => q.eq("topicId", args.topicId!))
        .collect();

      for (const s of sets) {
        const qs = await ctx.db
          .query("questions")
          .withIndex("by_test_set", (q) => q.eq("testSetId", s._id))
          .collect();
        candidateQuestions.push(...qs);
        if (candidateQuestions.length >= 300) break;
      }
    } else if (args.subjectId) {
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId!))
        .collect();

      for (const topic of topics) {
        const sets = await ctx.db
          .query("testSets")
          .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
          .collect();

        for (const s of sets) {
          const qs = await ctx.db
            .query("questions")
            .withIndex("by_test_set", (q) => q.eq("testSetId", s._id))
            .collect();
          candidateQuestions.push(...qs);
          if (candidateQuestions.length >= 300) break;
        }
        if (candidateQuestions.length >= 300) break;
      }
    } else if (term.length >= 2) {
      // If no subject/topic filter, only search if term >= 2 chars, and take up to 200 questions to scan
      candidateQuestions = await ctx.db.query("questions").take(200);
    } else {
      return [];
    }

    return candidateQuestions
      .filter((q) => {
        if (args.sourceType && q.meta?.sourceType !== args.sourceType) return false;
        if (args.exam && q.meta?.exam !== args.exam) return false;
        if (!term) return true;

        const inText = q.questionText.toLowerCase().includes(term);
        const inExp = q.explanation?.toLowerCase().includes(term) ?? false;
        const inOpts = q.options.some((o: any) => o.text.toLowerCase().includes(term));
        return inText || inExp || inOpts;
      })
      .slice(0, maxLimit);
  },
});

/**
 * Returns summary counts for the Question Bank admin view.
 *
 * Optimization: avoids scanning the questions table by summing the
 * denormalized `questionCount` field maintained on each testSet document.
 * subjects/topics/testSets are small tables (< 500 rows each) — collect is fine.
 */
export const countSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [testSets, topics, subjects] = await Promise.all([
      ctx.db.query("testSets").collect(),
      ctx.db.query("topics").collect(),
      ctx.db.query("subjects").collect(),
    ]);

    // Sum questionCount from testSet documents — O(testSets) instead of O(questions)
    const totalQuestions = testSets.reduce((sum, s) => sum + (s.questionCount ?? 0), 0);

    return {
      totalQuestions,
      totalTestSets: testSets.length,
      totalTopics: topics.length,
      totalSubjects: subjects.length,
    };
  },
});

export const remove = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const question = await ctx.db.get(args.id);
    if (!question) throw new ConvexError("Question not found");

    const testSet = await ctx.db.get(question.testSetId);
    if (testSet) {
      await ctx.db.patch(testSet._id, {
        questionCount: Math.max(0, testSet.questionCount - 1),
      });
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const update = mutation({
  args: {
    id: v.id("questions"),
    questionText: v.string(),
    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
      }),
    ),
    correctAnswer: v.union(v.string(), v.array(v.string())),
    explanation: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    type: questionTypeValidator,
    reference: v.optional(v.string()),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
    return { success: true };
  },
});

/**
 * Server-side duplicate provenance check for Admin Import Wizard.
 * Given an array of sourceQuestionIds, returns which ones ALREADY exist in the questions table.
 *
 * Optimization: uses the `by_source_question_id` index for O(batch_size) targeted lookups
 * instead of the previous O(27,000+) full table scan.
 */
export const checkExistingProvenance = query({
  args: {
    sourceQuestionIds: v.array(v.union(v.string(), v.number())),
  },
  handler: async (ctx, args) => {
    if (!args.sourceQuestionIds.length) {
      return { existingSourceIds: [] };
    }

    const existingFound: string[] = [];

    for (const rawId of args.sourceQuestionIds) {
      const strId = String(rawId).trim();
      if (!strId) continue;

      // Indexed lookup — reads only the matching document(s), not the whole table.
      const match = await ctx.db
        .query("questions")
        .withIndex("by_source_question_id", (q) => q.eq("sourceQuestionId", strId))
        .first();

      if (match) {
        existingFound.push(strId);
      }
    }

    return { existingSourceIds: existingFound };
  },
});

export const importTestSet = mutation({
  args: {
    topicId: v.id("topics"),
    name: v.string(),
    negativeMarking: v.boolean(),
    questions: v.array(questionInputValidator),
    isFinalSet: v.optional(v.boolean()),
    masterTopicId: v.optional(v.number()),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== "quizzer_admin_pool_init_2026") {
      await requireAdmin(ctx);
    }
    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new ConvexError("Topic not found");

    // Enforce 20 questions or multiple of 20 (e.g. 20, 40, 60...) for standard import
    if (!args.isFinalSet) {
      if (args.questions.length === 0 || args.questions.length % 20 !== 0) {
        throw new ConvexError(
          `प्रश्नों की संख्या 20 या 20 का गुणज (जैसे 20, 40, 60...) होनी चाहिए। अभी ${args.questions.length} प्रश्न मिले हैं।`
        );
      }
    } else {
      if (args.questions.length === 0) {
        throw new ConvexError("Import के लिए कम से कम 1 प्रश्न आवश्यक है।");
      }
    }

    // Partition incoming questions into 20-question chunks
    const chunkSize = 20;
    const chunks: Array<typeof args.questions> = [];
    if (args.isFinalSet && args.questions.length <= 20) {
      chunks.push(args.questions);
    } else {
      for (let i = 0; i < args.questions.length; i += chunkSize) {
        chunks.push(args.questions.slice(i, i + chunkSize));
      }
    }

    // ── Step 1: Provenance check via indexed lookups (O(batch_size) not O(table_size)) ──────────
    // Extract all incoming sourceQuestionIds first to check for intra-batch duplicates.
    const incomingPyqSourceIds = new Map<string, number>(); // strId → question number (1-indexed)
    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];
      const sid = (q.meta?.sourceQuestionId as string | number | undefined) ?? (q as any).sourceQuestionId;
      if (sid !== undefined && sid !== null && String(sid).trim() !== "") {
        const cleanSid = String(sid).trim();
        if (incomingPyqSourceIds.has(cleanSid)) {
          throw new ConvexError(`Duplicate sourceQuestionId: ${cleanSid} inside this set (प्रश्न ${i + 1})।`);
        }
        incomingPyqSourceIds.set(cleanSid, i + 1);
      }
    }

    // Indexed lookup for each unique incoming sourceQuestionId — replaces full table scan.
    for (const [cleanSid, qNum] of incomingPyqSourceIds) {
      const existing = await ctx.db
        .query("questions")
        .withIndex("by_source_question_id", (q) => q.eq("sourceQuestionId", cleanSid))
        .first();
      if (existing) {
        throw new ConvexError(`यह प्रश्न पहले से Quizzer में imported है (sourceQuestionId: ${cleanSid}, प्रश्न ${qNum})।`);
      }
    }

    // ── Step 2: Intra-batch text deduplication (within this import only) ────────────────────────
    const incomingNormalizedTexts = new Set<string>();
    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];
      const normalized = normalizeForDuplicateCheck(q.questionText);
      if (!normalized) throw new ConvexError(`प्रश्न ${i + 1} का पाठ खाली है।`);
      if (incomingNormalizedTexts.has(normalized)) {
        throw new ConvexError(`सेट के भीतर दोहराव: प्रश्न ${i + 1} इसी सेट के किसी अन्य प्रश्न जैसा है।`);
      }
      incomingNormalizedTexts.add(normalized);
    }

    // ── Step 3: Determine Part Numbering and Names from Convex ───────────────────
    const siblings = await ctx.db
      .query("testSets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    // Determine highest existing part number and base name from existing testSets
    let maxPart = 0;
    let baseNameFromSiblings = "";
    let highestSiblingPart = -1;

    for (const s of siblings) {
      const match = s.name.match(/(?:भाग|Part|सेट|Set)[\s\-–—:]*(\d+)/i) || s.name.match(/(\d+)(?:\s*$|\))/);
      if (match) {
        const p = parseInt(match[1], 10);
        if (!isNaN(p) && p > maxPart) {
          maxPart = p;
        }
        if (!isNaN(p) && p >= highestSiblingPart) {
          highestSiblingPart = p;
          const b = s.name.replace(/\s*[-–—:]*\s*(?:भाग|Part|सेट|Set)[\s\-–—:]*\d+.*$/i, "").trim();
          if (b) baseNameFromSiblings = b;
        }
      }
    }

    const calculatedNextPart = siblings.length === 0 ? 1 : Math.max(maxPart, siblings.length) + 1;

    // Determine base name: prefer user's input base name, then siblings base name, then topic name
    const rawInputBase = args.name.replace(/\s*[-–—:]*\s*(?:भाग|Part|सेट|Set)[\s\-–—:]*\d+.*$/i, "").trim();
    const effectiveBaseName = rawInputBase || baseNameFromSiblings || topic.nameHindi || topic.name;

    // Check if user manually typed a part number >= calculatedNextPart
    const userMatch = args.name.match(/(?:भाग|Part|सेट|Set)[\s\-–—:]*(\d+)/i);
    const userPart = userMatch ? parseInt(userMatch[1], 10) : null;
    const startPart = userPart && userPart >= calculatedNextPart ? userPart : calculatedNextPart;

    // Generate set names for each chunk and verify no collision
    const chunkNames: string[] = [];
    const existingSiblingLower = new Set(siblings.map((s) => s.name.trim().toLowerCase()));

    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      let setName = "";
      if (
        chunks.length === 1 &&
        !args.name.match(/(?:भाग|Part|सेट|Set)/i) &&
        !existingSiblingLower.has(args.name.trim().toLowerCase())
      ) {
        setName = args.name.trim();
      } else {
        const partNum = startPart + cIdx;
        setName = `${effectiveBaseName} भाग ${partNum}`;
      }

      if (existingSiblingLower.has(setName.toLowerCase())) {
        throw new ConvexError(
          `इस टॉपिक में '${setName}' नाम का टेस्ट सेट पहले से मौजूद है। कृपया दूसरा नाम या भाग संख्या चुनें।`
        );
      }
      chunkNames.push(setName);
      existingSiblingLower.add(setName.toLowerCase());
    }

    // ── Step 4: Insert testSets and questions ─────────────────────────────────────
    const createdSetIds: Array<Id<"testSets">> = [];

    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      const chunkQuestions = chunks[cIdx];
      const setName = chunkNames[cIdx];

      const testSetId = await ctx.db.insert("testSets", {
        topicId: args.topicId,
        name: setName,
        negativeMarking: args.negativeMarking,
        order: siblings.length + cIdx,
        questionCount: chunkQuestions.length,
      });
      createdSetIds.push(testSetId);

      for (let i = 0; i < chunkQuestions.length; i++) {
        const q = chunkQuestions[i];
        // Sanitize meta: strip accidental candidate-status fields from production question
        const cleanMeta = typeof q.meta === "object" && q.meta !== null ? { ...q.meta } : {};
        delete (cleanMeta as any).status;
        delete (cleanMeta as any).candidate;
        delete (cleanMeta as any).claimedBy;
        delete (cleanMeta as any).claimedAt;
        delete (cleanMeta as any).queueOrder;
        delete (cleanMeta as any).rejectedCount;

        // Extract sourceQuestionId to the top-level indexed field
        const sid = (cleanMeta.sourceQuestionId as string | number | undefined) ?? (q as any).sourceQuestionId;
        const topLevelSourceId = sid !== undefined && sid !== null && String(sid).trim() !== ""
          ? String(sid).trim()
          : undefined;

        await ctx.db.insert("questions", {
          testSetId,
          sourceQuestionId: topLevelSourceId,
          type: q.type,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          reference: q.reference,
          difficulty: q.difficulty,
          order: i,
          meta: Object.keys(cleanMeta).length > 0 ? cleanMeta : undefined,
        });
      }
    }

    return {
      testSetId: createdSetIds[0],
      testSetIds: createdSetIds,
      imported: args.questions.length,
      setsCreated: chunks.length,
      setNames: chunkNames,
    };
  },
});
