import { z } from "zod";

/** Client-side mirror of convex/lib/validators.ts, used by the JSON import wizard.
 *  Supports both v2 canonical types and the new minified AI prompt schema:
 *    q → questionText, o → options[], a → correctAnswer index (0-3), e → explanation, t → type
 */

export const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

// All accepted type strings (v2 canonical + legacy aliases)
export const questionTypeSchema = z.enum([
  "mcq",
  "match",
  "assertion",
  "true_false",
  // legacy aliases — kept for backward compat
  "match_following",
  "assertion_reason",
  "statement_reason",
  "sequence",
  "table",
]);

export type AcceptedQuestionType = z.infer<typeof questionTypeSchema>;

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
    const needsOptions = ["mcq", "true_false", "assertion", "assertion_reason", "statement_reason"];
    if (needsOptions.includes(q.type) && q.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Question type "${q.type}" requires at least one option`,
        path: ["options"],
      });
    }

    if (typeof q.correctAnswer === "string" && needsOptions.includes(q.type)) {
      const validIds = q.options.map((o) => o.id);
      if (validIds.length > 0 && !validIds.includes(q.correctAnswer)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `correctAnswer "${q.correctAnswer}" not found in options`,
          path: ["correctAnswer"],
        });
      }
    }

    if ((q.type === "match" || q.type === "match_following") && !(q.meta?.columnA || q.meta?.left)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `match requires meta.left and meta.right (or meta.columnA and meta.columnB)`,
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

// ── Minified JSON key mapping (new AI prompt schema) ────────────────────────
// Maps: q→questionText, o→options, a→correctAnswer index, e→explanation, t→type
const MINIFIED_INDEX_TO_OPT: Record<number, string> = {
  0: "opt1",
  1: "opt2",
  2: "opt3",
  3: "opt4",
};

const MINIFIED_TYPE_MAP: Record<string, AcceptedQuestionType> = {
  mcq: "mcq",
  match: "match",
  match_following: "match",
  assertion: "assertion",
  assertion_reason: "assertion",
  statement_reason: "assertion",
  true_false: "true_false",
  sequence: "mcq", // downgrade to mcq safely
  table: "mcq",    // downgrade to mcq safely
};

/** Converts a raw minified AI output question object to standard QuestionInput.
 *  Handles both minified keys (q/o/a/e/t) and full keys (questionText/options/etc.).
 */
export function normalizeMinifiedQuestion(raw: Record<string, any>): QuestionInput | null {
  try {
    // Detect minified format by presence of 'q' key
    const isMinified = "q" in raw && !("questionText" in raw);

    const questionText: string = isMinified
      ? String(raw.q ?? "").trim()
      : String(raw.questionText ?? "").trim();

    if (!questionText) return null;

    // Options: minified = string[], full = {id, text}[]
    let options: { id: string; text: string }[] = [];
    if (isMinified && Array.isArray(raw.o)) {
      options = raw.o.slice(0, 4).map((text: any, i: number) => ({
        id: `opt${i + 1}`,
        text: String(text ?? "").trim(),
      }));
    } else if (Array.isArray(raw.options)) {
      options = raw.options.map((o: any, i: number) => ({
        id: o.id || `opt${i + 1}`,
        text: String(o.text ?? "").trim(),
      }));
    }

    // Pad to 4 options
    while (options.length < 4) {
      options.push({ id: `opt${options.length + 1}`, text: `Option ${options.length + 1}` });
    }

    // Correct answer: minified = integer index 0-3, full = "opt1" etc.
    let correctAnswer: string = "opt1";
    if (isMinified && typeof raw.a === "number") {
      correctAnswer = MINIFIED_INDEX_TO_OPT[raw.a] ?? "opt1";
    } else if (typeof raw.correctAnswer === "string") {
      correctAnswer = raw.correctAnswer;
    }

    // Type: map minified or legacy type to canonical
    const rawType: string = isMinified
      ? String(raw.t ?? "mcq").toLowerCase()
      : String(raw.type ?? "mcq").toLowerCase();
    const type: AcceptedQuestionType = MINIFIED_TYPE_MAP[rawType] ?? "mcq";

    const explanation: string | undefined = isMinified
      ? (raw.e ? String(raw.e).trim() : undefined)
      : (raw.explanation ? String(raw.explanation).trim() : undefined);

    const difficulty = (raw.difficulty as "easy" | "medium" | "hard") ?? "medium";

    // Meta handling for match type
    let meta: any = raw.meta ?? undefined;
    if ((type === "match" || type === "match_following") && !meta?.left && !meta?.columnA) {
      meta = { left: [], right: [] };
    }

    return {
      type,
      questionText,
      options,
      correctAnswer,
      explanation,
      reference: raw.reference,
      difficulty,
      meta,
    };
  } catch {
    return null;
  }
}
