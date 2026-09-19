import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("student"))),
  }).index("by_email", ["email"]),

  subjects: defineTable({
    name: v.string(),
    nameHindi: v.optional(v.string()),
    slug: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
  }).index("by_slug", ["slug"]),

  topics: defineTable({
    subjectId: v.id("subjects"),
    name: v.string(),
    nameHindi: v.optional(v.string()),
    slug: v.string(),
    order: v.number(),
  })
    .index("by_subject", ["subjectId"])
    .index("by_subject_slug", ["subjectId", "slug"]),

  testSets: defineTable({
    topicId: v.id("topics"),
    name: v.string(),
    order: v.number(),
    negativeMarking: v.boolean(),
    questionCount: v.number(),
  }).index("by_topic", ["topicId"]),

  questions: defineTable({
    testSetId: v.id("testSets"),
    // Accepts both v2 types and legacy types for backward compatibility with existing data
    type: v.union(
      // v2 canonical types
      v.literal("mcq"),
      v.literal("match"),
      v.literal("assertion"),
      v.literal("true_false"),
      // legacy aliases — kept so old seeded/imported questions still render
      v.literal("match_following"),
      v.literal("assertion_reason"),
      v.literal("statement_reason"),
      v.literal("sequence"),
      v.literal("table"),
    ),
    questionText: v.string(),
    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
      }),
    ),
    correctAnswer: v.union(v.string(), v.array(v.string())),
    explanation: v.optional(v.string()),
    reference: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    order: v.number(),
    meta: v.optional(v.any()),
  }).index("by_test_set", ["testSetId"]),

  attempts: defineTable({
    userId: v.id("users"),
    testSetId: v.id("testSets"),
    startedAt: v.number(),
    submittedAt: v.optional(v.number()),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selected: v.optional(v.union(v.string(), v.array(v.string()))),
        isCorrect: v.optional(v.boolean()),
      }),
    ),
    score: v.optional(v.number()),
    totalQuestions: v.number(),
    status: v.union(v.literal("in_progress"), v.literal("submitted")),
  })
    .index("by_user", ["userId"])
    .index("by_user_test_set", ["userId", "testSetId"])
    // Enables newest-first paginated result history without client-side sort.
    .index("by_user_submitted", ["userId", "submittedAt"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    questionId: v.id("questions"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_question", ["userId", "questionId"]),

  wrongQuestions: defineTable({
    userId: v.id("users"),
    questionId: v.id("questions"),
    lastMissedAt: v.number(),
    missCount: v.number(),
    resolved: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_question", ["userId", "questionId"])
    // Enables newest-first default ordering in the wrong questions revision bank.
    .index("by_user_last_missed", ["userId", "lastMissedAt"]),

  // Persistent Question Pool: Topic-wise question queue
  poolQuestions: defineTable({
    masterTopicId: v.number(),
    masterTopic: v.string(),
    source: v.string(), // "RajasthanGyan" | "FinalPYQ" | etc.
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
    claimedBy: v.optional(v.string()),
    claimedAt: v.optional(v.number()),
    usedAt: v.optional(v.number()),
    usedTestSetId: v.optional(v.id("testSets")),
    fingerprint: v.string(),
    reference: v.optional(v.string()),
  })
    .index("by_topic_status_order", ["masterTopicId", "status", "queueOrder"])
    .index("by_topic_order", ["masterTopicId", "queueOrder"])
    .index("by_topic", ["masterTopicId"])
    .index("by_source_id", ["source", "sourceQuestionId"])
    .index("by_status", ["status"])
    .index("by_fingerprint", ["fingerprint"]),

  // Aggregated Topic-wise Queue Metadata & Stats
  poolTopicSummaries: defineTable({
    masterTopicId: v.number(),
    masterTopic: v.string(),
    subjectName: v.optional(v.string()),
    subjectNameHindi: v.optional(v.string()),
    total: v.number(),
    used: v.number(),
    available: v.number(),
    requeued: v.number(),
    processing: v.number(),
    status: v.union(
      v.literal("NOT_STARTED"),
      v.literal("IN_PROGRESS"),
      v.literal("NEAR_COMPLETE"),
      v.literal("COMPLETED")
    ),
    nextQueueOrder: v.number(),
    allowFinalBelow20: v.optional(v.boolean()),
    isFinalExhausted: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index("by_master_topic_id", ["masterTopicId"])
    .index("by_status", ["status"]),

});

