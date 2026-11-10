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

  attempts: defineTable({
    userId: v.id("users"),
    testSetId: v.id("testSets"),
    startedAt: v.number(),
    submittedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    answers: v.array(
      v.object({
        questionId: v.string(),
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
    questionId: v.string(),
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
    questionId: v.string(),
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

  // Lightweight audit flags for questions (Admin-only, minimal footprint)
  flaggedQuestions: defineTable({
    userId: v.id("users"),
    questionId: v.string(),
    testSetId: v.optional(v.string()),
    questionNumber: v.optional(v.number()),
    flagType: v.union(
      v.literal("wrong_answer"),
      v.literal("duplicate"),
      v.literal("similar"),
      v.literal("formatting")
    ),
    note: v.optional(v.string()),
    flaggedAt: v.number(),
  })
    .index("by_question", ["questionId"])
    .index("by_user", ["userId"])
    .index("by_user_question", ["userId", "questionId"])
    .index("by_flag_type", ["flagType"])
    .index("by_flagged_at", ["flaggedAt"]),
});
