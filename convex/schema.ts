import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // --------------------------------------------------------------------------
  // USER AUTHENTICATION & PROFILES
  // --------------------------------------------------------------------------
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("student"))),
  }).index("by_email", ["email"]),

  // --------------------------------------------------------------------------
  // 4-LEVEL SYLLABUS HIERARCHY
  // --------------------------------------------------------------------------
  // Level 1: Categories (Rajasthan GK, General English, India GK)
  categories: defineTable({
    name: v.string(),
    nameHindi: v.optional(v.string()),
    slug: v.string(),
    order: v.number(),
    description: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  // Level 2: Subjects (Geography, History, Art & Culture, Polity, English)
  subjects: defineTable({
    categoryId: v.optional(v.id("categories")),
    name: v.string(),
    nameHindi: v.optional(v.string()),
    slug: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"]),

  // Level 3: Topics (55 Rajasthan GK + 33 English topics)
  topics: defineTable({
    subjectId: v.id("subjects"),
    name: v.string(),
    nameHindi: v.optional(v.string()),
    slug: v.string(),
    order: v.number(),
    masterTopicId: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
  })
    .index("by_subject", ["subjectId"])
    .index("by_slug", ["slug"])
    .index("by_subject_slug", ["subjectId", "slug"])
    .index("by_archived", ["isArchived"]),

  // Level 4: SubTopics (Conceptual fine-grained sub-topics)
  subTopics: defineTable({
    topicId: v.id("topics"),
    subjectId: v.optional(v.id("subjects")),
    name: v.string(),
    nameHindi: v.optional(v.string()),
    slug: v.optional(v.string()),
    order: v.number(),
  })
    .index("by_topic", ["topicId"])
    .index("by_subject", ["subjectId"]),

  // --------------------------------------------------------------------------
  // QUESTION POOLS & SETS
  // --------------------------------------------------------------------------
  // Regenerated, well-ordered quiz sets
  quizSets: defineTable({
    topicId: v.id("topics"),
    subTopicId: v.optional(v.union(v.id("subTopics"), v.string())),
    subjectId: v.optional(v.id("subjects")),
    categoryId: v.optional(v.id("categories")),
    name: v.string(),
    order: v.number(),
    negativeMarking: v.boolean(),
    questionCount: v.number(),
    durationMinutes: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
  })
    .index("by_topic", ["topicId"])
    .index("by_subTopic", ["subTopicId"])
    .index("by_subject", ["subjectId"]),

  // Live, curated, and validated questions
  publishedQuestions: defineTable({
    legacyId: v.string(),
    categoryId: v.optional(v.id("categories")),
    subjectId: v.optional(v.id("subjects")),
    topicId: v.optional(v.id("topics")),
    subTopicId: v.optional(v.union(v.id("subTopics"), v.string())),
    setId: v.optional(v.id("quizSets")),
    questionText: v.string(),
    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
      })
    ),
    correctAnswer: v.string(),
    correctIndex: v.optional(v.number()),
    explanation: v.string(),
    difficulty: v.optional(v.string()),
    exam: v.optional(v.string()),
    year: v.optional(v.number()),
    meta: v.optional(v.any()),
  })
    .index("by_legacyId", ["legacyId"])
    .index("by_topic", ["topicId"])
    .index("by_subTopic", ["subTopicId"])
    .index("by_subject", ["subjectId"])
    .index("by_category", ["categoryId"])
    .index("by_set", ["setId"]),

  // Draft / unverified question staging pool
  unusedQuestionsPool: defineTable({
    legacyId: v.string(),
    categoryId: v.optional(v.id("categories")),
    subjectId: v.optional(v.id("subjects")),
    topicId: v.optional(v.id("topics")),
    questionText: v.string(),
    options: v.array(v.string()),
    answer: v.string(),
    status: v.union(v.literal("draft"), v.literal("rejected"), v.literal("promoted")),
    meta: v.optional(v.any()),
  })
    .index("by_legacyId", ["legacyId"])
    .index("by_topic", ["topicId"])
    .index("by_status", ["status"]),

  // --------------------------------------------------------------------------
  // USER ATTEMPTS, CONSOLIDATED STATES & LIGHTWEIGHT COUNTERS
  // --------------------------------------------------------------------------
  testAttempts: defineTable({
    userId: v.id("users"),
    quizSetId: v.optional(v.id("quizSets")),
    testSetId: v.optional(v.string()),
    startedAt: v.number(),
    submittedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    score: v.optional(v.number()),
    totalQuestions: v.number(),
    status: v.union(v.literal("in_progress"), v.literal("submitted")),
    totalDurationSeconds: v.optional(v.number()),
    elapsedSeconds: v.optional(v.number()),
    isPaused: v.optional(v.boolean()),
    lastResumedAt: v.optional(v.number()),
    pausedAt: v.optional(v.number()),
    answers: v.array(
      v.object({
        questionId: v.string(),
        selected: v.optional(v.union(v.string(), v.array(v.string()))),
        isCorrect: v.optional(v.boolean()),
        isOrphanedOrRemoved: v.optional(v.boolean()),
      })
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_submitted", ["userId", "submittedAt"])
    .index("by_quiz_set", ["quizSetId"])
    .index("by_test_set", ["testSetId"]),

  // Consolidated bookmark & incorrect question states
  userQuestionStates: defineTable({
    userId: v.id("users"),
    questionId: v.string(),
    isSaved: v.boolean(),
    isIncorrect: v.boolean(),
    attemptCount: v.number(),
    lastAttemptedAt: v.number(),
    subjectId: v.optional(v.id("subjects")),
    topicId: v.optional(v.id("topics")),
    subTopicId: v.optional(v.union(v.id("subTopics"), v.string())),
    isOrphanedOrRemoved: v.optional(v.boolean()),
  })
    .index("by_user_question", ["userId", "questionId"])
    .index("by_user_saved", ["userId", "isSaved"])
    .index("by_user_incorrect", ["userId", "isIncorrect"])
    .index("by_user_topic", ["userId", "topicId"])
    .index("by_user_saved_topic", ["userId", "isSaved", "topicId"])
    .index("by_user_saved_subject", ["userId", "isSaved", "subjectId"])
    .index("by_user_incorrect_topic", ["userId", "isIncorrect", "topicId"])
    .index("by_user_incorrect_subject", ["userId", "isIncorrect", "subjectId"]),

  // 1-read dashboard stats counter document
  userStats: defineTable({
    userId: v.id("users"),
    totalSaved: v.number(),
    totalIncorrect: v.number(),
    totalTests: v.number(),
    totalQuestionsAttempted: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // --------------------------------------------------------------------------
  // ROUTE-SPECIFIC READ-OPTIMIZED TABLES / MATERIALIZED VIEWS (FREE-TIER DEFENSE)
  // --------------------------------------------------------------------------
  // 1. /dashboard: Ultra-fast 1-doc user stats (< 0.1ms read)
  dashboardStats: defineTable({
    userId: v.id("users"),
    questionsSolved: v.number(),
    overallAccuracy: v.number(),
    bookmarkCount: v.number(),
    wrongQuestionCount: v.number(),
    currentStreak: v.number(),
    bestStreak: v.number(),
    testsAttempted: v.number(),
    totalScore: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // 2. /dashboard & /subjects: Global syllabus catalog summary (Single app-wide singleton doc)
  globalCatalogSummary: defineTable({
    singletonKey: v.string(), // "global"
    totalSets: v.number(),
    totalQuestions: v.number(),
    totalPublishedQuestions: v.number(),
    totalUnusedQuestions: v.number(),
    subjectBreakdown: v.array(
      v.object({
        subjectId: v.optional(v.string()),
        subjectSlug: v.string(),
        subjectName: v.string(),
        totalSets: v.number(),
        totalQuestions: v.number(),
        totalTopics: v.number(),
      })
    ),
    updatedAt: v.number(),
  }).index("by_singletonKey", ["singletonKey"]),

  // 3. /dashboard: Pre-computed continue practice & recent attempts feed (1 doc per user)
  userDashboardFeed: defineTable({
    userId: v.id("users"),
    continuePractice: v.array(
      v.object({
        setId: v.string(),
        setName: v.string(),
        topicId: v.string(),
        topicName: v.string(),
        subjectId: v.optional(v.string()),
        subjectName: v.optional(v.string()),
        subTopicId: v.optional(v.string()),
        subTopicName: v.optional(v.string()),
        questionCount: v.number(),
        lastAttemptScore: v.optional(v.number()),
        lastAttemptedAt: v.optional(v.number()),
        status: v.string(), // "in_progress" | "not_started" | "completed"
      })
    ),
    recentAttempts: v.array(
      v.object({
        attemptId: v.string(),
        testSetId: v.string(),
        testSetName: v.string(),
        topicId: v.optional(v.string()),
        topicName: v.optional(v.string()),
        score: v.number(),
        totalQuestions: v.number(),
        correctCount: v.number(),
        accuracy: v.number(),
        submittedAt: v.number(),
      })
    ),
    setOverlapMap: v.optional(v.any()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // 4. /saved-questions & /bookmarks: Pre-computed counts per subject and topic (1 doc per user)
  userFilterCounts: defineTable({
    userId: v.id("users"),
    savedCount: v.number(),
    incorrectCount: v.number(),
    savedBySubject: v.array(
      v.object({
        subjectId: v.string(),
        subjectName: v.string(),
        count: v.number(),
      })
    ),
    savedByTopic: v.array(
      v.object({
        topicId: v.string(),
        topicName: v.string(),
        subjectId: v.optional(v.string()),
        count: v.number(),
      })
    ),
    incorrectBySubject: v.array(
      v.object({
        subjectId: v.string(),
        subjectName: v.string(),
        count: v.number(),
      })
    ),
    incorrectByTopic: v.array(
      v.object({
        topicId: v.string(),
        topicName: v.string(),
        subjectId: v.optional(v.string()),
        count: v.number(),
      })
    ),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // 5. /analytics: Pre-computed charts and performance metrics snapshot (1 doc per user)
  analyticsSnapshots: defineTable({
    userId: v.id("users"),
    overallAccuracy: v.number(),
    questionsSolved: v.number(),
    testsAttempted: v.number(),
    currentStreak: v.number(),
    bestStreak: v.number(),
    subjectMastery: v.array(
      v.object({
        subjectId: v.string(),
        subjectName: v.string(),
        accuracy: v.number(),
        totalAnswered: v.number(),
        correct: v.number(),
        incorrect: v.number(),
      })
    ),
    weakAreas: v.array(
      v.object({
        topicId: v.string(),
        topicName: v.string(),
        subjectName: v.optional(v.string()),
        accuracy: v.number(),
        totalAttempted: v.number(),
        incorrect: v.number(),
      })
    ),
    dailyActivity: v.array(
      v.object({
        date: v.string(),
        testsCount: v.number(),
        questionsCount: v.number(),
        correctCount: v.number(),
        accuracy: v.number(),
      })
    ),
    hourlyActivity: v.array(
      v.object({
        hour: v.number(),
        hourLabel: v.string(),
        tests: v.number(),
        correct: v.number(),
        incorrect: v.number(),
        total: v.number(),
      })
    ),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // --------------------------------------------------------------------------
  // LEGACY TABLES PRESERVED FOR ZERO-DOWNTIME BACKWARD COMPATIBILITY
  // --------------------------------------------------------------------------
  testSets: defineTable({
    topicId: v.id("topics"),
    subTopicId: v.optional(v.string()),
    subTopic: v.optional(v.string()),
    name: v.string(),
    order: v.number(),
    negativeMarking: v.boolean(),
    questionCount: v.number(),
    durationMinutes: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
  })
    .index("by_topic", ["topicId"])
    .index("by_topic_subtopic", ["topicId", "subTopicId"]),

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
        isOrphanedOrRemoved: v.optional(v.boolean()),
      })
    ),
    score: v.optional(v.number()),
    totalQuestions: v.number(),
    status: v.union(v.literal("in_progress"), v.literal("submitted")),
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
        })
      )
    ),
    content: v.optional(v.string()),
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_topic", ["topicId"])
    .index("by_subject", ["subjectId"])
    .index("by_slug", ["slug"])
    .index("by_subject_slug", ["subjectId", "slug"]),

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
