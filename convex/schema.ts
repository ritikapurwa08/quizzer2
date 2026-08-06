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
    type: v.union(
      v.literal("mcq"),
      v.literal("statement_reason"),
      v.literal("match_following"),
      v.literal("table"),
      v.literal("assertion_reason"),
      v.literal("sequence"),
      v.literal("true_false"),
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
    .index("by_user_test_set", ["userId", "testSetId"]),

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
    .index("by_user_question", ["userId", "questionId"]),
});
