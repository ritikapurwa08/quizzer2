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
    durationMinutes: v.optional(v.number()),
  }).index("by_topic", ["topicId"]),

  questions: defineTable({
    testSetId: v.id("testSets"),
    topicId: v.optional(v.id("topics")),
    subjectId: v.optional(v.id("subjects")),
    status: v.optional(v.string()),
    // Promoted from meta for indexed provenance lookups (avoids full table scan).
    // Stores the canonical string form of meta.sourceQuestionId.
    sourceQuestionId: v.optional(v.string()),
    // Exactly 6 canonical question types
    type: v.union(
      v.literal("mcq"),
      v.literal("match"),
      v.literal("match_following"),
      v.literal("match_the_following"),
      v.literal("matching"),
      v.literal("assertion"),
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
  })
    .index("by_test_set", ["testSetId"])
    // Enables O(1) provenance check: sourceQuestionId → existing question
    // without scanning the full questions table.
    .index("by_source_question_id", ["sourceQuestionId"])
    .index("by_topic", ["topicId"])
    .index("by_subject", ["subjectId"])
    .index("by_difficulty", ["difficulty"])
    .index("by_status", ["status"]),

  attempts: defineTable({
    userId: v.id("users"),
    testSetId: v.id("testSets"),
    startedAt: v.number(),
    submittedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
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
    // Fixed duration pausable timer state
    totalDurationSeconds: v.optional(v.number()),
    elapsedSeconds: v.optional(v.number()),
    isPaused: v.optional(v.boolean()),
    lastResumedAt: v.optional(v.number()),
    pausedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_test_set", ["userId", "testSetId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_test_set_status", ["userId", "testSetId", "status"])
    // Enables newest-first paginated result history without client-side sort.
    .index("by_user_submitted", ["userId", "submittedAt"])
    .index("by_user_completed", ["userId", "completedAt"])
    .index("by_test_set", ["testSetId"])
    .index("by_test_set_status", ["testSetId", "status"])
    .index("by_status", ["status"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    questionId: v.id("questions"),
    subjectId: v.optional(v.id("subjects")),
    topicId: v.optional(v.id("topics")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_question", ["userId", "questionId"])
    .index("by_user_subject", ["userId", "subjectId"])
    .index("by_user_topic", ["userId", "topicId"]),

  wrongQuestions: defineTable({
    userId: v.id("users"),
    questionId: v.id("questions"),
    subjectId: v.optional(v.id("subjects")),
    topicId: v.optional(v.id("topics")),
    lastMissedAt: v.number(),
    missCount: v.number(),
    resolved: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_question", ["userId", "questionId"])
    .index("by_user_last_missed", ["userId", "lastMissedAt"])
    .index("by_user_subject", ["userId", "subjectId"])
    .index("by_user_topic", ["userId", "topicId"])
    .index("by_user_resolved", ["userId", "resolved"])
    .index("by_user_subject_resolved", ["userId", "subjectId", "resolved"]),

  // Lightweight metadata & structured content storage for Notes System
  // Binary PDFs and images are static assets in public/notes/...
  topicNotes: defineTable({
    topicId: v.id("topics"),
    subjectId: v.id("subjects"),
    slug: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    pdfPath: v.optional(v.string()),
    hasPdf: v.boolean(),
    images: v.optional(
      v.array(
        v.object({
          id: v.string(),
          src: v.string(),
          alt: v.string(),
          caption: v.optional(v.string()),
          title: v.optional(v.string()),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
        }),
      ),
    ),
    content: v.optional(v.string()), // Structured JSON document string
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_topic", ["topicId"])
    .index("by_subject", ["subjectId"])
    .index("by_slug", ["slug"])
    .index("by_subject_slug", ["subjectId", "slug"]),
});


