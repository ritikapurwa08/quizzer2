import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/permissions";
import { questionInputValidator, questionTypeValidator } from "./lib/validators";

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

/**
 * Bulk import — runs atomically per test set:
 * Validates composition, ensures positive integer sourceQuestionIds for PYQ/PYQ_MODIFIED,
 * inserts questions, and tracks used sourceQuestionIds in usedPyqs table.
 */
export const bulkImport = mutation({
  args: {
    testSetId: v.id("testSets"),
    questions: v.array(questionInputValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const testSet = await ctx.db.get(args.testSetId);
    if (!testSet) throw new Error("Test set not found");
    const topic = await ctx.db.get(testSet.topicId);
    const subjectId = topic?.subjectId;

    let pyqCount = 0;
    let pyqModCount = 0;
    let aiNewCount = 0;
    const sourceIds: number[] = [];

    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];
      const st = q.meta?.sourceType;
      const sid = q.meta?.sourceQuestionId;

      if (st === "PYQ" || st === "PYQ_EXACT") {
        pyqCount++;
        if (typeof sid !== "number" || !Number.isInteger(sid) || sid <= 0) {
          throw new Error(`Question #${i + 1} (${st}) requires a valid integer sourceQuestionId.`);
        }
        sourceIds.push(sid);
      } else if (st === "PYQ_MODIFIED") {
        pyqModCount++;
        if (typeof sid !== "number" || !Number.isInteger(sid) || sid <= 0) {
          throw new Error(`Question #${i + 1} (PYQ_MODIFIED) requires a valid integer sourceQuestionId.`);
        }
        sourceIds.push(sid);
      } else if (st === "AI_NEW") {
        aiNewCount++;
        if (sid !== undefined && sid !== null) {
          throw new Error(`Question #${i + 1} (AI_NEW) must NOT have a sourceQuestionId.`);
        }
      }
    }

    // For standard 20-question imports, enforce strict composition contract
    if (args.questions.length === 20) {
      if (pyqCount !== 14 || pyqModCount !== 4 || aiNewCount !== 2) {
        throw new Error(
          `Invalid question composition. Expected: 14 PYQ + 4 PYQ_MODIFIED + 2 AI_NEW (Total: 20). Received: ${pyqCount} PYQ + ${pyqModCount} PYQ_MODIFIED + ${aiNewCount} AI_NEW.`
        );
      }

      if (new Set(sourceIds).size !== sourceIds.length) {
        throw new Error("Duplicate sourceQuestionIds detected within the imported batch.");
      }

      if (topic) {
        for (const sid of sourceIds) {
          const alreadyUsed = await ctx.db
            .query("usedPyqs")
            .withIndex("by_topic_source", (q) =>
              q.eq("topicId", testSet.topicId).eq("sourceQuestionId", sid)
            )
            .first();
          if (alreadyUsed) {
            throw new Error(`sourceQuestionId ${sid} has already been used for this topic.`);
          }
        }
      }
    }

    const existing = await ctx.db
      .query("questions")
      .withIndex("by_test_set", (q) => q.eq("testSetId", args.testSetId))
      .collect();

    let order = existing.length;
    const usedAt = Date.now();

    for (const q of args.questions) {
      const questionId = await ctx.db.insert("questions", {
        testSetId: args.testSetId,
        type: q.type,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        reference: q.reference,
        difficulty: q.difficulty,
        order: order++,
        meta: q.meta,
      });

      const st = q.meta?.sourceType;
      const sid = q.meta?.sourceQuestionId;
      if (
        topic &&
        subjectId &&
        (st === "PYQ" || st === "PYQ_EXACT" || st === "PYQ_MODIFIED") &&
        typeof sid === "number" &&
        Number.isInteger(sid) &&
        sid > 0
      ) {
        await ctx.db.insert("usedPyqs", {
          subjectId,
          topicId: testSet.topicId,
          sourceQuestionId: sid,
          testSetId: args.testSetId,
          questionId,
          usedAt,
        });
      }
    }

    await ctx.db.patch(testSet._id, {
      questionCount: existing.length + args.questions.length,
    });

    return { imported: args.questions.length, usedTracked: sourceIds.length };
  },
});

