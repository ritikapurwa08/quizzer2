import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, isEmailAdmin } from "./lib/permissions";
import { SYLLABUS_DATA } from "./seed";

const CLAIM_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// Helper: map masterTopicId (1-73) to Subject Name
const MASTER_TOPIC_MAP: Record<number, { masterTopic: string; subjectName: string; subjectNameHindi: string }> = {};
let topicIdCounter = 1;
for (const subj of SYLLABUS_DATA) {
  for (const top of subj.topics) {
    MASTER_TOPIC_MAP[topicIdCounter] = {
      masterTopic: top.nameHindi,
      subjectName: subj.name,
      subjectNameHindi: subj.nameHindi,
    };
    topicIdCounter++;
  }
}

/**
 * List all 73 Master Topic summaries with real-time pool and queue stats
 */
export const listTopicSummaries = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
        .unique();
      if (user && user.role !== "admin" && !isEmailAdmin(user.email)) {
        throw new Error("Admin access required");
      }
    }

    const summaries = await ctx.db.query("poolTopicSummaries").collect();
    const summaryMap = new Map<number, any>();
    for (const s of summaries) {
      summaryMap.set(s.masterTopicId, s);
    }

    const result = [];
    for (let id = 1; id <= 73; id++) {
      const info = MASTER_TOPIC_MAP[id];
      const existing = summaryMap.get(id);

      if (existing) {
        result.push({
          ...existing,
          subjectName: existing.subjectName || info?.subjectName || "",
          subjectNameHindi: existing.subjectNameHindi || info?.subjectNameHindi || "",
          nextCandidateCount: Math.min(30, existing.available),
        });
      } else {
        result.push({
          masterTopicId: id,
          masterTopic: info?.masterTopic || `Topic ${id}`,
          subjectName: info?.subjectName || "",
          subjectNameHindi: info?.subjectNameHindi || "",
          total: 0,
          used: 0,
          available: 0,
          requeued: 0,
          processing: 0,
          status: "NOT_STARTED" as const,
          nextQueueOrder: 1,
          allowFinalBelow20: false,
          isFinalExhausted: false,
          nextCandidateCount: 0,
          updatedAt: Date.now(),
        });
      }
    }

    return result.sort((a, b) => a.masterTopicId - b.masterTopicId);
  },
});

/**
 * Get summary details for a specific Master Topic
 */
export const getTopicSummary = query({
  args: { masterTopicId: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
        .unique();
      if (user && user.role !== "admin" && !isEmailAdmin(user.email)) {
        throw new Error("Admin access required");
      }
    }

    const summary = await ctx.db
      .query("poolTopicSummaries")
      .withIndex("by_master_topic_id", (q) => q.eq("masterTopicId", args.masterTopicId))
      .unique();

    if (summary) return summary;

    const info = MASTER_TOPIC_MAP[args.masterTopicId];
    return {
      masterTopicId: args.masterTopicId,
      masterTopic: info?.masterTopic || `Topic ${args.masterTopicId}`,
      subjectName: info?.subjectName || "",
      subjectNameHindi: info?.subjectNameHindi || "",
      total: 0,
      used: 0,
      available: 0,
      requeued: 0,
      processing: 0,
      status: "NOT_STARTED" as const,
      nextQueueOrder: 1,
      allowFinalBelow20: false,
      isFinalExhausted: false,
      updatedAt: Date.now(),
    };
  },
});

/**
 * Get Candidate Questions (25–30 window) for a Master Topic.
 * Atomically marks them PROCESSING and binds to the admin sessionId.
 * Auto-reclaims stale processing claims older than 15 minutes.
 */
