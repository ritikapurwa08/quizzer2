import { v } from "convex/values";

/** Shared Convex validators mirroring the JSON import spec (SRD Section 8). */

export const questionTypeValidator = v.union(
  v.literal("mcq"),
  v.literal("statement_reason"),
  v.literal("match_following"),
  v.literal("table"),
  v.literal("assertion_reason"),
  v.literal("sequence"),
  v.literal("true_false"),
);

export const difficultyValidator = v.union(
  v.literal("easy"),
  v.literal("medium"),
  v.literal("hard"),
);

export const optionValidator = v.object({
  id: v.string(),
  text: v.string(),
});

export const questionInputValidator = v.object({
  type: questionTypeValidator,
  questionText: v.string(),
  options: v.array(optionValidator),
  correctAnswer: v.union(v.string(), v.array(v.string())),
  explanation: v.optional(v.string()),
  reference: v.optional(v.string()),
  difficulty: difficultyValidator,
  meta: v.optional(v.any()),
});
