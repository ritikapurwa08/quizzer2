import { PyqQuestion, formatPyqsForPrompt } from "@/lib/pyqTypes";

export interface PromptOptions {
  subject: string;
  topic: string;
  subtopic?: string;
  count?: number;

  /**
   * User supplied notes / PDFs / official material.
   * Used only as supporting factual context.
   */
  referenceText?: string;

  /**
   * Retrieved genuine examination questions.
   * These are the PRIMARY question source.
   */
  pyqReferences?: PyqQuestion[];

  /**
   * Retrieval statistics.
   */
  pyqStats?: {
    totalFound: number;
    sent: number;
    usedCount?: number;
    remainingCount?: number;
    batchNumber?: number;
  };

  /**
   * Source question IDs already used for this topic.
   */
  usedQuestionIds?: number[];

  /**
   * Existing YouTube references, if any.
   */
  selectedYouTubeVideos?: string[] | string;

  /**
   * If true, PYQs are supplied separately to the model.
   */
  promptOnly?: boolean;
}

export function generateAiQuestionPrompt(options: PromptOptions): string {
  const {
    subject = "Rajasthan General Knowledge",
    topic = "General Topic",
    subtopic,
    count = 20,
    referenceText,
    pyqReferences = [],
    pyqStats,
    usedQuestionIds = [],
    selectedYouTubeVideos,
    promptOnly = false,
  } = options;

  const targetCount =
    Number.isInteger(count) && count > 0 ? count : 20;

  const hasPyqs = pyqReferences.length > 0;

  const usedIds = Array.isArray(usedQuestionIds)
    ? usedQuestionIds.filter(
      (id) => typeof id === "number" && Number.isFinite(id)
    )
    : [];

  const usedIdsBlock = `
============================================================
PREVIOUSLY USED SOURCE QUESTION IDs
============================================================

The following sourceQuestionIds have already been used for this topic:

[${usedIds.join(", ")}]

STRICT RULES:
- NEVER reuse any ID from this list.
- Every selected PYQ must come from the newly supplied PYQ pool.
- Preserve the original sourceQuestionId.
- Do not invent sourceQuestionIds.
- If an ID is unavailable or uncertain, do not use that question.
============================================================
`;

  const videosList = Array.isArray(selectedYouTubeVideos)
    ? selectedYouTubeVideos.filter(
      (v) => typeof v === "string" && v.trim()
    )
    : typeof selectedYouTubeVideos === "string" &&
      selectedYouTubeVideos.trim()
      ? [selectedYouTubeVideos.trim()]
      : [];

  const formattedVideos = videosList
    .map((v, i) => {
      const value = v.trim();
      return /^\d+[\.\)]/.test(value)
        ? value
        : `${i + 1}. ${value}`;
    })
    .join("\n");

  const referenceBlock = referenceText
    ? `
============================================================
USER-SUPPLIED STUDY / REFERENCE MATERIAL
============================================================

The following PDF/text is supporting reference material.

Use it to:
- verify facts
- understand terminology
- improve explanations
- correct obvious language problems
- understand the syllabus boundary

IMPORTANT:
The supplied examination/PYQ data remains the PRIMARY source
for questions.

Do NOT manufacture an examination question merely because the
reference material contains additional information.

REFERENCE MATERIAL:
${referenceText}

============================================================
END REFERENCE MATERIAL
============================================================
`
    : "";

  const pyqBlock = promptOnly
    ? `
============================================================
ORIGINAL PYQ DATA — PROVIDED SEPARATELY
============================================================

Selected Subject: ${subject}
Selected Topic: ${topic}
${subtopic ? `Selected Sub-topic: ${subtopic}` : ""}

${pyqStats
      ? `Corpus Statistics:
Total Topic PYQs: ${pyqStats.totalFound}
Current Batch: ${pyqStats.sent}
Previously Used: ${pyqStats.usedCount ?? 0}
Remaining Unused: ${pyqStats.remainingCount ?? "unknown"}`
      : ""
    }

The authentic PYQ pool for this topic is being supplied
separately.

Use ONLY those supplied PYQs as the question source.

There is NO requirement to generate a fixed number of AI_NEW
questions.

If fewer than ${targetCount} valid unique PYQs are available,
return only the valid available PYQs.

NEVER create artificial questions merely to reach ${targetCount}.
============================================================
`
    : hasPyqs
      ? `
============================================================
ORIGINAL PYQ DATA — PRIMARY QUESTION SOURCE
============================================================

Selected Subject: ${subject}
Selected Topic: ${topic}
${subtopic ? `Selected Sub-topic: ${subtopic}` : ""}

${pyqStats
        ? `Corpus Statistics:
Total Topic PYQs: ${pyqStats.totalFound}
Current Retrieval Batch: ${pyqStats.sent}
Previously Used: ${pyqStats.usedCount ?? 0}
Remaining Unused: ${pyqStats.remainingCount ?? "unknown"}
${pyqStats.batchNumber ? `Batch Number: ${pyqStats.batchNumber}` : ""}`
        : `Supplied PYQ Count: ${pyqReferences.length}`
      }

The following are genuine examination/PYQ records retrieved
from the local corpus.

THESE QUESTIONS ARE THE PRIMARY SOURCE.

Do NOT invent questions to replace them.

============================================================
RETRIEVED PYQ QUESTIONS
============================================================

${formatPyqsForPrompt(pyqReferences)}

============================================================
END RETRIEVED PYQ QUESTIONS
============================================================
`
      : `
============================================================
NO PYQ DATA AVAILABLE
============================================================

No examination questions were supplied for this request.

Do NOT fabricate PYQs.
Do NOT invent exam names.
Do NOT pretend an AI-generated question is a PYQ.

If no genuine PYQs are available, return an empty JSON array.

============================================================
`;

  const youtubeSection =
    videosList.length > 0
      ? `
============================================================
SUPPORTING YOUTUBE MATERIAL
============================================================

${formattedVideos}

These videos are SUPPORTING REFERENCE ONLY.

They are NOT question sources.

Do NOT:
- create a PYQ from a YouTube video
- assign an exam to a video-derived question
- treat YouTube content as an examination source
- output another YouTube list

Use these only when useful for terminology, concepts or
explanation quality.
============================================================
`
      : `
============================================================
YOUTUBE
============================================================

YouTube is NOT required for this PYQ-cleaning task.

Do not search for or output YouTube videos.

============================================================
`;

  return `You are an expert editor and quality-control reviewer
for Rajasthan competitive-examination question banks.

Your task is NOT ordinary question generation.

Your primary task is to take the supplied genuine examination
questions and produce a clean, high-quality, examination-ready
question set.

============================================================
TARGET
============================================================

Subject:
${subject}

Canonical Topic:
${topic}

${subtopic ? `Sub-topic:\n${subtopic}\n` : ""}

Requested maximum questions:
${targetCount}

============================================================
MOST IMPORTANT RULE
============================================================

GENUINE EXAMINATION QUESTIONS HAVE PRIORITY.

Use the supplied PYQ corpus as the PRIMARY and PREFERRED
question source.

There is NO fixed ratio.

There is NO requirement for:
- 16 PYQ + 4 AI_NEW
- 14 PYQ + 4 PYQ_MODIFIED + 2 AI_NEW
- 7:2:1
- 16:4
- any other ratio

AI_NEW generation is DISABLED for this task.

PYQ_MODIFIED is DISABLED as a sourceType.

Do not generate artificial questions simply to reach the
requested count.

If 20 valid PYQs exist, return 20.

If 15 valid PYQs exist, return 15.

If only 8 valid PYQs exist, return 8.

QUALITY AND AUTHENTICITY ARE MORE IMPORTANT THAN COUNT.

============================================================
1. SOURCE AUTHENTICITY
============================================================

Every returned question must originate from the supplied
PYQ data.

For every PYQ:

- preserve its original sourceQuestionId
- preserve the real exam name when available
- never invent an exam name
- never invent a sourceQuestionId
- never convert an AI question into a PYQ
- never use a YouTube question as a PYQ
- never use an ID from the previously-used list

If exam information is missing or unreliable:

"exam": null

Do NOT guess.

============================================================
2. RECENT EXAM PRIORITY
============================================================

When selecting among multiple valid questions covering the
same or closely related factual point:

Prefer, in general:

2025
→ 2024
→ 2023
→ 2022
→ older examinations

However:

DO NOT remove an older PYQ merely because it is old if it
tests a genuinely different examinable fact.

Recency is a SELECTION PRIORITY, not a deletion rule.

Recent does NOT automatically mean correct or higher quality.

============================================================
3. SAME FACT vs DIFFERENT FACT
============================================================

This is a critical rule.

SAME TOPIC does NOT mean SAME QUESTION.

Keep questions when they test genuinely different facts.

Example:

Article 153
Article 154
Article 155
Article 156
Article 159
Article 161

These are different factual points and must NOT be collapsed
merely because they belong to the Governor topic.

REMOVE only when two questions test essentially the SAME
underlying fact.

Changing wording, option order, sentence structure or
question style does NOT make the underlying fact different.

============================================================
4. SEMANTIC DUPLICATE CHECK
============================================================

For every candidate question ask:

"Is this testing the same underlying factual point as another
question in this batch or in the supplied data?"

If YES:
- keep the stronger/cleaner representative
- prefer the more recent genuine exam question
- if dates are similar, prefer better wording/options
- preserve the genuine exam reference

If NO:
- retain it even if the topic is the same.

When uncertain whether two questions test the same fact:

KEEP BOTH.

Do not delete important factual coverage based only on wording
similarity.

============================================================
5. QUESTION QUALITY
============================================================

Check every question individually.

The question must be:

- complete
- understandable
- grammatically acceptable
- naturally written Hindi
- suitable for competitive examination preparation
- factually meaningful
- clearly answerable
- within the canonical topic boundary

Reject or repair obvious:

- corrupted text
- broken sentences
- accidental concatenation
- meaningless wording
- OCR/scraping artifacts
- malformed question stems
- duplicated text
- incomplete statements

============================================================
6. PYQ LANGUAGE POLICY
============================================================

The original examination wording has historical value.

Therefore:

DO NOT unnecessarily rewrite a genuine PYQ.

Preserve the original wording whenever it is already clear.

You MAY make MINIMAL corrections for:

- obvious spelling mistakes
- obvious grammar mistakes
- broken punctuation
- OCR/scraping corruption
- obvious formatting problems
- clearly broken Hindi

Do NOT change:

- factual meaning
- question intent
- correct answer
- underlying fact
- examination context

The final Hindi should feel natural and professional, similar
to a well-written Rajasthan competitive-examination question.

Do NOT make the language unnecessarily literary or complicated.

============================================================
7. OPTIONS
============================================================

Check all four options individually.

Each question should have exactly four meaningful options.

Check:

- all options are complete
- no duplicate options
- no corrupted option
- no accidental merged option
- no option that is obviously nonsense unless the original
  examination question genuinely used it
- options must correspond to the question
- exactly one answer should be correct whenever the source
  question itself supports a single answer

IMPORTANT:

Do not silently change an original option merely because you
prefer another wording.

Make only necessary corrections.

If an option is fundamentally defective and cannot be safely
repaired without changing the original question, mark the
question for removal rather than inventing an option.

============================================================
8. ANSWER VALIDATION
============================================================

The "answer" field must point to the correct option.

Return:

"answer": 0

for the first option,

"answer": 1

for the second,

"answer": 2

for the third,

"answer": 3

for the fourth.

Before outputting:

- verify answer text
- verify answer index
- verify the indexed option actually contains the answer
- ensure no other option is equally correct

If the source question has an ambiguous or demonstrably wrong
answer and it cannot be safely resolved from the supplied
material:

DO NOT guess.

Exclude the question.

============================================================
9. EXPLANATION CHECK
============================================================

Every retained question must have an explanation.

Check:

- explanation answers the question
- explanation agrees with the selected answer
- explanation does not contradict the options
- explanation does not introduce unrelated facts
- explanation does not contain hallucinated information
- explanation does not accidentally belong to another question
- explanation is concise but useful for exam preparation

If the existing explanation is correct:

PRESERVE its factual substance.

If it contains obvious errors or corruption and the supplied
reference material supports a safe correction:

repair it.

If it cannot be safely verified:

do not invent a correction.

============================================================
10. EXAM REFERENCE
============================================================

For genuine PYQs:

Preserve the original exam reference whenever supplied.

Examples:

"RPSC RAS 2023"
"Rajasthan CET 2024"
"RSMSSB Patwar 2021"

Do NOT manufacture:

- exam names
- years
- shifts
- paper numbers
- source websites

If unavailable:

"exam": null

============================================================
11. TOPIC BOUNDARY
============================================================

Every question must belong to:

"${topic}"

Do not force unrelated information into this topic.

However, do not remove a question merely because the wording
mentions a closely related concept when the actual tested fact
belongs to the selected topic.

============================================================
12. STUDY MATERIAL USAGE
============================================================

PDF/reference material is SUPPORTING MATERIAL.

Use it for:

- terminology
- factual verification
- explanation quality
- syllabus alignment
- identifying obvious errors

Do NOT use the PDF to manufacture fake PYQs.

Do NOT replace a genuine PYQ with a newly invented question
unless the original question is defective and cannot be repaired.

${referenceBlock}

${pyqBlock}

${usedIdsBlock}

${youtubeSection}

============================================================
13. NO AI-NEW QUESTIONS
============================================================

AI_NEW generation is OFF.

Every returned question must have:

"sourceType": "PYQ"

Never output:

"sourceType": "AI_NEW"

Never output:

"sourceType": "PYQ_MODIFIED"

There is no fixed composition requirement.

============================================================
14. OUTPUT FORMAT
============================================================

Return ONLY a valid JSON array.

No Markdown.

No explanation outside JSON.

No code fence.

No commentary.

Maximum ${targetCount} questions.

Example:

[
  {
    "question": "निम्नलिखित में से ...?",
    "options": [
      "विकल्प 1",
      "विकल्प 2",
      "विकल्प 3",
      "विकल्प 4"
    ],
    "answer": 1,
    "sourceType": "PYQ",
    "sourceQuestionId": 12345,
    "exam": "Rajasthan CET 2024",
    "explanation": "..."
  }
]

============================================================
15. FINAL INTERNAL CHECK — EVERY QUESTION
============================================================

Before returning each question verify:

[ ] Genuine supplied PYQ
[ ] Correct sourceQuestionId
[ ] Not previously used
[ ] Real exam reference preserved when available
[ ] Correct topic
[ ] No same-fact duplicate
[ ] Different factual point if retained alongside another
[ ] Question language is clean
[ ] Question meaning preserved
[ ] Four valid options
[ ] No duplicate options
[ ] Exactly one correct answer
[ ] Answer index is correct
[ ] Explanation matches question
[ ] Explanation matches answer
[ ] No corrupted text
[ ] No hallucinated facts
[ ] No fake exam name
[ ] No AI_NEW
[ ] No PYQ_MODIFIED
[ ] No citation artifacts
[ ] No unnecessary rewriting

============================================================
FINAL PRIORITY ORDER
============================================================

1. Authenticity
2. Factual correctness
3. Unique factual coverage
4. Question quality
5. Option quality
6. Explanation quality
7. Recent exam priority
8. Quantity

NEVER sacrifice a higher priority for a lower priority.

For example:

Do NOT keep a bad 2025 question merely because it is newer
than a clean 2022 question.

Do NOT generate an AI question merely because the batch has
fewer than ${targetCount} questions.

Do NOT delete a unique older PYQ merely because newer questions
exist.

Return the maximum number of genuinely valid, unique,
high-quality PYQs available from the supplied pool.
`;
}

export const generateAiPrompt = generateAiQuestionPrompt;