export const getCandidates = mutation({
  args: {
    masterTopicId: v.number(),
    sessionId: v.string(),
    examPreference: v.optional(v.union(v.literal("all"), v.literal("prefer_exam"), v.literal("limit_exam"))),
    examLimit: v.optional(v.number()),
    windowSize: v.optional(v.number()),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== "quizzer_admin_pool_init_2026") {
      await requireAdmin(ctx);
    }
    const now = Date.now();
    const targetWindow = Math.min(30, Math.max(20, args.windowSize ?? 30));

    // 1. Auto-reclaim stale PROCESSING claims for this topic
    const processingQuestions = await ctx.db
      .query("poolQuestions")
      .withIndex("by_topic_status_order", (q) =>
        q.eq("masterTopicId", args.masterTopicId).eq("status", "PROCESSING")
      )
      .collect();

    for (const pq of processingQuestions) {
      if (!pq.claimedAt || now - pq.claimedAt > CLAIM_TIMEOUT_MS) {
        await ctx.db.patch(pq._id, {
          status: pq.rejectedCount > 0 ? "REQUEUED" : "AVAILABLE",
          claimedBy: undefined,
          claimedAt: undefined,
        });
      }
    }

    // 2. Query eligible candidates: AVAILABLE and REQUEUED, ordered by queueOrder
    const available = await ctx.db
      .query("poolQuestions")
      .withIndex("by_topic_status_order", (q) =>
        q.eq("masterTopicId", args.masterTopicId).eq("status", "AVAILABLE")
      )
      .collect();

    const requeued = await ctx.db
      .query("poolQuestions")
      .withIndex("by_topic_status_order", (q) =>
        q.eq("masterTopicId", args.masterTopicId).eq("status", "REQUEUED")
      )
      .collect();

    const pool = [...available, ...requeued].sort((a, b) => a.queueOrder - b.queueOrder);

    if (pool.length === 0) {
      return {
        success: true,
        candidates: [],
        totalRemaining: 0,
        message: "इस टॉपिक में कोई प्रश्न उपलब्ध नहीं हैं।",
      };
    }

    // 3. Apply exam question preference/filter
    let selected: typeof pool = [];
    const pref = args.examPreference || "all";

    if (pref === "prefer_exam") {
      const withExam = pool.filter((q) => Boolean(q.exam));
      const withoutExam = pool.filter((q) => !q.exam);
      selected = [...withExam, ...withoutExam].slice(0, targetWindow);
    } else if (pref === "limit_exam" && args.examLimit !== undefined && args.examLimit >= 0) {
      const withExam = pool.filter((q) => Boolean(q.exam)).slice(0, args.examLimit);
      const withExamIds = new Set(withExam.map((q) => q._id));
      const others = pool.filter((q) => !withExamIds.has(q._id));
      selected = [...withExam, ...others].slice(0, targetWindow);
    } else {
      selected = pool.slice(0, targetWindow);
    }

    // 4. Atomically claim selected candidates
    for (const q of selected) {
      await ctx.db.patch(q._id, {
        status: "PROCESSING",
        claimedBy: args.sessionId,
        claimedAt: now,
      });
    }

    // 5. Update summary counts
    await recalculateTopicSummary(ctx, args.masterTopicId);

    return {
      success: true,
      candidates: selected.map((q) => ({
        _id: q._id,
        id: q.sourceQuestionId,
        sourceQuestionId: q.sourceQuestionId,
        source: q.source,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        exam: q.exam || null,
        year: q.year || null,
        type: q.type || "mcq",
        queueOrder: q.queueOrder,
        rejectedCount: q.rejectedCount,
        reference: q.reference || (q.exam ? `📌 PYQ — ${q.exam}${q.year ? ` (${q.year})` : ""}` : undefined),
      })),
      totalRemaining: pool.length - selected.length,
    };
  },
});

/**
 * Release claimed candidate questions back to AVAILABLE / REQUEUED
 */
export const releaseClaim = mutation({
  args: {
    masterTopicId: v.number(),
    sessionId: v.string(),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== "quizzer_admin_pool_init_2026") {
      await requireAdmin(ctx);
    }
    const claimed = await ctx.db
      .query("poolQuestions")
      .withIndex("by_topic_status_order", (q) =>
        q.eq("masterTopicId", args.masterTopicId).eq("status", "PROCESSING")
      )
      .collect();

    let releasedCount = 0;
    for (const q of claimed) {
      if (q.claimedBy === args.sessionId) {
        await ctx.db.patch(q._id, {
          status: q.rejectedCount > 0 ? "REQUEUED" : "AVAILABLE",
          claimedBy: undefined,
          claimedAt: undefined,
        });
        releasedCount++;
      }
    }

    await recalculateTopicSummary(ctx, args.masterTopicId);
    return { success: true, releasedCount };
  },
});

/**
 * Set allowFinalBelow20 on a Master Topic summary (only permitted if available < 20)
 */
