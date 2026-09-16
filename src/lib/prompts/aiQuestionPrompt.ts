import { PyqQuestion, formatPyqsForPrompt } from "@/lib/pyqTypes";

export interface PromptOptions {
  subject: string;
  topic: string;
  subtopic?: string;
  count?: number;

  /**
   * User-supplied study notes, official answer keys, syllabus text, PDFs, etc.
   * Supporting factual and terminological context.
   */
  referenceText?: string;

  /**
   * Pre-retrieved batch of original PYQs from the local question corpus.
   * Primary source for 16 PYQ questions.
   */
  pyqReferences?: PyqQuestion[];

  /**
   * Stats about the retrieval batch for prompt header.
   */
  pyqStats?: {
    totalFound: number;
    sent: number;
    usedCount?: number;
    remainingCount?: number;
    batchNumber?: number;
  };

  /**
   * Persistent list of sourceQuestionIds that have already been used in previous generated/imported sets for this topic.
   */
  usedQuestionIds?: number[];

  /**
   * Pre-selected 5 YouTube videos for this topic. If provided, Gemini will not output another list of videos.
   */
  selectedYouTubeVideos?: string[] | string;

  /**
   * If true, generates instructions-only prompt without interpolating the PYQ question records.
   * The PYQ questions will be provided separately to the LLM.
   */
  promptOnly?: boolean;
}

