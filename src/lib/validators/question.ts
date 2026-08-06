import { z } from "zod";

/** Client-side mirror of convex/lib/validators.ts, used by the JSON import wizard. */

export const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const questionTypeSchema = z.enum([
  "mcq",
  "statement_reason",
  "match_following",
  "table",
  "assertion_reason",
  "sequence",
  "true_false",
]);

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const questionSchema = z
  .object({
    type: questionTypeSchema,
    questionText: z.string().min(1, "questionText is required"),
    options: z.array(optionSchema),
    correctAnswer: z.union([z.string(), z.array(z.string())]),
    explanation: z.string().optional(),
    reference: z.string().optional(),
    difficulty: difficultySchema,
    meta: z.any().optional(),
  })
  .superRefine((q, ctx) => {
    const needsOptions = ["mcq", "true_false", "assertion_reason", "statement_reason"];
    if (needsOptions.includes(q.type) && q.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Question type "${q.type}" requires at least one option`,
        path: ["options"],
      });
    }

    if (typeof q.correctAnswer === "string" && needsOptions.includes(q.type)) {
      const validIds = q.options.map((o) => o.id);
      if (!validIds.includes(q.correctAnswer)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `correctAnswer "${q.correctAnswer}" not found in options`,
          path: ["correctAnswer"],
        });
      }
    }

    if (q.type === "match_following" && !(q.meta?.columnA || q.meta?.left)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `match_following requires meta.left and meta.right (or meta.columnA and meta.columnB)`,
        path: ["meta"],
      });
    }

    if (q.type === "sequence" && !q.meta?.items) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `sequence requires meta.items`,
        path: ["meta"],
      });
    }
  });

export const importObjectSchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  testSet: z.string().optional(),
  negativeMarking: z.boolean().optional(),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
});

export const importArraySchema = z.array(questionSchema).min(1, "At least one question is required");

export const importJsonSchema = z.union([
  importArraySchema.transform((questions) => ({
    subject: undefined,
    topic: undefined,
    testSet: undefined,
    negativeMarking: undefined,
    questions,
  })),
  importObjectSchema,
]);

export type ImportJson = {
  subject?: string;
  topic?: string;
  testSet?: string;
  negativeMarking?: boolean;
  questions: z.infer<typeof questionSchema>[];
};
export type QuestionInput = z.infer<typeof questionSchema>;
