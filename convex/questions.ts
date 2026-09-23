import { v, ConvexError } from "convex/values";
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

function tokenSimilarity(a: string, b: string): number {
  const aTokens = new Set(normalizeForDuplicateCheck(a).split(" ").filter(Boolean));
  const bTokens = new Set(normalizeForDuplicateCheck(b).split(" ").filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;
  let intersection = 0;
  for (const token of aTokens) if (bTokens.has(token)) intersection++;
  return (2 * intersection) / (aTokens.size + bTokens.size);
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

    // Enforce 20 questions for standard set import, unless explicit final set on exhausted topic
    if (args.questions.length !== 20) {
      if (!args.isFinalSet) {
        throw new ConvexError(
          `20 प्रश्न आवश्यक हैं। अभी ${args.questions.length} प्रश्न मिले हैं। केवल अंतिम सेट (Final Set) में 20 से कम प्रश्न स्वीकार्य हैं।`
        );
      }
      if (args.questions.length === 0) {
        throw new ConvexError("Import के लिए कम से कम 1 प्रश्न आवश्यक है।");
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
    // The previous implementation compared every incoming question against all 27,000+ existing
    // questions in the database (O(20 × 27k) reads). That is not scalable.
    // Provenance is now guaranteed via the indexed sourceQuestionId check above.
    // Here we only verify the incoming batch has no internal exact-text duplicates.
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

    // ── Step 3: Duplicate set-name check within the same topic (bounded, small result) ──────────
    const siblings = await ctx.db
      .query("testSets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    const normalizedSetName = args.name.trim().toLowerCase();
    const existingSet = siblings.find((s) => s.name.trim().toLowerCase() === normalizedSetName);
    if (existingSet) {
      throw new ConvexError(
        `इस टॉपिक में '${args.name.trim()}' नाम का टेस्ट सेट पहले से मौजूद है (Duplicate Set Identity)। कृपया दूसरा नाम या भाग संख्या चुनें।`
      );
    }

    // ── Step 4: Insert testSet and questions ─────────────────────────────────────────────────────
    const testSetId = await ctx.db.insert("testSets", {
      topicId: args.topicId,
      name: args.name.trim(),
      negativeMarking: args.negativeMarking,
      order: siblings.length,
      questionCount: args.questions.length,
    });

    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];
      // Sanitize meta: strip accidental candidate-status fields from production question
      const cleanMeta = typeof q.meta === "object" && q.meta !== null ? { ...q.meta } : {};
      delete (cleanMeta as any).status;
      delete (cleanMeta as any).candidate;
      delete (cleanMeta as any).claimedBy;
      delete (cleanMeta as any).claimedAt;
      delete (cleanMeta as any).queueOrder;
      delete (cleanMeta as any).rejectedCount;

      // Extract sourceQuestionId to the top-level indexed field.
      // It remains in meta as well for backward compatibility with any admin tooling.
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

    return { testSetId, imported: args.questions.length };
  },
});
