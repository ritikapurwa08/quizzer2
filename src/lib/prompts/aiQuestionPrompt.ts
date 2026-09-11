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
   * Primary source for 14 PYQ questions and basis for 4 PYQ_MODIFIED questions.
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
  } = options;

  const hasPyqs = Boolean(pyqReferences && pyqReferences.length > 0);

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
The original PYQ data below remains the source for the 14 PYQ questions
and the basis for the 4 PYQ_MODIFIED questions.

REFERENCE CONTENT:
${referenceText}
============================================================
`
    : "";

  const pyqBlock = hasPyqs
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
Use this data as the source for the 14 PYQ questions and as the source material for the 4 PYQ_MODIFIED questions.

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

  return `You are an expert examination paper setter for Rajasthan competitive examinations (RPSC, RSMSSB, Rajasthan CET, RAS, Senior Teacher).

Your task is to generate a pristine, examination-ready test set of EXACTLY 20 questions for the following syllabus target:

Selected Subject: ${subject}
Selected Topic: ${topic}${subtopic ? `\nSelected Sub-topic: ${subtopic}` : ""}

The canonical syllabus topic is a HARD BOUNDARY. All 20 questions must strictly belong to "${topic}". Do NOT leak into unrelated topics or other geographic regions.

${referenceBlock}
${pyqBlock}

============================================================
CRITICAL RULES & GENERATION CONTRACT
============================================================

1. SUPPORTING MATERIALS USAGE (PDF & YOUTUBE)
------------------------------------------------------------
• You may use the user's supplied PDF/reference material and the five selected YouTube videos as supporting reference/context.
• YOUTUBE IS REFERENCE ONLY: Search for and select exactly 5 highly relevant, high-quality YouTube educational videos for "${subject} — ${topic}".
• THE 5 YOUTUBE VIDEOS ARE NOT QUESTION SOURCES:
  - Do NOT take questions from YouTube videos.
  - Do NOT replace PYQs with questions found in videos.
  - Do NOT count video-derived questions as PYQ.
  - Use the 5 videos purely to understand key teaching terminology, conceptual depth, language, and to craft better AI_NEW questions and rich explanations.

2. EXACT QUESTION COMPOSITION (TOTAL: EXACTLY 20 QUESTIONS)
------------------------------------------------------------
Every generated set MUST contain EXACTLY 20 questions in the following exact breakdown:

  • 14 PYQ (Original Previous Year Questions)
  • 4 PYQ_MODIFIED (Meaningfully Modified PYQs)
  • 2 AI_NEW (Genuinely New AI Questions)

Do NOT deviate from this 14 / 4 / 2 ratio under any circumstances.

3. RULES FOR 14 ORIGINAL "PYQ" QUESTIONS:
------------------------------------------------------------
• Exactly 14 questions must come directly from the supplied original PYQ data above.
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

4. RULES FOR 4 "PYQ_MODIFIED" QUESTIONS:
------------------------------------------------------------
• Exactly 4 questions must be PYQ_MODIFIED.
• These must be created ONLY from the supplied original PYQ data.
• Meaningfully modify the original PYQ, for example:
  - Change the framing or question angle
  - Convert a direct recall question into a conceptual / statement-based question (कथन आधारित)
  - Restructure options / test the same core concept in a different way
  - Convert into a matching question or multi-statement question
• Do NOT make meaningless changes (such as merely altering punctuation or changing one trivial word).
• The modified question must remain factually correct and strictly within "${topic}".
• IMPORTANT: The modified question must NOT be falsely presented as an actual exam question.
  - Set "exam": null OR cite the source PYQ without claiming the modified text appeared verbatim.

5. RULES FOR 2 "AI_NEW" QUESTIONS:
------------------------------------------------------------
• Exactly 2 questions must be genuinely NEW AI-generated questions.
• Must be strictly related to the selected syllabus topic: "${topic}".
• Must NOT simply rewrite or paraphrase the supplied PYQs.
• Must be factually reliable, conceptually sound, and useful for competitive exam preparation.
• Set "exam": null (Never invent an exam name for AI_NEW).

6. EXPLANATIONS (MANDATORY FOR ALL 20 QUESTIONS):
------------------------------------------------------------
• Every single question must contain a comprehensive, factual, exam-oriented explanation in the "explanation" field.
• Clearly explain why the correct answer is right and clarify related concepts/distractors.

7. OPTIONS & ANSWER FORMAT:
------------------------------------------------------------
• Every question must have EXACTLY 4 substantive options.
• "answer" must be the zero-based integer index of the correct option: 0, 1, 2, or 3.
• Balance answer positions across the 20 questions (distribute correct answers across A, B, C, D).

============================================================
REQUIRED OUTPUT FORMAT
============================================================

Your response must contain TWO parts:

PART A: 5 YouTube Reference Videos (Plain text / Markdown)
List exactly 5 educational videos for "${subject} — ${topic}":
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
    "exam": "RPSC RAS 2023",
    "explanation": "विस्तृत एवं तथ्यपरक परीक्षा-उपयोगी व्याख्या..."
  },
  {
    "question": "सार्थक रूप से संशोधित प्रश्न...",
    "options": [
      "विकल्प 1",
      "विकल्प 2",
      "विकल्प 3",
      "विकल्प 4"
    ],
    "answer": 1,
    "sourceType": "PYQ_MODIFIED",
    "exam": null,
    "explanation": "विस्तृत व्याख्या..."
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
    "exam": null,
    "explanation": "विस्तृत व्याख्या..."
  }
]

Allowed "sourceType" values ONLY:
- "PYQ"
- "PYQ_MODIFIED"
- "AI_NEW"

Verification Checklist before outputting:
[ ] Exactly 5 YouTube reference videos listed in Part A (NOT used as question sources)
[ ] Exactly 20 questions in JSON array in Part B
[ ] Exactly 14 questions with "sourceType": "PYQ"
[ ] Exactly 4 questions with "sourceType": "PYQ_MODIFIED"
[ ] Exactly 2 questions with "sourceType": "AI_NEW"
[ ] All 20 questions strictly within "${topic}"
[ ] Exactly 4 substantive options per question
[ ] "answer" is integer 0, 1, 2, or 3
[ ] "explanation" present on every question
[ ] Real exam name preserved where verified, otherwise "exam": null (NO fake exam names)
`;
}

export const generateAiPrompt = generateAiQuestionPrompt;