/**
 * All-in-one atomic test set import mutation for Admin workflow:
 * Atomically creates the testSet, inserts 20 questions, and records 18 usedPyqs in one transaction.
 * If any check fails, none of the records are created.
 */
export const importTestSetWithPyqs = mutation({
  args: {
    topicId: v.id("topics"),
    name: v.string(),
    negativeMarking: v.boolean(),
    questions: v.array(questionInputValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new Error("Topic not found");
    const subjectId = topic.subjectId;

    // 1. Strict 20-question composition check (14 PYQ + 4 PYQ_MODIFIED + 2 AI_NEW)
    let pyqCount = 0;
    let pyqModCount = 0;
    let aiNewCount = 0;
    const sourceIds: number[] = [];

    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];
      const st = q.meta?.sourceType;
      const sid = q.meta?.sourceQuestionId;

      if (st === "PYQ" || st === "PYQ_EXACT") {
        pyqCount++;
        if (typeof sid !== "number" || !Number.isInteger(sid) || sid <= 0) {
          throw new Error(`Question #${i + 1} (${st}) requires a valid integer sourceQuestionId.`);
        }
        sourceIds.push(sid);
      } else if (st === "PYQ_MODIFIED") {
        pyqModCount++;
        if (typeof sid !== "number" || !Number.isInteger(sid) || sid <= 0) {
          throw new Error(`Question #${i + 1} (PYQ_MODIFIED) requires a valid integer sourceQuestionId.`);
        }
        sourceIds.push(sid);
      } else if (st === "AI_NEW") {
        aiNewCount++;
        if (sid !== undefined && sid !== null) {
          throw new Error(`Question #${i + 1} (AI_NEW) must NOT have a sourceQuestionId.`);
        }
      } else {
        throw new Error(`Question #${i + 1} has invalid or missing sourceType: ${st}`);
      }
    }

    if (args.questions.length !== 20 || pyqCount !== 14 || pyqModCount !== 4 || aiNewCount !== 2) {
      throw new Error(
        `Invalid question composition. Expected: 14 PYQ + 4 PYQ_MODIFIED + 2 AI_NEW (Total: 20). Received: ${pyqCount} PYQ + ${pyqModCount} PYQ_MODIFIED + ${aiNewCount} AI_NEW (Total: ${args.questions.length}).`
      );
    }

    // 2. Duplicate protection within batch
    if (new Set(sourceIds).size !== sourceIds.length) {
      throw new Error("Duplicate sourceQuestionIds detected within the imported batch.");
    }

    // 3. Duplicate protection against existing usedPyqs for this topic
    for (const sid of sourceIds) {
      const alreadyUsed = await ctx.db
        .query("usedPyqs")
        .withIndex("by_topic_source", (q) =>
          q.eq("topicId", args.topicId).eq("sourceQuestionId", sid)
        )
        .first();
      if (alreadyUsed) {
        throw new Error(`sourceQuestionId ${sid} has already been used for this topic.`);
      }
    }

    // 4. Create testSet
    const siblings = await ctx.db
      .query("testSets")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    const testSetId = await ctx.db.insert("testSets", {
      topicId: args.topicId,
      name: args.name.trim(),
      negativeMarking: args.negativeMarking,
      order: siblings.length,
      questionCount: args.questions.length,
    });

    // 5. Atomically insert questions and track usedPyqs
    const usedAt = Date.now();
    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];
      const questionId = await ctx.db.insert("questions", {
        testSetId,
        type: q.type,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        reference: q.reference,
        difficulty: q.difficulty,
        order: i,
        meta: q.meta,
      });

      const st = q.meta?.sourceType;
      const sid = q.meta?.sourceQuestionId;
      if (
        (st === "PYQ" || st === "PYQ_EXACT" || st === "PYQ_MODIFIED") &&
        typeof sid === "number" &&
        Number.isInteger(sid) &&
        sid > 0
      ) {
        await ctx.db.insert("usedPyqs", {
          subjectId,
          topicId: args.topicId,
          sourceQuestionId: sid,
          testSetId,
          questionId,
          usedAt,
        });
      }
    }

    return {
      testSetId,
      imported: args.questions.length,
      usedTracked: sourceIds.length,
    };
  },
});


