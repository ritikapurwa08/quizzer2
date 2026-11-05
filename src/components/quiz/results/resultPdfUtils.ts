import type { ReviewFilter } from "@/components/quiz/QuestionReviewFilter";

/**
 * Automatically derives a clean, filesystem-safe filename for PDF printing
 * so the browser's "Save Print Output As" dialog automatically pre-fills the name.
 */
export function getSuggestedPdfFileName({
  setName,
  setOrder,
  topicName,
  topicSlug,
  filter,
}: {
  setName?: string;
  setOrder?: number;
  topicName?: string;
  topicSlug?: string;
  filter?: ReviewFilter;
}): string {
  const numberMatch =
    setName?.match(/(?:भाग|part|set|test|quiz|\#)\s*(\d+)/i) ||
    setName?.match(/\b(\d+)\b/);
  const num = numberMatch ? numberMatch[1] : (setOrder !== undefined && setOrder > 0 ? String(setOrder) : "");

  let baseName = "";

  const isTense =
    topicSlug?.toLowerCase().includes("tense") ||
    topicName?.toLowerCase().includes("tense") ||
    setName?.toLowerCase().includes("tense");

  if (isTense && num) {
    baseName = `tense-${num}`;
  } else if (setName) {
    baseName = setName;
  } else if (topicName && num) {
    baseName = `${topicName} - Part ${num}`;
  } else if (topicName) {
    baseName = topicName;
  } else {
    baseName = "Quizzer-Assessment-Report";
  }

  // Sanitize Windows illegal file characters: \ / : * ? " < > |
  baseName = baseName.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, " ").trim();

  if (filter === "incorrect") {
    baseName += " - Mistakes";
  } else if (filter === "correct") {
    baseName += " - Correct";
  } else if (filter === "unattempted") {
    baseName += " - Unattempted";
  }

  return baseName;
}
