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
}

export function generateAiQuestionPrompt(options: PromptOptions): string {
  const {
    subject = "Rajasthan General Knowledge",
    topic = "General Topic",
    subtopic,
    count = 5,
    referenceText,
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

The following material is the highest-priority factual source for this task.

Use it to determine:
- factual accuracy
- official terminology
- important facts and distinctions
- PYQ-style wording
- appropriate difficulty

If it conflicts with your general memory, prefer the supplied reference.

Do NOT copy questions or sentences verbatim. Use the information to create
new, original questions.

REFERENCE:
${referenceText}

================== END VERIFIED REFERENCE ==================
`
    : "";

  return `You are an expert examination paper setter for Rajasthan competitive
examinations such as RPSC, RSMSSB, Rajasthan CET, RAS and Senior Teacher.

Generate exactly ${count} high-quality, original, exam-grade questions.

${topicLine}
Language: Natural, standard competitive-examination Hindi.

${referenceBlock}

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
2. CONTENT SELECTION
============================================================

First identify the most important exam-relevant areas of the supplied topic.

Prioritize high-value material over minor trivia.

Across the set:
- do not repeatedly test the same fact
- do not ask the same concept in different wording
- cover different meaningful aspects of the topic
- vary factual, conceptual, comparative and analytical questions
- use statement-based or matching formats only when they improve the question

Do not force an artificial question-type quota.

For small sets, natural variation is more important than numerical
distribution.

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

The application/UI may add such a choice separately if required.

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

BAD:
Article 3
Article 51A
Article 280
Article 356

BETTER:
Article 154
Article 155
Article 156
Article 157

The distractor should be wrong for a specific reason, not obviously wrong.

============================================================
7. STATEMENT QUESTIONS
============================================================

Use statement-based questions when they genuinely improve assessment.

Statements must contain independently checkable information.

Good statements test:
- factual distinctions
- exceptions
- chronology
- powers vs functions
- institutional relationships
- cause and effect
- exact provisions

Do not make a statement false merely by inserting an obviously extreme
word such as "always", "never" or "only".

Avoid unnecessarily long statements.

============================================================
8. MATCHING QUESTIONS
============================================================

Use matching questions only where meaningful relationships exist.

Examples:
Person → Event
Work → Author
Institution → Function
River → Origin
Movement → Leader
Article → Provision
Place → Characteristic

Use four pairs.

Shuffle the relationships so that the correct answer cannot be guessed
from position or sequence.

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

Across the generated set:
- distribute A/B/C/D as evenly as practical
- avoid obvious repeating patterns
- avoid long runs of the same answer position

Never choose an answer position because the correct answer happened to
be generated first.

============================================================
10. DIFFICULTY
============================================================

Assign one of:

"easy"
"medium"
"hard"

Easy:
Direct important fact or straightforward recognition.

Medium:
Requires distinction between related facts/concepts, chronology,
application or careful statement analysis.

Hard:
Requires deeper conceptual discrimination, multiple related facts,
subtle distinctions, exceptions or higher-order reasoning.

Hard must NOT mean obscure.

Do not mark every question "medium".

============================================================
11. FACTUAL ACCURACY
============================================================

Never invent:
- dates
- names
- places
- Articles
- constitutional provisions
- historical events
- geographical facts
- statistics
- official designations
- literary facts
- institutional powers

Priority:

1. Supplied verified reference
2. Official RPSC/RSMSSB/Rajasthan CET material
3. Government of Rajasthan sources
4. Government of India sources
5. NCERT/RBSE
6. Standard authoritative sources

If a fact cannot be established confidently, DO NOT use it.

For current affairs, use only information that can actually be verified.
Never invent dates, names, figures or designations.

============================================================
12. EXPLANATIONS
============================================================

The explanation must be concise and revision-friendly.

Normally use 1–3 sentences.

Include:
- the decisive fact/principle
- why the correct answer is correct
- one useful distinction when necessary

Do not:
- write an essay
- repeat the entire question
- repeat all options
- use unnecessary introductory phrases

============================================================
13. ANTI-DUPLICATION
============================================================

Within the current set, no two questions may:
- ask the same fact
- test the same concept through trivial rewording
- use nearly identical stems
- use the same answer with superficial wording changes

Also avoid common template repetition.

For example, do NOT generate:

"Who appointed X?"
"By whom was X appointed?"
"X was appointed by whom?"

These are the same question.

Prefer meaningful variation:

- appointment
- tenure
- constitutional provision
- power/function
- exception
- relationship with another institution

============================================================
14. OUTPUT CLEANLINESS
============================================================

The output must contain ONLY valid JSON.

Absolutely NEVER output:
- markdown
- code fences
- explanations outside JSON
- comments
- analysis
- source lists
- citations
- citation markers
- "[cite:...]"
- "[span_...]"
- footnotes
- URLs
- "According to the source..."
- internal reasoning

Do not place citations or source references inside q, o or e.

============================================================
15. FINAL SILENT QUALITY CHECK
============================================================

Before returning the JSON, silently verify every question:

[ ] Exactly ${count} questions
[ ] Exactly 4 options
[ ] Exactly one correct answer
[ ] Correct answer index is 0–3
[ ] Distractors are plausible
[ ] Options are structurally balanced
[ ] No answer-position clue
[ ] No duplicate or near-duplicate question
[ ] No repeated fact disguised by rewording
[ ] Meaningful topic coverage
[ ] Appropriate difficulty
[ ] Natural examination Hindi
[ ] No unnecessary English
[ ] No fabricated facts
[ ] Explanation is concise
[ ] No citation/span/source artifacts
[ ] Valid JSON

If ANY condition fails, fix the question before returning it.

============================================================
16. REQUIRED JSON FORMAT
============================================================

Return ONLY:

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
    "difficulty": "medium"
  }
]

Definitions:

q = question text
o = exactly 4 substantive options
a = correct option index: 0, 1, 2 or 3
e = concise explanation
t = "mcq" | "assertion" | "true_false" | "match"
difficulty = "easy" | "medium" | "hard"

Return no other fields.

============================================================
FINAL INSTRUCTION
============================================================

Generate exactly ${count} original, exam-grade questions for the specified
topic. Prioritize factual accuracy, natural examination language,
high-quality distractors, meaningful coverage, genuine difficulty and
clean JSON output over quantity or superficial variation.
`;
}