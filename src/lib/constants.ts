export const MARKS_PER_QUESTION = 2.0;
/** Canonical RPSC negative marking ratio: 1/3 mark penalty per incorrect answer */
export const NEGATIVE_PENALTY_RATIO = 1 / 3;
export const NEGATIVE_MARK_VALUE = MARKS_PER_QUESTION / 3;
export const NEGATIVE_MARK_DISPLAY = (MARKS_PER_QUESTION / 3).toFixed(2); // "0.66"

// ── Supported question types (Strict Canonical Set of 6) ───────────────────
export const QUESTION_TYPES = [
  "mcq",
  "match_following",
  "assertion_reason",
  "statement_reason",
  "sequence",
  "table",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "MCQ",
  match_following: "Match the Following",
  assertion_reason: "Assertion–Reason",
  statement_reason: "Statement–Reason",
  sequence: "Sequence / Ordering",
  table: "Table-based Question",
};

export const QUESTION_TYPE_HINDI_LABELS: Record<QuestionType, string> = {
  mcq: "बहुविकल्पीय (MCQ)",
  match_following: "सुमेलित करें (Match the Following)",
  assertion_reason: "कथन एवं कारण (Assertion–Reason)",
  statement_reason: "कथन एवं निष्कर्ष (Statement–Reason)",
  sequence: "क्रमबद्धता (Sequence / Ordering)",
  table: "तालिका आधारित (Table-based Question)",
};

export function getQuestionTypeLabel(type: string): string {
  return (
    QUESTION_TYPE_HINDI_LABELS[type as QuestionType] ||
    QUESTION_TYPE_LABELS[type as QuestionType] ||
    type.replace(/_/g, " ")
  );
}

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