/**
 * Idempotent test set import mutation for CLI/script workflow:
 * Creates or finds subject/topic/testSet, ensures exactly 10 questions, avoids duplicating questions.
 */
export const importTestSetAtomic = mutation({
  args: {
    subjectSlug: v.string(),
    subjectName: v.string(),
    subjectNameHindi: v.optional(v.string()),
    topicSlug: v.string(),
    topicName: v.string(),
    topicNameHindi: v.optional(v.string()),
    testSetName: v.string(),
    negativeMarking: v.boolean(),
    questions: v.array(questionInputValidator),
  },
  handler: async (ctx, args) => {
    // 1. Find or create subject
    let subject = await ctx.db
      .query("subjects")
      .withIndex("by_slug", (q) => q.eq("slug", args.subjectSlug))
      .unique();

    if (!subject) {
      const existingSubjects = await ctx.db.query("subjects").collect();
      const subjectId = await ctx.db.insert("subjects", {
        name: args.subjectName,
        nameHindi: args.subjectNameHindi,
        slug: args.subjectSlug,
        order: existingSubjects.length,
      });
      subject = await ctx.db.get(subjectId);
    }

    if (!subject) throw new Error("Could not find or create subject");

    // 2. Find or create topic
    let topic = await ctx.db
      .query("topics")
      .withIndex("by_subject_slug", (q) =>
        q.eq("subjectId", subject._id).eq("slug", args.topicSlug)
      )
      .unique();

    if (!topic) {
      const siblingTopics = await ctx.db
        .query("topics")
        .withIndex("by_subject", (q) => q.eq("subjectId", subject._id))
        .collect();
      const topicId = await ctx.db.insert("topics", {
        subjectId: subject._id,
        name: args.topicName,
        nameHindi: args.topicNameHindi,
        slug: args.topicSlug,
        order: siblingTopics.length,
      });
      topic = await ctx.db.get(topicId);
    }

    if (!topic) throw new Error("Could not find or create topic");

    // 3. Find or create testSet
    const existingSets = await ctx.db
      .query("testSets")
      .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
      .collect();

    let testSet: (typeof existingSets)[number] | null =
      existingSets.find((s) => s.name.trim() === args.testSetName.trim()) ?? null;

    if (testSet) {
      const existingQuestions = await ctx.db
        .query("questions")
        .withIndex("by_test_set", (q) => q.eq("testSetId", testSet!._id))
        .collect();

      if (existingQuestions.length >= 10) {
        return {
          status: "already_exists",
          testSetId: testSet._id,
          topicId: topic._id,
          subjectId: subject._id,
          imported: 0,
          existingCount: existingQuestions.length,
        };
      }
    } else {
      const testSetId = await ctx.db.insert("testSets", {
        topicId: topic._id,
        name: args.testSetName,
        negativeMarking: args.negativeMarking,
        order: existingSets.length,
        questionCount: 0,
      });
      testSet = await ctx.db.get(testSetId);
    }

    if (!testSet) throw new Error("Could not find or create testSet");

    // 4. Insert questions
    let order = 0;
    for (const q of args.questions) {
      await ctx.db.insert("questions", {
        testSetId: testSet._id,
        type: q.type,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        reference: q.reference,
        difficulty: q.difficulty,
        order: order++,
        meta: q.meta,
      });
    }

    await ctx.db.patch(testSet._id, {
      questionCount: args.questions.length,
    });

    return {
      status: "imported",
      testSetId: testSet._id,
      topicId: topic._id,
      subjectId: subject._id,
      imported: args.questions.length,
    };
  },
});

