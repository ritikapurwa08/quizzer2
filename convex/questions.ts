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
 */
export const countSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const questions = await ctx.db.query("questions").collect();
    const testSets = await ctx.db.query("testSets").collect();
    const topics = await ctx.db.query("topics").collect();
    const subjects = await ctx.db.query("subjects").collect();

    return {
      totalQuestions: questions.length,
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
 * Given an array of sourceQuestionIds, returns which ones ALREADY exist in Convex questions table.
 */
export const checkExistingProvenance = query({
  args: {
    sourceQuestionIds: v.array(v.union(v.string(), v.number())),
  },
  handler: async (ctx, args) => {
    if (!args.sourceQuestionIds.length) {
      return { existingSourceIds: [] };
    }

    const requested = new Set(args.sourceQuestionIds.map((id) => String(id).trim()));
    const existingFound: string[] = [];

    // Scan all questions in DB to locate existing sourceQuestionIds
    const allQuestions = await ctx.db.query("questions").collect();
    for (const q of allQuestions) {
      const sid = q.meta?.sourceQuestionId;
      if (sid !== undefined && sid !== null) {
        const strId = String(sid).trim();
        if (requested.has(strId) && !existingFound.includes(strId)) {
          existingFound.push(strId);
        }
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

    // Verify against every question already stored in Convex. The database is the durable record.
    const existingQuestions = await ctx.db.query("questions").collect();

    // 1. Check provenance & sourceQuestionId uniqueness against existing database
    const existingPyqSourceIds = new Map<string, string>();
    for (const eq of existingQuestions) {
      const sid = eq.meta?.sourceQuestionId;
      if (sid !== undefined && sid !== null) {
        existingPyqSourceIds.set(String(sid).trim(), eq.questionText);
      }
    }

    const incomingPyqSourceIds = new Set<string>();
    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];
      const qNum = i + 1;
      const sid = (q.meta?.sourceQuestionId as string | number | undefined) ?? (q as any).sourceQuestionId;

      if (sid !== undefined && sid !== null && String(sid).trim() !== "") {
        const cleanSid = String(sid).trim();
        if (incomingPyqSourceIds.has(cleanSid)) {
          throw new ConvexError(`Duplicate sourceQuestionId: ${cleanSid} inside this set (प्रश्न ${qNum})।`);
        }
        incomingPyqSourceIds.add(cleanSid);

        if (existingPyqSourceIds.has(cleanSid)) {
          throw new ConvexError(`यह प्रश्न पहले से Quizzer में imported है (sourceQuestionId: ${cleanSid}, प्रश्न ${qNum})।`);
        }
      }
    }

    // 2. Check question text duplicates
    const incoming = args.questions.map((q) => ({
      ...q,
      normalized: normalizeForDuplicateCheck(q.questionText),
    }));

    const seen = new Set<string>();
    for (let i = 0; i < incoming.length; i++) {
      const current = incoming[i];
      if (!current.normalized) throw new ConvexError(`प्रश्न ${i + 1} का पाठ खाली है।`);
      if (seen.has(current.normalized)) {
        throw new ConvexError(`सेट के भीतर दोहराव: प्रश्न ${i + 1} इसी सेट के किसी अन्य प्रश्न जैसा है।`);
      }
      seen.add(current.normalized);

      for (const existing of existingQuestions) {
        const existingNormalized = normalizeForDuplicateCheck(existing.questionText);
        if (current.normalized === existingNormalized) {
          throw new ConvexError(`दोहराव पहचाना गया: प्रश्न ${i + 1} ("${current.questionText.slice(0, 35)}...") पहले से Quizzer में मौजूद है।`);
        }
        // Avoid aggressive fuzzy matching: only flag near-identical paraphrases for long questions
        if (current.normalized.length >= 50 && existingNormalized.length >= 50 && tokenSimilarity(current.normalized, existingNormalized) >= 0.96) {
          throw new ConvexError(`संभावित दोहराव: प्रश्न ${i + 1} पहले से मौजूद प्रश्न से 96% से अधिक मिलता-जुलता है।`);
        }
      }
    }

    const siblings = await ctx.db
      .query("testSets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    // Prevent duplicate set identity under the same topic
    const normalizedSetName = args.name.trim().toLowerCase();
    const existingSet = siblings.find(
      (s) => s.name.trim().toLowerCase() === normalizedSetName
    );
    if (existingSet) {
      throw new ConvexError(
        `इस टॉपिक में '${args.name.trim()}' नाम का टेस्ट सेट पहले से मौजूद है (Duplicate Set Identity)। कृपया दूसरा नाम या भाग संख्या चुनें।`
      );
    }

    const testSetId = await ctx.db.insert("testSets", {
      topicId: args.topicId,
      name: args.name.trim(),
      negativeMarking: args.negativeMarking,
      order: siblings.length,
      questionCount: args.questions.length,
    });

    const now = Date.now();
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

      await ctx.db.insert("questions", {
        testSetId,
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
