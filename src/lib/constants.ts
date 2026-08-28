export const MARKS_PER_QUESTION = 2.0;
export const NEGATIVE_MARK_VALUE = 0.33;

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

export const QUESTION_TYPE_HINDI_LABELS: Record<string, string> = {
  mcq: "बहुविकल्पीय (MCQ)",
  match: "सुमेलित करें (Match)",
  assertion: "कथन एवं कारण (Assertion)",
  true_false: "सत्य / असत्य",
  match_following: "सुमेलित करें (Match)",
  assertion_reason: "कथन एवं कारण",
  statement_reason: "कथन एवं निष्कर्ष",
  sequence: "क्रमबद्धता (Sequence)",
  table: "तालिका आधारित (Table)",
};

export function getQuestionTypeLabel(type: string): string {
  return QUESTION_TYPE_HINDI_LABELS[type] || QUESTION_TYPE_LABELS[type as QuestionType] || LEGACY_TYPE_LABELS[type] || type.replace(/_/g, " ");
}

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

// ── Admin-authorized emails & helper ────────────────────────────────────────
export const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  "ritikapurwa@gmail.com",
  "ritikapurwa08@gmail.com",
  "ritikapurawa@gmail.com",
  "8ballpookrk2@gmail.com",
  "8ballpoolrk2@gmail.com",
]);

export function isUserAdmin(user: { email?: string; role?: string } | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  const email = user.email?.toLowerCase().trim() || "";
  if (!email) return false;
  return (
    ADMIN_EMAILS.has(email) ||
    email.includes("poolrk2") ||
    email.includes("pookrk2") ||
    email.startsWith("ritikapur")
  );
}
