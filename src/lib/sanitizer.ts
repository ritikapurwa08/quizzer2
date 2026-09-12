/**
 * LLM Citation & Artifact Sanitizer
 *
 * Automatically and safely strips Gemini citation markers, search grounding spans,
 * and footnote artifacts from JSON questions before schema validation and import.
 *
 * Examples of sanitized artifacts:
 * - [cite: 1], [cite: 11], [cite : 1], [cite:11], [cite: 1, 11]
 * - [citation: 1], [source: 2]
 * - [span_1], [span-1]
 * - <citation id="...">...</citation>, <citation/>
 *
 * CRITICAL RULE:
 * Preserves all legitimate brackets in question text (e.g. "(1722 मीटर)", "[कथन 1]", "(A) और (B)").
 * Only removes explicitly matching citation artifact patterns.
 */

const KNOWN_CITATION_PATTERNS: RegExp[] = [
  /\[\s*cite\s*:\s*[\d,\s]+\s*\]/gi,
  /\[\s*citation\s*:\s*[\d,\s]+\s*\]/gi,
  /\[\s*source\s*:\s*[\d,\s]+\s*\]/gi,
  /\[\s*span[_-][\w-]+\s*\]/gi,
  /<citation(?:\s+[^>]*)?>.*?<\/citation>/gi,
  /<citation(?:\s+[^>]*)?\/>/gi,
];

/**
 * Sanitizes a single string by stripping known Gemini citation markers.
 * Cleans up resulting whitespace without altering legitimate punctuation.
 */
export function sanitizeStringArtifacts(text: string): string {
  if (!text || typeof text !== "string") return text;

  let cleaned = text;
  for (const pattern of KNOWN_CITATION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Remove space immediately preceding standard Hindi/English punctuation marks
  // e.g. "कहाँ स्थित है ? " -> "कहाँ स्थित है?"
  cleaned = cleaned.replace(/[ \t]+([।,?!;:])/g, "$1");

  // Collapse multiple consecutive horizontal spaces/tabs created by removed citations
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");

  // Trim each line and outer whitespace
  if (cleaned.includes("\n")) {
    return cleaned
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim();
  }

  return cleaned.trim();
}

/**
 * Recursively traverses and sanitizes strings in an object, array, or primitive.
 * Safe to run on raw text, minified question objects, full question schemas, or option arrays.
 */
export function sanitizeLlmArtifacts<T = unknown>(target: T): T {
  if (target === null || target === undefined) return target;

  if (typeof target === "string") {
    return sanitizeStringArtifacts(target) as unknown as T;
  }

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeLlmArtifacts(item)) as unknown as T;
  }

  if (typeof target === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(target)) {
      result[key] = sanitizeLlmArtifacts(value);
    }
    return result as unknown as T;
  }

  return target;
}
