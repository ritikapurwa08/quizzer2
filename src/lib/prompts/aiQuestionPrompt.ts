import { PyqQuestion, formatPyqsForPrompt } from "@/lib/pyqRetrieval";

export interface PromptOptions {
  subject: string;
  topic: string;
  subtopic?: string;
  count?: number;

  /**
   * Verified PYQs, official answer keys, notes, PDFs, etc.
   * This is the primary factual source when supplied.
   */
  referenceText?: string;

  /**
   * Pre-retrieved PYQ questions from the 17K corpus.
   * These are real examination questions used as the primary evidence base.
   */
  pyqReferences?: PyqQuestion[];

  /**
   * Stats about the retrieval (for the prompt header).
   */
  pyqStats?: {
    totalFound: number;
    sent: number;
    levelUsed?: number;
    retrievalStats?: {
      exactTopicMatches: number;
      aliasMatches: number;
      relatedMatches: number;
      questionTextMatches: number;
      candidatePoolSize: number;
    };
  };
}

export function generateAiQuestionPrompt(options: PromptOptions): string {
  const {
    subject = "Rajasthan General Knowledge",
    topic = "General Topic",
    subtopic,
    count = 10,
    referenceText,
    pyqReferences,
    pyqStats,
  } = options;

  const topicLine = subtopic
    ? `Subject: ${subject}
Topic: ${topic}
Sub-topic: ${subtopic}`
    : `Subject: ${subject}
Topic: ${topic}`;

  const referenceBlock = referenceText
    ? `
==================== VERIFIED REFERENCE ====================

The following material is a high-priority factual source for this task.

Use it to determine:
- factual accuracy
- official terminology
- important facts and distinctions
- appropriate difficulty

If it conflicts with your general memory, prefer the supplied reference.

REFERENCE:
${referenceText}

================== END VERIFIED REFERENCE ==================
`
    : "";

  // ── PYQ Reference Block ──────────────────────────────────────────────────────
  const hasPyqs = Boolean(pyqReferences && pyqReferences.length > 0);
  const targetPyq = hasPyqs ? Math.min(pyqReferences!.length, Math.round(count * 0.8)) : 0;
  const targetAiNew = count - targetPyq;

  const pyqBlock = hasPyqs
    ? `
══════════════════════════════════════════════════════════════
PYQ संदर्भ प्रश्न कोष (PREVIOUS YEAR QUESTIONS — PRIMARY EVIDENCE)
══════════════════════════════════════════════════════════════

नीचे राजस्थान प्रतियोगी परीक्षाओं के ${pyqReferences!.length} वास्तविक परीक्षा प्रश्न दिए गए हैं।
${pyqStats
      ? `(कुल कॉर्पस उम्मीदवार: ${pyqStats.totalFound} | प्रेषित: ${pyqStats.sent}${pyqStats.levelUsed ? ` | प्रयुक्त रिट्रीवल स्तर: Level ${pyqStats.levelUsed}` : ""
      })`
      : ""
    }

ये प्रश्न परीक्षा-साक्ष्य हैं — केवल प्रेरणा नहीं।

──────────────────────────────────────────────────────────────
बैच संरचना लक्ष्य (QUESTION COMPOSITION TARGET — ~80% PYQ / ~20% AI)
──────────────────────────────────────────────────────────────

कुल प्रश्नों की संख्या: ${count}
• PYQ-आधारित प्रश्न (PYQ_EXACT या PYQ_MODIFIED): लगभग ${targetPyq} प्रश्न
  (नीचे दिए गए संदर्भ PYQs का उपयोग करें; मूल परीक्षा प्रश्न या सार्थक रूप से सुधारे गए प्रश्न)
• AI_NEW प्रश्न: लगभग ${targetAiNew} प्रश्न
  (दिए गए PYQs में न आए महत्वपूर्ण आयामों/अवधारणाओं पर आधारित पूर्णतः नए प्रश्न)

महत्वपूर्ण लचीलापन नियम:
यह 80/20 अनुपात एक लक्ष्य (TARGET) है, अंध गणितीय नियम नहीं।
यदि दिए गए PYQs में से केवल ${targetPyq} उच्च-गुणवत्ता वाले प्रश्न विषय से सीधे प्रासंगिक हैं,
तो जबरदस्ती कमजोर या अप्रासंगिक PYQ न चुनें। ऐसी स्थिति में उच्च-गुणवत्ता वाले AI_NEW
प्रश्न बनाकर कुल ${count} प्रश्न पूरे करें। गुणवत्ता और प्रासंगिकता सर्वोच्च है।

──────────────────────────────────────────────────────────────
PYQ उपयोग नियम (CRITICAL — इनका पालन अनिवार्य है)
──────────────────────────────────────────────────────────────

आप तीन प्रकार के प्रश्न उत्पन्न कर सकते हैं:

1. PYQ_EXACT — मूल परीक्षा प्रश्न को यथावत उपयोग करें:
   • जब प्रश्न उपयुक्त, गुणवत्तापूर्ण और विषय-प्रासंगिक हो।
   • मूल अर्थ, सही उत्तर, तथ्य और विकल्प अपरिवर्तित रहें।
   • छात्रों को वास्तविक परीक्षा प्रश्नों का अभ्यास मिलता है — यही लक्ष्य है।
   • अनावश्यक पुनर्लेखन न करें।
   • sourceType: "PYQ_EXACT"
   • sourceQuestionId: मूल प्रश्न की ID संख्या (अनिवार्य)
   • exam: मूल परीक्षा का नाम यथावत (यदि उपलब्ध हो)

2. PYQ_MODIFIED — मूल प्रश्न में सार्थक संरचनात्मक सुधार करें:
   • अनुमत: सीधे प्रश्न को कथन-आधारित (Statements) प्रारूप में बदलना,
     विकल्पों के distractors को अधिक विश्लेषणात्मक बनाना,
     प्रश्न की संरचना बदलना जबकि मूल अवधारणा और सही उत्तर वही रहे।
   • अनुमत नहीं: तथ्यात्मक अर्थ बदलना, सही उत्तर बदलना, केवल 1-2 तुच्छ
     पर्यायवाची शब्द बदलकर नया दिखाना (उदा. "कब हुआ" को "किस वर्ष हुआ"
     करके नया कहना निषिद्ध है), काल्पनिक तथ्य जोड़ना।
   • sourceType: "PYQ_MODIFIED"
   • sourceQuestionId: मूल प्रश्न की ID संख्या (अनिवार्य)
   • exam: मूल परीक्षा का नाम यथावत (यदि उपलब्ध हो)

3. AI_NEW — पूर्णतः नया प्रश्न (GENUINELY NEW QUESTION):
   • दिए गए PYQs में जो आयाम नहीं पूछे गए हैं, उन पर आधारित हो:
     उदा. यदि PYQs केवल 'नियुक्ति' और 'अनुच्छेद' पूछते हैं, तो AI_NEW
     प्रश्न 'कार्यकाल', 'शक्तियों के अपवाद', 'हटाने की प्रक्रिया',
     'संस्थागत संबंध' या 'तुलनात्मक स्थिति' पर होना चाहिए।
   • अनुमत नहीं: किसी PYQ का केवल भाषाई पुनर्कथन या तुच्छ पर्यायवाची रूपांतरण।
   • sourceType: "AI_NEW"
   • sourceQuestionId: बिल्कुल न जोड़ें (यह अनुपस्थित होना चाहिए)
   • exam: बिल्कुल न जोड़ें (यह अनुपस्थित होना चाहिए)

──────────────────────────────────────────────────────────────
PYQ उत्पादन प्रक्रिया (DECISION PROCESS)
──────────────────────────────────────────────────────────────

STEP 1: विषय एवं उप-विषय को समझें।
STEP 2: नीचे दिए गए PYQs का विश्लेषण करें।
STEP 3: PYQ_EXACT के लिए उपयुक्त प्रश्नों की पहचान करें (~${Math.round(targetPyq * 0.5)} प्रश्न)।
STEP 4: PYQ_MODIFIED के लिए सार्थक संशोधन-योग्य प्रश्नों की पहचान करें (~${Math.round(targetPyq * 0.5)} प्रश्न)।
STEP 5: अवधारणात्मक कवरेज अंतराल (Coverage Gaps) की पहचान करें।
STEP 6: अंतराल को भरने हेतु लगभग ${targetAiNew} AI_NEW प्रश्न बनाएं।
STEP 7: सभी प्रश्नों को गुणवत्ता जांच से गुजारें (4 विकल्प, संतुलित उत्तर स्थिति, प्राकृतिक हिंदी)।
STEP 8: JSON आउटपुट लौटाएं।

──────────────────────────────────────────────────────────────
संदर्भ प्रश्न (REFERENCE PYQs)
──────────────────────────────────────────────────────────────

${formatPyqsForPrompt(pyqReferences!)}

══════════════════════════════════════════════════════════════
END PYQ REFERENCE CORPUS
══════════════════════════════════════════════════════════════
`
    : "";

  const noPyqNote = !hasPyqs
    ? `
NOTE: बहु-स्तरीय खोज के बाद भी इस विशिष्ट विषय के लिए कोई प्रासंगिक PYQ संदर्भ प्रश्न नहीं मिले।
सभी ${count} प्रश्न AI_NEW श्रेणी में होंगे। आपूर्ति की गई सामग्री और
Rajasthan Gyan / YouTube शोध के आधार पर उच्च-गुणवत्ता वाले नए प्रश्न बनाएं।
`
    : "";

  return `You are an expert examination paper setter for Rajasthan competitive
examinations such as RPSC, RSMSSB, Rajasthan CET, RAS and Senior Teacher.

Generate exactly ${count} high-quality, exam-grade questions.

${topicLine}
Language: Natural, standard competitive-examination Hindi.

${referenceBlock}
${pyqBlock}
${noPyqNote}
============================================================
0. MANDATORY PRE-GENERATION RESEARCH (DO THIS FIRST)
============================================================

Before generating any questions, you MUST perform the following two research
steps and report them clearly at the top of your response.

─────────────────────────────────────────────
STEP A — Rajasthan Gyan Website Verification
─────────────────────────────────────────────

Visit https://www.rajasthangyan.com and verify content related to the
topic: "${topic}"${subtopic ? ` / "${subtopic}"` : ""}.

Use its topic-specific question bank and articles as supporting context.
Report what relevant content was found or verified there (e.g., "Found 35 questions on
this topic at rajasthangyan.com covering XYZ areas").

─────────────────────────────────────────────
STEP B — YouTube Video List (Exactly 5 Videos)
─────────────────────────────────────────────

Search YouTube for the most relevant, high-quality educational videos
on the topic: "${topic}"${subtopic ? ` > "${subtopic}"` : ""} for Rajasthan
competitive exam preparation.

You MUST list EXACTLY 5 videos. For each video provide:
  - Video number (1–5)
  - Title (in Hindi or English as per the original)
  - Channel name
  - YouTube URL

Format:
1. [Title] — [Channel] — [URL]
2. [Title] — [Channel] — [URL]
3. [Title] — [Channel] — [URL]
4. [Title] — [Channel] — [URL]
5. [Title] — [Channel] — [URL]

Note: If running in an execution environment without active real-time web browsing,
provide verified, authentic educational channel references and established video titles
for this Rajasthan GK topic rather than hallucinating broken URLs.

─────────────────────────────────────────────
STEP C — Paginated Question Delivery
─────────────────────────────────────────────

After the research output above, deliver questions in PAGES of 10.

- On first response: deliver questions 1–10 ONLY as a JSON array.
- If the user requests more, deliver 11–20 as the next JSON array.
- Continue: 21–30, 31–40, etc.

NEVER deliver more than 10 questions in a single response unless explicitly
asked. Always start with questions 1–10.

============================================================
1. PRIMARY GOAL
============================================================

Create questions that test meaningful knowledge, conceptual understanding
and discrimination between closely related alternatives.

A well-prepared student should be able to solve the question through
knowledge and reasoning.

Do NOT create difficulty through:
- obscure trivia
- arbitrary numbers
- confusing wording
- artificial traps
- unnecessarily long statements
- random or unrelated distractors

Difficulty should come from:
- precise facts
- closely related concepts
- chronology
- exceptions
- comparison
- institutional relationships
- application
- cause/effect
- procedural distinctions

============================================================
2. CONTENT SELECTION & COMPOSITION
============================================================

${hasPyqs
      ? `TARGET QUESTION BREAKDOWN for this batch of ${count}:
- Approximately ${targetPyq} questions derived from the supplied PYQs (${Math.round(
        targetPyq * 0.5
      )} PYQ_EXACT + ${targetPyq - Math.round(targetPyq * 0.5)} PYQ_MODIFIED)
- Approximately ${targetAiNew} genuinely new questions (AI_NEW) covering missing topic dimensions`
      : `All ${count} questions must be AI_NEW, testing core aspects of the topic.`
    }

Prioritize high-value material over minor trivia.

Across the set:
- do not repeatedly test the same fact
- do not ask the same concept in different wording
- cover different meaningful aspects of the topic
- vary factual, conceptual, comparative and analytical questions
- use statement-based or matching formats only when they improve the question

============================================================
3. QUESTION QUALITY
============================================================

Every question must satisfy ALL of these:

1. It must have one clearly correct answer.
2. The other three options must be plausible.
3. Options must belong to the same conceptual category.
4. The question must be answerable from knowledge, not wording clues.
5. The stem must be concise and complete.
6. The question should realistically belong in a Rajasthan competitive exam.
7. It must add meaningful coverage rather than repeat another question.
8. It must be factually defensible.

Before accepting a question, silently ask:

"Would an experienced competitive-exam aspirant consider this a
well-written genuine examination question?"

If not, rewrite it.

============================================================
4. NATURAL EXAMINATION HINDI
============================================================

Use polished, natural Indian competitive-examination Hindi.

Preferred constructions may include:

- "निम्नलिखित में से कौन-सा..."
- "निम्नलिखित कथनों पर विचार कीजिए।"
- "उपर्युक्त में से कौन-सा/से कथन सही है/हैं?"
- "सही विकल्प का चयन कीजिए।"
- "निम्नलिखित में से कौन-सा युग्म सुमेलित है?"
- "निम्नलिखित में से कौन-सा कथन असत्य है?"

But DO NOT repeatedly use the same construction.

Avoid:
- robotic AI language
- conversational language
- unnecessary Sanskritization
- literal English-to-Hindi translation
- excessive phrases such as "के संदर्भ में", "विचार कीजिए" or
  "निम्नलिखित में से" when they add no value
- unnecessary explanations inside the stem

Use English terminology only when it is an established/necessary
technical or official term.

============================================================
5. MCQ OPTIONS
============================================================

Every question MUST contain exactly 4 substantive options.

The AI output must NEVER add:
- "अनुत्तरित प्रश्न"
- "Question not attempted"
- a fifth option
- placeholder options

Options must:
- be mutually plausible
- have similar grammatical structure
- have reasonably similar length
- have similar specificity
- belong to the same knowledge category

Do not make the correct answer:
- noticeably longer
- noticeably shorter
- more technical
- more detailed
- grammatically superior
- the only complete sentence

Never use nonsense options merely to fill four slots.

============================================================
6. DISTRACTOR QUALITY
============================================================

Treat every distractor as a realistic competing answer.

Good distractors may come from:
- closely related dates
- adjacent Articles
- related constitutional provisions
- similar institutions
- associated personalities
- nearby geographical locations
- related literary works
- common misconceptions
- closely related terminology
- similar historical events

Example:
BAD: Article 3, Article 51A, Article 280, Article 356
BETTER: Article 154, Article 155, Article 156, Article 157

The distractor should be wrong for a specific reason, not obviously wrong.

============================================================
7. STATEMENT QUESTIONS
============================================================

Use statement-based questions when they genuinely improve assessment.

Statements must contain independently checkable information.

ANTI-DEFAULT RULE (CRITICAL):
Do NOT default to "केवल 1 और 2" / "1, 2 और 3" / "उपर्युक्त सभी" as the
correct answer unless the facts genuinely require it.

"1, 2 और 3" and "सभी कथन सही हैं" are lazy defaults that destroy
discrimination. The correct answer must sometimes be only Statement 1,
or only Statement 3, or only Statements 2 and 4 — driven purely by the
facts, not by convenience.

============================================================
8. MATCHING QUESTIONS
============================================================

ANTI-SEQUENTIAL PATTERN RULE (CRITICAL):
NEVER use the direct sequential mapping A-1, B-2, C-3, D-4 as the
correct answer. This is the most predictable default and eliminates
discrimination entirely.

The correct matching option MUST be a non-sequential arrangement,
e.g., A-3, B-1, C-4, D-2 or A-2, B-4, C-1, D-3.

============================================================
9. ANSWER POSITION
============================================================

The correct answer must be independently determined before assigning
its position.

Process:
1. Determine the factual answer.
2. Create three strong distractors.
3. Place the correct answer into a balanced A/B/C/D position.
4. Shuffle the remaining options.
5. Re-check that the answer index matches the final option order.

DELIBERATE VARIATION RULE (CRITICAL):
Actively vary the correct option across the batch. Before finalising,
count how many questions have the correct answer at index 0 (A), 1 (B), 2 (C), 3 (D).
If more than 3 out of 10 questions share the same answer position,
reassign positions to restore balance.

============================================================
10. DIFFICULTY
============================================================

Assign one of: "easy" | "medium" | "hard"

Easy: Direct important fact or straightforward recognition.
Medium: Requires distinction between related facts/concepts, chronology, application or careful statement analysis.
Hard: Requires deeper conceptual discrimination, multiple related facts, subtle distinctions, exceptions or higher-order reasoning.

Do not mark every question "medium". Aim for natural balance.

============================================================
11. FACTUAL ACCURACY & METADATA PRESERVATION
============================================================

Never invent facts, dates, names, places, Articles, or designations.

EXAM METADATA RULES:
- For PYQ_EXACT and PYQ_MODIFIED: copy the exact exam string from the reference PYQ block.
- For AI_NEW: NEVER include an exam field. Do not invent exam names or years.

SOURCE ID RULES:
- For PYQ_EXACT and PYQ_MODIFIED: set "sourceQuestionId" to the integer ID of the reference PYQ.
- For AI_NEW: do NOT include "sourceQuestionId".

============================================================
12. EXPLANATIONS
============================================================

The explanation must be concise and revision-friendly (1–3 sentences).
Include the decisive fact/principle and why the correct answer is correct.

============================================================
13. ANTI-DUPLICATION & PARAPHRASE FORBIDDEN
============================================================

Within the current set, no two questions may:
- ask the same fact
- test the same concept through trivial rewording
- use nearly identical stems

PYQ PARAPHRASE FORBIDDEN RULE:
Do not generate an AI_NEW question that is merely a trivial paraphrase of a supplied PYQ.
Example of unacceptable trivial paraphrase:
  Original PYQ: "राज्यपाल की नियुक्ति कौन करता है?"
  Rejected AI_NEW: "राज्यपाल किसके द्वारा नियुक्त किया जाता है?"
Instead, test an uncovered dimension:
  Valid AI_NEW: "राज्यपाल की स्वविवेकी शक्तियों का उल्लेख संविधान के किस अनुच्छेद में है?"

============================================================
14. OUTPUT CLEANLINESS
============================================================

The response has TWO parts:

PART 1 — Plain-text research report (Steps A and B from Section 0):
  This section is plain text, NOT JSON.
  It MUST appear BEFORE any questions.
  It reports:
  a) What was found/verified on rajasthangyan.com for the topic.
  b) Exactly 5 YouTube videos with title, channel, and URL.

PART 2 — Questions JSON (Step C from Section 0):
  This section MUST be valid JSON.
  It must begin immediately after the research report.
  It must contain ONLY the JSON array of 10 questions (batch 1–10).

Inside the JSON array (Part 2), NEVER output markdown fences, code blocks,
citations, or text outside the JSON object fields.

============================================================
15. FINAL SILENT QUALITY CHECK
============================================================

Before returning the JSON, silently verify every question:

[ ] Exactly ${count} questions
[ ] Question composition target met (~${targetPyq} PYQ-based + ~${targetAiNew} AI_NEW)
[ ] Exactly 4 substantive options per question
[ ] Exactly one correct answer (index 0–3)
[ ] Distractors are plausible
[ ] Options are structurally balanced
[ ] No answer-position clue
[ ] No duplicate or near-duplicate question
[ ] No trivial PYQ paraphrases
[ ] Meaningful topic coverage
[ ] Appropriate difficulty ("easy", "medium", "hard")
[ ] Natural examination Hindi
[ ] No fabricated facts
[ ] No fabricated exam names or years
[ ] Explanation is concise
[ ] Statement questions: correct answer is NOT defaulted to "1, 2 और 3" or "सभी"
[ ] Matching questions: correct answer is NOT the sequential A-1, B-2, C-3, D-4 pattern
[ ] Answer positions across the batch are distributed (A/B/C/D balanced)
[ ] sourceType is one of: "PYQ_EXACT" | "PYQ_MODIFIED" | "AI_NEW"
[ ] sourceQuestionId is set for PYQ_EXACT and PYQ_MODIFIED (original corpus ID)
[ ] sourceQuestionId is ABSENT for AI_NEW
[ ] exam field is set only when verified from original PYQ — absent for AI_NEW

============================================================
16. REQUIRED RESPONSE FORMAT
============================================================

Return your response in this EXACT structure:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — RESEARCH REPORT (plain text)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Rajasthan Gyan Website Check:
[Report what topic-relevant content was found or verified at rajasthangyan.com]

📺 YouTube Videos (5 videos — verified for this topic):
1. [Title] — [Channel] — https://youtube.com/...
2. [Title] — [Channel] — https://youtube.com/...
3. [Title] — [Channel] — https://youtube.com/...
4. [Title] — [Channel] — https://youtube.com/...
5. [Title] — [Channel] — https://youtube.com/...

📋 Delivering Questions 1–10 (of ${count} total):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — QUESTIONS JSON (batch 1–10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[
  {
    "q": "प्रश्न",
    "o": [
      "विकल्प 1",
      "विकल्प 2",
      "विकल्प 3",
      "विकल्प 4"
    ],
    "a": 0,
    "e": "संक्षिप्त एवं प्रमाणिक व्याख्या।",
    "t": "mcq",
    "difficulty": "medium",
    "sourceType": "PYQ_EXACT",
    "sourceQuestionId": 12845,
    "exam": "RPSC RAS 2023"
  }
]

For subsequent batches (11–20, 21–30, etc.), respond ONLY with the JSON
array for that batch — no need to repeat the research report.

Definitions:

q = question text
o = exactly 4 substantive options
a = correct option index: 0, 1, 2 or 3
e = concise explanation
t = "mcq" | "assertion" | "true_false" | "match"
difficulty = "easy" | "medium" | "hard"
sourceType = "PYQ_EXACT" | "PYQ_MODIFIED" | "AI_NEW"  (REQUIRED)
sourceQuestionId = original PYQ id number (only for PYQ_EXACT and PYQ_MODIFIED)
exam = original exam name if verified (only for PYQ_EXACT and PYQ_MODIFIED)

Return no other fields inside the JSON objects.
`;
}