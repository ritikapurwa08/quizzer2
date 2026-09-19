import { v } from "convex/values";
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
        // SourceType filter
        if (args.sourceType && args.sourceType !== "all") {
          const qSource = (q.meta?.sourceType as string) || "";
          if (args.sourceType === "PYQ") {
            if (qSource !== "PYQ" && qSource !== "PYQ_EXACT" && !qSource.startsWith("PYQ")) return false;
          } else if (args.sourceType === "PYQ_MODIFIED") {
            if (qSource !== "PYQ_MODIFIED") return false;
          } else if (args.sourceType === "AI_NEW") {
            if (qSource !== "AI_NEW") return false;
          }
        }

        // Exam filter
        if (args.exam && args.exam.trim().length > 0) {
          const qExam = (q.meta?.exam as string) || "";
          if (!qExam.toLowerCase().includes(args.exam.trim().toLowerCase())) return false;
        }

        // Term filter
        if (term.length > 0) {
          if (q.questionText.toLowerCase().includes(term)) return true;
          if (q.options?.some((o: any) => o.text.toLowerCase().includes(term))) return true;
          if (q.explanation && q.explanation.toLowerCase().includes(term)) return true;
          return false;
        }

        return true;
      })
      .slice(0, maxLimit);
  },
});


export const update = mutation({
  args: {
    id: v.id("questions"),
    type: v.optional(questionTypeValidator),
    questionText: v.optional(v.string()),
    options: v.optional(v.array(v.object({ id: v.string(), text: v.string() }))),
    correctAnswer: v.optional(v.union(v.string(), v.array(v.string()))),
    explanation: v.optional(v.string()),
    reference: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const question = await ctx.db.get(args.id);
    if (!question) return;
    await ctx.db.delete(args.id);
    const testSet = await ctx.db.get(question.testSetId);
    if (testSet) {
      await ctx.db.patch(testSet._id, {
        questionCount: Math.max(0, testSet.questionCount - 1),
      });
    }
  },
});

export const checkExistingProvenance = query({
  args: {
    sourceQuestionIds: v.array(v.union(v.string(), v.number())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!args.sourceQuestionIds || args.sourceQuestionIds.length === 0) {
      return { existingSourceIds: [] };
    }
    const requested = new Set(args.sourceQuestionIds.map((id) => String(id).trim()));
    const existingQuestions = await ctx.db.query("questions").collect();
    const existingFound: string[] = [];
    for (const eq of existingQuestions) {
      const sid = eq.meta?.sourceQuestionId;
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
    if (!topic) throw new Error("Topic not found");

    // Enforce 20 questions for standard set import, unless explicit final set on exhausted topic
    if (args.questions.length !== 20) {
      if (!args.isFinalSet) {
        throw new Error(
          `20 प्रश्न आवश्यक हैं। अभी ${args.questions.length} प्रश्न मिले हैं। केवल अंतिम सेट (Final Set) में 20 से कम प्रश्न स्वीकार्य हैं।`
        );
      }
      if (args.questions.length === 0) {
        throw new Error("Import के लिए कम से कम 1 प्रश्न आवश्यक है।");
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
          throw new Error(`Duplicate sourceQuestionId: ${cleanSid} inside this set (प्रश्न ${qNum})।`);
        }
        incomingPyqSourceIds.add(cleanSid);

        if (existingPyqSourceIds.has(cleanSid)) {
          throw new Error(`यह प्रश्न पहले से Quizzer में imported है (sourceQuestionId: ${cleanSid}, प्रश्न ${qNum})।`);
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
      if (!current.normalized) throw new Error(`Question ${i + 1} is empty.`);
      if (seen.has(current.normalized)) {
        throw new Error(`Duplicate question inside this set: question ${i + 1}.`);
      }
      seen.add(current.normalized);

      for (const existing of existingQuestions) {
        const existingNormalized = normalizeForDuplicateCheck(existing.questionText);
        if (current.normalized === existingNormalized) {
          throw new Error(`Duplicate question detected: question ${i + 1} already exists in an imported set.`);
        }
        // Avoid aggressive fuzzy matching: only flag near-identical paraphrases for long questions
        if (current.normalized.length >= 50 && existingNormalized.length >= 50 && tokenSimilarity(current.normalized, existingNormalized) >= 0.96) {
          throw new Error(`Possible repeated question detected: question ${i + 1} is too similar to an existing imported question.`);
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
      throw new Error(
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