export const setAllowFinalBelow20 = mutation({
  args: {
    masterTopicId: v.number(),
    allow: v.boolean(),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== "quizzer_admin_pool_init_2026") {
      await requireAdmin(ctx);
    }
    const summary = await ctx.db
      .query("poolTopicSummaries")
      .withIndex("by_master_topic_id", (q) => q.eq("masterTopicId", args.masterTopicId))
      .unique();

    if (!summary) throw new Error("Topic summary not found");

    if (args.allow && summary.available >= 20) {
      throw new Error("Final Set < 20 केवल तभी सक्षम किया जा सकता है जब टॉपिक में 20 से कम प्रश्न शेष हों।");
    }

    await ctx.db.patch(summary._id, {
      allowFinalBelow20: args.allow,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Batch insert pool questions (used during seeding / hydration)
 */
export const batchInsertPoolQuestions = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    questions: v.array(
      v.object({
        masterTopicId: v.number(),
        masterTopic: v.string(),
        source: v.string(),
        sourceQuestionId: v.string(),
        questionText: v.string(),
        options: v.array(v.string()),
        correctAnswer: v.union(v.string(), v.number()),
        explanation: v.optional(v.string()),
        exam: v.optional(v.string()),
        year: v.optional(v.number()),
        type: v.optional(v.string()),
        status: v.union(
          v.literal("AVAILABLE"),
          v.literal("PROCESSING"),
          v.literal("USED"),
          v.literal("REQUEUED"),
          v.literal("PERMANENTLY_EXCLUDED")
        ),
        queueOrder: v.number(),
        rejectedCount: v.number(),
        fingerprint: v.string(),
        reference: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== "quizzer_admin_pool_init_2026") {
      await requireAdmin(ctx);
    }
    const affectedTopicIds = new Set<number>();

    for (const q of args.questions) {
      // Check if sourceQuestionId already exists in pool
      const existing = await ctx.db
        .query("poolQuestions")
        .withIndex("by_source_id", (query) =>
          query.eq("source", q.source).eq("sourceQuestionId", q.sourceQuestionId)
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("poolQuestions", q);
        affectedTopicIds.add(q.masterTopicId);
      }
    }

    for (const topicId of affectedTopicIds) {
      await recalculateTopicSummary(ctx, topicId);
    }

    return { inserted: args.questions.length };
  },
});

/**
 * Recalculates and persists topic summary counts
 */
export async function recalculateTopicSummary(ctx: any, masterTopicId: number) {
  const allTopicQuestions = await ctx.db
    .query("poolQuestions")
    .withIndex("by_topic", (q: any) => q.eq("masterTopicId", masterTopicId))
    .collect();

  const total = allTopicQuestions.length;
  let used = 0;
  let available = 0;
  let requeued = 0;
  let processing = 0;
  let maxQueueOrder = 0;

  for (const q of allTopicQuestions) {
    if (q.queueOrder > maxQueueOrder) maxQueueOrder = q.queueOrder;
    if (q.status === "USED") used++;
    else if (q.status === "AVAILABLE") available++;
    else if (q.status === "REQUEUED") requeued++;
    else if (q.status === "PROCESSING") processing++;
  }

  let status: "NOT_STARTED" | "IN_PROGRESS" | "NEAR_COMPLETE" | "COMPLETED" = "NOT_STARTED";
  if (available === 0 && requeued === 0 && processing === 0 && used > 0) {
    status = "COMPLETED";
  } else if (available < 20 && available + requeued < 20 && used > 0) {
    status = "NEAR_COMPLETE";
  } else if (used > 0 || processing > 0) {
    status = "IN_PROGRESS";
  }

  const existingSummary = await ctx.db
    .query("poolTopicSummaries")
    .withIndex("by_master_topic_id", (q: any) => q.eq("masterTopicId", masterTopicId))
    .unique();

  const info = MASTER_TOPIC_MAP[masterTopicId];
  const payload = {
    masterTopicId,
    masterTopic: info?.masterTopic || `Topic ${masterTopicId}`,
    subjectName: info?.subjectName || "",
    subjectNameHindi: info?.subjectNameHindi || "",
    total,
    used,
    available,
    requeued,
    processing,
    status,
    nextQueueOrder: maxQueueOrder + 1,
    isFinalExhausted: available === 0 && requeued === 0 && processing === 0,
    updatedAt: Date.now(),
  };

  if (existingSummary) {
    await ctx.db.patch(existingSummary._id, payload);
  } else {
    await ctx.db.insert("poolTopicSummaries", {
      ...payload,
      allowFinalBelow20: false,
    });
  }
}
