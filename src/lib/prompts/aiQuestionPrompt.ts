import { RAJASTHAN_GK_MASTER_SECTIONS } from "../constants/rajasthanGkMasterTopics";

export interface PromptOptions {
  subject: string;
  topic: string;
  setName: string;
  questionCount?: number;
}

/**
 * Text representation of the 73 Authoritative Rajasthan GK Master Topics.
 * Used for Gemini system context and AI prompt injection.
 */
export const RAJASTHAN_GK_MASTER_TOPICS_PROMPT_TEXT = RAJASTHAN_GK_MASTER_SECTIONS.map(
  (s) =>
    `### ${s.code}. ${s.titleHindi} (${s.titleEnglish})\n` +
    s.topics.map((t) => `${t.id}. ${t.nameHindi} (${t.name})`).join("\n")
).join("\n\n");

export function generateAiQuestionPrompt({
  subject,
  topic,
  setName,
  questionCount = 20,
}: PromptOptions): string {
  return `You are generating one question set for a competitive-exam question bank.

AUTHORITATIVE RAJASTHAN GK MASTER SYLLABUS CONTRACT:
- This question bank is strictly and exclusively dedicated to Rajasthan GK (73 Master Topics).
- Do NOT mix India GK, World GK, English, or non-Rajasthan questions.
- Every question must be directly grounded in the selected Rajasthan GK topic.

SUBJECT: ${subject}
TOPIC: ${topic}
CURRENT SET: ${setName}
TARGET COUNT: ${questionCount}

SOURCE RULES
- Use the attached Google Drive source ZIP as the source material.
- Locate the material for the selected topic and CURRENT SET only.
- Do not use material belonging to another set.
- Do not copy, paraphrase, lightly rewrite, merge, or reuse a question from an earlier set.
- Treat previous sets as already used and unavailable.
- Do not search the web or YouTube.
- Do not add links, citations, source IDs, fake exam names, or fake exam years.

QUESTION RULES
- Produce exactly ${questionCount} questions when ${questionCount} genuine source-based questions are available.
- Every question must be directly relevant to the selected topic and current set.
- Every question must be a genuine multiple-choice question with exactly 4 substantive options.
- Exactly one option must be correct.
- Keep questions distinct from one another.
- Include a concise explanation based on the source when useful.

FINAL-SET RULE
If the current set contains fewer than ${questionCount} genuine source-based questions:
- First state: Genuine source questions available: N
- Include all available genuine source-based questions.
- Generate only the missing number as clearly labeled AI-generated questions.
- Never present an AI-generated question as a PYQ, real exam question, or sourced question.

OUTPUT RULES
- Return Markdown only.
- Do not return JSON.
- Do not return code fences.
- Do not add an introduction or conclusion.
- Use exactly this structure:

### 1. Question text
A. Option
B. Option
C. Option
D. Option
**Answer:** B
**Explanation:** Brief explanation

Continue numbering sequentially to ${questionCount}.

Before the first question, if fewer than ${questionCount} genuine source questions exist, write only:
Genuine source questions available: N

Never invent missing source questions. Never reuse a question from another set.`;
}

export const generateAiPrompt = generateAiQuestionPrompt;
