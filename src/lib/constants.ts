export const NEGATIVE_MARK_VALUE = 0.25;

export const QUESTION_TYPES = [
  "mcq",
  "statement_reason",
  "match_following",
  "table",
  "assertion_reason",
  "sequence",
  "true_false",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Standard MCQ",
  statement_reason: "Statement & Reason",
  match_following: "Match the Following",
  table: "Table-Based",
  assertion_reason: "Assertion-Reason",
  sequence: "Sequence / Ordering",
  true_false: "True / False",
};

// SRD Section 13 — minimum tap target size for mobile.
export const MIN_TAP_TARGET_PX = 44;
