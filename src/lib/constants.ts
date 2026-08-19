export const NEGATIVE_MARK_VALUE = 0.25;

// ── Supported question types (v2) ──────────────────────────────────────────
// Only these 4 types are in the codebase. Legacy aliases from older schema
// (match_following, assertion_reason, statement_reason, sequence, table) are
// mapped back to these in the import parser and renderers for backward compatibility.
export const QUESTION_TYPES = [
  "mcq",
  "match",
  "assertion",
  "true_false",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Standard MCQ",
  match: "Match the Following",
  assertion: "Assertion & Reason",
  true_false: "True / False",
};

// Backward-compat display names for legacy types still persisted in DB
export const LEGACY_TYPE_LABELS: Record<string, string> = {
  match_following: "Match the Following",
  assertion_reason: "Assertion & Reason",
  statement_reason: "Statement & Reason",
  sequence: "Sequence / Ordering",
  table: "Table-Based",
};

// SRD Section 13 — minimum tap target size for mobile.
export const MIN_TAP_TARGET_PX = 44;

// ── Admin-authorized emails ────────────────────────────────────────────────
export const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  "ritikapurwa@gmail.com",
  "8ballpookrk2@gmail.com",
]);