export function generateAiQuestionPrompt(options: PromptOptions): string {
  const {
    subject = "Rajasthan General Knowledge",
    topic = "General Topic",
    subtopic,
    count: _count = 20,
    referenceText,
    pyqReferences = [],
    pyqStats,
    usedQuestionIds = [],
    selectedYouTubeVideos,
    promptOnly = false,
  } = options;

  const hasPyqs = Boolean(pyqReferences && pyqReferences.length > 0);

  // Normalize used question IDs list
  const usedIdsList = Array.isArray(usedQuestionIds)
    ? usedQuestionIds.filter((id) => typeof id === "number" && !isNaN(id))
    : [];

  const usedIdsBlock = `
============================================================
USED SOURCE QUESTION IDs (PERMANENTLY UNAVAILABLE FOR THIS TOPIC)
============================================================

USED SOURCE QUESTION IDs:
[${usedIdsList.join(", ")}]

Gemini MUST:
- never use any ID from this list again
- select 16 PYQ questions only from the newly supplied PYQ batch
- return the genuine sourceQuestionId for every PYQ question
- treat the supplied USED IDs as permanently unavailable for future sets
============================================================
`;

  // Normalize existing YouTube videos
  const rawVideos = selectedYouTubeVideos;
  const videosList = Array.isArray(rawVideos)
    ? rawVideos.filter((v) => typeof v === "string" && v.trim().length > 0)
    : typeof rawVideos === "string" && rawVideos.trim().length > 0
    ? [rawVideos.trim()]
    : [];

  const hasExistingVideos = videosList.length > 0;
  const formattedVideos = videosList
    .map((v, i) => {
      const trimmed = v.trim();
      return /^\d+[\.\)]/.test(trimmed) ? trimmed : `${i + 1}. ${trimmed}`;
    })
    .join("\n");

  const referenceBlock = referenceText
    ? `
============================================================
USER-SUPPLIED STUDY / REFERENCE MATERIAL (PDF / TEXT)
============================================================

The user has attached or supplied the following reference material.
Use it strictly as supporting study context to improve:
- official terminology and phrasing
- factual accuracy and depth
- conceptual clarity
- syllabus alignment and comprehensive explanations

NOTE: The supplied reference material is supporting context.
The original PYQ data remains the primary source for the 16 PYQ questions.

REFERENCE CONTENT:
${referenceText}
============================================================
`
    : "";

  const pyqBlock = promptOnly
    ? `
============================================================
ORIGINAL PYQ DATA (SEPARATELY PROVIDED VIA "COPY PYQ")
============================================================

Selected Subject: ${subject}
Selected Topic: ${topic}${subtopic ? `\nSelected Sub-Topic / Set: ${subtopic}` : ""}
${
  pyqStats
    ? `Corpus Statistics: Total Topic PYQs: ${pyqStats.totalFound} | Available Unused in Corpus: ${
        pyqStats.remainingCount ?? pyqStats.sent
      }${pyqStats.usedCount !== undefined ? ` | Previously Used: ${pyqStats.usedCount}` : ""}`
    : ""
}

NOTE: The authentic, unused PYQ questions pool for this topic is provided separately.
Gemini MUST:
- Use the separately provided PYQs as the primary source for the 16 PYQ questions.
- Return the exact original "sourceQuestionId" for every PYQ question.
- Formulate 4 brand new, highly accurate AI_NEW questions.
- Follow all 16 + 4 composition rules and output the required JSON format below.
============================================================
`
    : hasPyqs
    ? `
============================================================
ORIGINAL PYQ DATA (CURRENT RETRIEVAL BATCH — PRIMARY SOURCE)
============================================================

Selected Subject: ${subject}
Selected Topic: ${topic}${subtopic ? `\nSelected Sub-Topic / Set: ${subtopic}` : ""}
${
  pyqStats
    ? `Corpus Statistics: Total Topic PYQs: ${pyqStats.totalFound} | Current Batch Size: ${pyqStats.sent}${
        pyqStats.batchNumber ? ` | Batch: #${pyqStats.batchNumber}` : ""
      }${pyqStats.usedCount !== undefined ? ` | Previously Processed: ${pyqStats.usedCount}` : ""}${
        pyqStats.remainingCount !== undefined ? ` | Remaining Unused in Corpus: ${pyqStats.remainingCount}` : ""
      }`
    : `Supplied PYQ Count: ${pyqReferences.length}`
}

You are receiving original PYQ data for the selected syllabus topic.
Use this data as the source for the 16 PYQ questions.

────────────────────────────────────────────────────────────
RETRIEVED PYQ QUESTIONS:
────────────────────────────────────────────────────────────

${formatPyqsForPrompt(pyqReferences)}

============================================================
END ORIGINAL PYQ DATA BATCH
============================================================
`
    : `
NOTE: No prior examination PYQs were found in the local corpus for this specific topic.
Generate questions maintaining syllabus boundaries using high-quality competitive examination standards.
`;

  const youtubeSection = hasExistingVideos
    ? `1. SUPPORTING MATERIALS USAGE (PDF & YOUTUBE)
------------------------------------------------------------
• PREVIOUSLY SELECTED YOUTUBE REFERENCE VIDEOS FOR THIS TOPIC:
${formattedVideos}

These 5 YouTube videos have already been selected for this Topic. Continue using them as supporting reference material. Do not provide another YouTube list.

• YOUTUBE IS REFERENCE ONLY:
  - DO NOT search for or output another 5 videos for every subsequent 20-question set.
  - DO NOT provide another YouTube list.
  - Continue using the 5 previously selected videos above purely as supporting reference material.
• THE YOUTUBE VIDEOS ARE NOT QUESTION SOURCES:
  - Do NOT take questions from YouTube videos.
  - Do NOT replace PYQs with questions found in videos.
  - Do NOT count video-derived questions as PYQ.
  - YouTube remains SUPPORTING CONTEXT ONLY. It is never a question source.
  - Use the 5 videos purely to understand key teaching terminology, conceptual depth, language, and to craft better AI_NEW questions and rich explanations.`
    : `1. SUPPORTING MATERIALS USAGE (PDF & YOUTUBE)
------------------------------------------------------------
• You may use the user's supplied PDF/reference material and the five selected YouTube videos as supporting reference/context.
• YOUTUBE IS REFERENCE ONLY: Search for and select exactly 5 highly relevant, high-quality YouTube educational videos for "${subject} — ${topic}".
• THE 5 YOUTUBE VIDEOS ARE NOT QUESTION SOURCES:
  - Do NOT take questions from YouTube videos.
  - Do NOT replace PYQs with questions found in videos.
  - Do NOT count video-derived questions as PYQ.
  - YouTube remains SUPPORTING CONTEXT ONLY. It is never a question source.
  - Use the 5 videos purely to understand key teaching terminology, conceptual depth, language, and to craft better AI_NEW questions and rich explanations.`;

  const outputFormatSection = hasExistingVideos
    ? `============================================================
REQUIRED OUTPUT FORMAT
============================================================

Your response must contain ONLY the JSON array of exactly 20 questions:
(Do not provide another YouTube list — the 5 YouTube videos have already been selected for this Topic.)

Follow immediately with the JSON array of exactly 20 questions:

[
  {
    "question": "प्राकृतिक एवं प्रामाणिक परीक्षा प्रश्न...",
    "options": [
      "विकल्प 1",
      "विकल्प 2",
      "विकल्प 3",
      "विकल्प 4"
    ],
    "answer": 0,
    "sourceType": "PYQ",
    "sourceQuestionId": 101,
    "exam": "RPSC RAS 2023",
    "explanation": "विस्तृत एवं तथ्यपरक परीक्षा-उपयोगी व्याख्या..."
  },
  {
    "question": "नवीनतम एवं मौलिक AI प्रश्न...",
    "options": [
      "विकल्प 1",
      "विकल्प 2",
      "विकल्प 3",
      "विकल्प 4"
    ],
    "answer": 2,
    "sourceType": "AI_NEW",
    "sourceQuestionId": null,
    "exam": null,
    "explanation": "विस्तृत व्याख्या..."
  }
]

Allowed "sourceType" values ONLY:
- "PYQ"
- "AI_NEW"

Verification Checklist before outputting:
[ ] Do NOT provide another YouTube list (The 5 YouTube videos have already been selected for this Topic and used as supporting reference only)
[ ] Exactly 20 questions in JSON array (16 PYQ, 4 AI_NEW)
[ ] Exactly 16 questions with "sourceType": "PYQ" (from supplied PYQ data)
[ ] Exactly 4 questions with "sourceType": "AI_NEW" (genuinely new AI questions with sourceQuestionId: null and exam: null)
[ ] "sourceQuestionId" matches original Corpus ID for every PYQ question
[ ] NONE of the sourceQuestionId values are from the USED SOURCE QUESTION IDs list
[ ] All 20 questions strictly within canonical topic "${topic}"
[ ] Exactly 4 substantive options per question
[ ] Exactly ONE option is unequivocally correct; the other 3 are plausible, parallel, but definitively incorrect
[ ] "answer" is a single integer: 0, 1, 2, or 3
[ ] "explanation" present on every question
[ ] Real exam name preserved where verified for PYQs, otherwise "exam": null (NO fake exam names)
[ ] For statement-based questions: natural truth-pattern diversity (NOT repeatedly all-true or both-true; statements 1, 2, 3 vary naturally based on facts)
[ ] Every statement is independently verifiable with clear factual truth/false status (no ambiguity, debatable claims, or misleading wording)
[ ] Statement-based options map unambiguously to exactly ONE correct option
[ ] Clean JSON without inline citations — Do not include citations, citation markers, footnotes, or [cite: ...] markers inside the JSON.
`
    : `============================================================
REQUIRED OUTPUT FORMAT
============================================================

Your response must contain TWO parts:

PART A: 5 YouTube Reference Videos (Plain text / Markdown)
List exactly 5 educational videos for "${subject} — ${topic}" as SUPPORTING REFERENCE ONLY (NOT question sources):
1. [Video Title] — [Channel Name] — [YouTube URL]
2. [Video Title] — [Channel Name] — [YouTube URL]
3. [Video Title] — [Channel Name] — [YouTube URL]
4. [Video Title] — [Channel Name] — [YouTube URL]
5. [Video Title] — [Channel Name] — [YouTube URL]

PART B: Exactly 20 Questions (JSON Array)
Follow Part A immediately with the JSON array of exactly 20 questions:

[
  {
    "question": "प्राकृतिक एवं प्रामाणिक परीक्षा प्रश्न...",
    "options": [
      "विकल्प 1",
      "विकल्प 2",
      "विकल्प 3",
      "विकल्प 4"
    ],
    "answer": 0,
    "sourceType": "PYQ",
    "sourceQuestionId": 101,
    "exam": "RPSC RAS 2023",
    "explanation": "विस्तृत एवं तथ्यपरक परीक्षा-उपयोगी व्याख्या..."
  },
  {
    "question": "नवीनतम एवं मौलिक AI प्रश्न...",
    "options": [
      "विकल्प 1",
      "विकल्प 2",
      "विकल्प 3",
      "विकल्प 4"
    ],
    "answer": 2,
    "sourceType": "AI_NEW",
    "sourceQuestionId": null,
    "exam": null,
    "explanation": "विस्तृत व्याख्या..."
  }
]

Allowed "sourceType" values ONLY:
- "PYQ"
- "AI_NEW"

Verification Checklist before outputting:
[ ] Exactly 5 YouTube reference videos listed in Part A (SUPPORTING REFERENCE ONLY — NOT used as question sources)
[ ] Exactly 20 questions in JSON array in Part B (16 PYQ, 4 AI_NEW)
[ ] Exactly 16 questions with "sourceType": "PYQ" (from supplied PYQ data)
[ ] Exactly 4 questions with "sourceType": "AI_NEW" (genuinely new AI questions with sourceQuestionId: null and exam: null)
[ ] "sourceQuestionId" matches original Corpus ID for every PYQ question
[ ] NONE of the sourceQuestionId values are from the USED SOURCE QUESTION IDs list
[ ] All 20 questions strictly within canonical topic "${topic}"
[ ] Exactly 4 substantive options per question
[ ] Exactly ONE option is unequivocally correct; the other 3 are plausible, parallel, but definitively incorrect
[ ] "answer" is a single integer: 0, 1, 2, or 3
[ ] "explanation" present on every question
[ ] Real exam name preserved where verified for PYQs, otherwise "exam": null (NO fake exam names)
[ ] For statement-based questions: natural truth-pattern diversity (NOT repeatedly all-true or both-true; statements 1, 2, 3 vary naturally based on facts)
[ ] Every statement is independently verifiable with clear factual truth/false status (no ambiguity, debatable claims, or misleading wording)
[ ] Statement-based options map unambiguously to exactly ONE correct option
[ ] Clean JSON without inline citations — Do not include citations, citation markers, footnotes, or [cite: ...] markers inside the JSON.
`;

  return `You are an expert examination paper setter for Rajasthan competitive examinations (RPSC, RSMSSB, Rajasthan CET, RAS, Senior Teacher).

Your task is to generate a pristine, examination-ready test set of EXACTLY 20 questions for the following syllabus target:

Selected Subject: ${subject}
Selected Topic: ${topic}${subtopic ? `\nSelected Sub-topic: ${subtopic}` : ""}

The canonical syllabus topic is a HARD BOUNDARY. All 20 questions must strictly belong to "${topic}". Do NOT leak into unrelated topics or other geographic regions.

${referenceBlock}
${pyqBlock}
${usedIdsBlock}
============================================================
CRITICAL RULES & GENERATION CONTRACT
============================================================

${youtubeSection}

2. EXACT QUESTION COMPOSITION (TOTAL: EXACTLY 20 QUESTIONS)
------------------------------------------------------------
Every generated set MUST contain EXACTLY 20 questions in the following exact breakdown:

  • 16 PYQ (Authentic Previous Year Questions from supplied data)
  • 4 AI_NEW (Genuinely New AI Questions)

Do NOT deviate from this 16 / 4 ratio under any circumstances.
"PYQ_MODIFIED" is completely retired and must NOT be used.

3. RULES FOR 16 ORIGINAL "PYQ" QUESTIONS:
------------------------------------------------------------
• Exactly 16 questions must come directly from the newly supplied original PYQ data above.
• NEVER use any ID from the USED SOURCE QUESTION IDs list.
• Return the "sourceQuestionId" for every PYQ question matching its Corpus ID from the newly supplied PYQ data.
• You may improve:
  - Hindi language and grammar
  - Sentence clarity
  - Option clarity
  - Standard formatting
• You must NOT change the factual meaning, key concept, or correct answer of the original PYQ.
• The question must remain recognizably based on the original exam question.
• EXAM FIELD RULE:
  - If the original PYQ data contains a real exam name (e.g. "RPSC RAS 2023", "RSMSSB Patwar 2021"), PRESERVE it.
  - If the original PYQ data does not contain a reliable exam name, set: "exam": null
  - NEVER invent fake exam names (such as "Unknown Exam", "Practice Exam", "Mock Exam", or any fictional exam).

4. RULES FOR 4 "AI_NEW" QUESTIONS:
------------------------------------------------------------
• Exactly 4 questions must be genuinely NEW AI-generated questions.
• Must be strictly related to the selected syllabus topic: "${topic}".
• Must NOT simply rewrite or duplicate the supplied PYQs.
• Must be factually reliable, conceptually sound, and useful for competitive exam preparation.
• Set "exam": null (Never invent an exam name for AI_NEW).
• Set "sourceQuestionId": null (AI_NEW questions never have a sourceQuestionId).

5. CRITICAL AI OPTION & CORRECTNESS CONTRACT:
------------------------------------------------------------
• Single Answer Integrity: Each question must have EXACTLY ONE unambiguously correct option.
• Index Format: "answer" must be a single integer index (0, 1, 2, or 3) pointing to the single correct option.
• Parallel Distractors: The 3 incorrect distractors must be plausible, grammatically parallel, and comparable in length/detail to the correct option, but CATEGORICALLY AND FACTUALLY INCORRECT.
• Candidate Defense Test: Before returning any question, mentally test all 4 options. Ensure no distractor could be argued as correct under any reasonable interpretation, historical record, or official source. Never output multiple correct options or ambiguous phrasing.

6. CRITICAL FIX: STATEMENT-BASED QUESTION TRUTH-PATTERN DIVERSITY (कथन आधारित प्रश्न नियम):
------------------------------------------------------------
• THE PROBLEM TO ELIMINATE:
  In statement-based questions (e.g. "निम्नलिखित कथनों पर विचार कीजिए / Consider the following statements:"), AI engines repeatedly make all statements TRUE (1=TRUE, 2=TRUE, 3=TRUE -> "1, 2 और 3" / "उपर्युक्त सभी"), or for two statements make both TRUE ("दोनों 1 और 2").
  This creates a predictable guessing pattern for students. THIS IS STRICTLY PROHIBITED.

• MANDATORY TRUTH-PATTERN DIVERSITY:
  - The truth values of individual statements MUST vary naturally based on factual correctness.
  - For 3 statements, naturally use diverse valid combinations:
    * TRUE / TRUE / FALSE
    * TRUE / FALSE / TRUE
    * FALSE / TRUE / TRUE
    * TRUE / FALSE / FALSE
    * FALSE / TRUE / FALSE
    * FALSE / FALSE / TRUE
    * TRUE / TRUE / TRUE
    * FALSE / FALSE / FALSE
  - For 2 statements, naturally vary between:
    * TRUE / FALSE
    * FALSE / TRUE
    * TRUE / TRUE
    * FALSE / FALSE
  - For 4 statements, naturally use combinations like:
    * TRUE / TRUE / FALSE / TRUE
    * TRUE / FALSE / FALSE / TRUE
    * FALSE / TRUE / TRUE / FALSE
    * TRUE / FALSE / TRUE / FALSE, etc.
  - AVOID REPETITIVE PATTERNS:
    * Do NOT repeatedly make all statements true.
    * Do NOT repeatedly make all statements false.
    * Do NOT repeatedly make two statements true.
    * Do NOT systematically make Statement 1 (or any specific statement position) always true or always false across questions.
    * Do NOT force a mechanical artificial quota — let the pattern emerge naturally from factual examination content.

• FACTUAL CLARITY & ZERO AMBIGUITY (VERY IMPORTANT):
  - Statement diversity does NOT mean creating tricky, debatable, or ambiguous statements.
  - Every individual statement must have an unequivocal, independently verifiable factual status:
    * If marked TRUE, it must be 100% indisputably true according to official government records, gazettes, standard textbooks, or authentic exam boards.
    * If marked FALSE, it must be clearly and definitely false (e.g. incorrect year, wrong ruler, swapped district, inverted role), NOT false because of a petty grammatical trick or debatable nuance.
    * Never use partially true, context-dependent without context, or controversial statements.

• ANSWER OPTION VALIDATION FOR STATEMENT QUESTIONS:
  - The 4 MCQ options must represent clear combinations (e.g. "केवल 1 और 2", "केवल 2 और 3", "केवल 1 और 3", "1, 2 और 3").
  - The combination of statements MUST map to EXACTLY ONE unambiguous, correct final answer option.
  - No two options may represent the same truth combination.
  - Distractor options must be plausible combinations that test genuine comprehension.

7. EXPLANATIONS (MANDATORY FOR ALL 20 QUESTIONS):
------------------------------------------------------------
• Every single question must contain a comprehensive, factual, exam-oriented explanation in the "explanation" field.
• Clearly explain why the correct answer is right and clarify related concepts/distractors.
• For statement questions, explicitly state the factual truth/falsity of each individual statement in the explanation.

8. OPTIONS & ANSWER FORMAT:
------------------------------------------------------------
• Every question must have EXACTLY 4 substantive options.
• "answer" must be the zero-based integer index of the correct option: 0, 1, 2, or 3.
• Balance answer positions across the 20 questions (distribute correct answers naturally across A, B, C, D — never use predictable sequences like A->B->C->D or all A's). Factual correctness always takes priority.

9. NO INLINE CITATIONS OR BRACKETED CITATION ARTIFACTS:
------------------------------------------------------------
• Do not include citations, citation markers, footnotes, or [cite: ...] markers (such as [cite: 1] or [cite: 11]) inside the JSON.
• Return clean JSON without inline citations.

${outputFormatSection}
`;
}

export const generateAiPrompt = generateAiQuestionPrompt;