export interface PromptOptions {
  subject: string;
  topic: string;
  difficulty?: string;
  language?: string;
  count: number;
}

export const QUESTION_TYPES_EXAMPLES = {
  mcq: {
    type: "mcq",
    questionText: "Which of the following dynasties ruled the region of Marwar before the Rathores?",
    options: [
      { id: "opt1", text: "Guhilas" },
      { id: "opt2", text: "Pratiharas" },
      { id: "opt3", text: "Chauhans" },
      { id: "opt4", text: "Paramaras" }
    ],
    correctAnswer: "opt2",
    explanation: "Before the establishment of Rathore rule in Marwar by Rao Siha, the Mandore region was ruled by the Gurjara-Pratiharas.",
    difficulty: "medium",
    reference: "Rajasthan History - Dynasties of Rajasthan"
  },
  sequence: {
    type: "sequence",
    questionText: "Arrange the following peasant movements of Rajasthan in chronological order (oldest to newest):",
    options: [
      { id: "opt1", text: "Bijolia (1897) → Begun (1921) → Neemuchana (1925) → Dhabhra (1947)" },
      { id: "opt2", text: "Begun (1921) → Bijolia (1897) → Neemuchana (1925) → Dhabhra (1947)" },
      { id: "opt3", text: "Bijolia (1897) → Neemuchana (1925) → Begun (1921) → Dhabhra (1947)" },
      { id: "opt4", text: "Neemuchana (1925) → Bijolia (1897) → Begun (1921) → Dhabhra (1947)" }
    ],
    correctAnswer: "opt1",
    explanation: "Chronological timeline: Bijolia Peasant Movement started in 1897, Begun in 1921, Neemuchana massacre took place in 1925, and Dhabhra incident occurred in 1947.",
    difficulty: "hard",
    reference: "Rajasthan Freedom Movement - Peasant Movements",
    meta: {
      items: [
        "Bijolia Peasant Movement (1897)",
        "Begun Peasant Movement (1921)",
        "Neemuchana Incident (1925)",
        "Dhabhra Incident (1947)"
      ]
    }
  },
  match_following: {
    type: "match_following",
    questionText: "Match List-I (Prajamandal) with List-II (Founder) correctly:",
    options: [
      { id: "opt1", text: "A-2, B-1, C-4, D-3" },
      { id: "opt2", text: "A-1, B-2, C-3, D-4" },
      { id: "opt3", text: "A-3, B-1, C-2, D-4" },
      { id: "opt4", text: "A-4, B-3, C-1, D-2" }
    ],
    correctAnswer: "opt1",
    explanation: "Marwar Prajamandal was founded by Jayanarayan Vyas (A-2), Mewar Prajamandal by Manikya Lal Verma (B-1), Bundi Prajamandal by Kanti Lal (C-4), and Bikaner Prajamandal by Magaram Vaidya (D-3).",
    difficulty: "medium",
    reference: "Rajasthan Freedom Movement - Prajamandals",
    meta: {
      left: ["A. Marwar Prajamandal", "B. Mewar Prajamandal", "C. Bundi Prajamandal", "D. Bikaner Prajamandal"],
      right: ["1. Manikya Lal Verma", "2. Jayanarayan Vyas", "3. Magaram Vaidya", "4. Kanti Lal"]
    }
  },
  statement_reason: {
    type: "statement_reason",
    questionText: "Statement (A): Rajasthan receiving maximum rain from the South-West Monsoon (Arabian Sea branch) is largely confined to Southern Rajasthan.\n\nReason (R): The Aravalli range lies parallel to the direction of the South-West Arabian Sea monsoon winds.",
    options: [
      { id: "opt1", text: "Both A and R are true and R is the correct explanation of A." },
      { id: "opt2", text: "Both A and R are true but R is NOT the correct explanation of A." },
      { id: "opt3", text: "A is true but R is false." },
      { id: "opt4", text: "A is false but R is true." }
    ],
    correctAnswer: "opt1",
    explanation: "Because the Aravalli range lies parallel to the Arabian Sea monsoon branch, the winds pass without obstacle, resulting in lower rainfall in western/central regions.",
    difficulty: "hard",
    reference: "Geography of Rajasthan - Climate & Monsoons"
  }
};

export function generateAiQuestionPrompt(options: PromptOptions): string {
  const {
    subject,
    topic,
    difficulty = "hard",
    language = "Hindi",
    count = 10,
  } = options;

  const difficultyText =
    difficulty === "any" || difficulty === "mixed" || !difficulty
      ? "Balanced mix of easy, medium, and hard difficulty questions aligned with RPSC 2nd Grade standards"
      : `${difficulty.toUpperCase()} difficulty level aligned with RPSC 2nd Grade standard`;

  return `You are an expert assessment generator specializing in RPSC (Rajasthan Public Service Commission) 2nd Grade (Senior Teacher) Competitive Examinations.

Generate exactly ${count} high-quality, authentic, and conceptual questions adhering strictly to RPSC examination standards.

==================================================
TARGET EXAM SPECIFICATIONS:
==================================================
- Target Exam: RPSC 2nd Grade (Senior Teacher) Examination
- Subject: ${subject || "General Knowledge (Paper 1)"}
- Topic: ${topic || "General Topic"}
- Language: ${language}
- Difficulty Standard: ${difficultyText}
- Total Questions Needed: ${count}

==================================================
EXAM BENCHMARK & QUALITY STANDARDS:
==================================================
1. Align with authentic RPSC 2nd Grade Paper-1 (GK, Rajasthan History/Art/Culture/Geography, Polity, Educational Psychology) and Paper-2 Subject standards.
2. Questions must test factual accuracy, logical reasoning, and analytical depth—avoid overly simplistic or trivial one-line trivia unless difficulty is set to easy.
3. Distractors (incorrect options) must be highly plausible and representative of typical competitive exam traps.

==================================================
STRICT LOGIC FOR "sequence" (KRAMWAR / CHRONOLOGICAL) QUESTIONS:
==================================================
Do NOT generate arbitrary or random lists of items for sequence questions.
When generating a "sequence" question, you MUST follow these logical rules:
1. ANCHOR ON INDISPUTABLE LOGIC: The items must have an objective, indisputable sequence criterion:
   - Historical Timeline (e.g., Year of occurrence, reign period of rulers, act/treaty enactments).
   - Geographical / Spatial Progression (e.g., North to South, West to East, River flow sequence).
   - Biological / Process Order (e.g., Stages of Educational Psychology development models, constitutional procedural steps).
2. EXPLICIT CONTEXT / DATES IN META:
   - For historical or event sequences, include years or dates inside the "meta.items" array elements whenever relevant (e.g., ["Bijolia Movement (1897)", "Begun Movement (1921)"]).
   - For geographical or procedural sequences, state the progression axis clearly in the "questionText" (e.g., "Arrange the following Aravalli peaks in descending order of height:").
3. DO NOT use subjective orderings like "importance" or "popularity".

==================================================
OUTPUT FORMAT REQUIREMENT:
==================================================
You MUST return ONLY a single valid JSON Array containing the question objects (DO NOT include subject, topic, or testSet wrappers inside the JSON).

==================================================
JSON SCHEMA & QUESTION TYPES EXAMPLES:
==================================================
ALLOWED QUESTION TYPES:
"mcq", "statement_reason", "match_following", "table", "assertion_reason", "sequence", "true_false"

EXAMPLE QUESTION OBJECTS:
${JSON.stringify([QUESTION_TYPES_EXAMPLES.mcq, QUESTION_TYPES_EXAMPLES.sequence, QUESTION_TYPES_EXAMPLES.match_following, QUESTION_TYPES_EXAMPLES.statement_reason], null, 2)}

==================================================
MANDATORY RULES FOR QUESTION TYPES & META FIELD:
==================================================
1. IF TYPE IS "sequence":
   - YOU MUST INCLUDE THE "meta" OBJECT WITH AN "items" ARRAY containing strictly logical sequential items.
   - Example: "meta": { "items": ["Step 1 / Event (Year 1)", "Step 2 / Event (Year 2)", "Step 3 / Event (Year 3)", "Step 4 / Event (Year 4)"] }

2. IF TYPE IS "match_following":
   - YOU MUST INCLUDE THE "meta" OBJECT WITH "left" AND "right" ARRAYS containing exactly matched pairs before option generation.
   - Example: "meta": { "left": ["A. Item 1", "B. Item 2"], "right": ["1. Pair 1", "2. Pair 2"] }

3. IF YOU DO NOT INCLUDE A "meta" OBJECT FOR SEQUENCE OR MATCH FOLLOWING:
   - YOU MUST SET "type": "mcq" INSTEAD OF "sequence" OR "match_following".

==================================================
CRITICAL CONSTRAINTS (STRICT COMPLIANCE):
==================================================
THINGS YOU MUST DO:
1. Return ONLY a raw valid JSON Array of question objects: [ { ... }, { ... } ].
2. Ensure EXACTLY 4 options for every question ("opt1", "opt2", "opt3", "opt4").
3. Ensure EXACTLY 1 correct answer referencing a valid option ID ("opt1", "opt2", "opt3", or "opt4").
4. Provide comprehensive explanations in ${language} detailing why the correct option is right and referencing standard textbook facts.
5. Ensure all questions are factual, accurate, and relevant to RPSC 2nd Grade syllabus.
6. Match the requested difficulty level (${difficultyText}).
7. Generate content strictly in the specified language (${language}).
8. Include required "meta" fields whenever using "sequence" or "match_following" types.


==================================================
CRITICAL QUESTION QUALITY & UNIQUENESS RULES:
==================================================

A. NEVER REVEAL THE ANSWER THROUGH QUESTION TEXT OR OPTIONS

1. The question itself MUST NOT reveal the correct answer, ranking, chronology, date, identity, or relationship that the candidate is supposed to determine.

2. Especially for questions asking:
   - "Which inscription is the oldest?"
   - "Which event occurred first?"
   - "Arrange the following in chronological order"
   - "Which ruler ruled earlier?"
   - "Which site is the oldest?"
   - "Which book was written first?"
   - "Which dynasty came earlier/later?"
   - "Which is the earliest/latest?"

   DO NOT write dates, years, reign periods, chronological labels, or other answer-revealing information directly after the item names in the question/options.

3. WRONG example:
   "Which of the following inscriptions is the oldest?"
   - Badli Inscription (443 BCE)
   - Ghosundi Inscription (2nd century BCE)
   - Ranakpur Prashasti (1439 CE)
   - Amer Inscription (1612 CE)

   This is INVALID because the dates immediately reveal the answer.

4. CORRECT approach:
   "Which of the following inscriptions is the oldest?"
   - Badli Inscription
   - Ghosundi Inscription
   - Ranakpur Prashasti
   - Amer Inscription

   The chronology must be determined by the candidate, not revealed inside the options.

5. HOWEVER, for a SEQUENCE question, dates may be included ONLY when they are necessary to establish the sequencing criterion and are explicitly part of the educational task.

6. Even in sequence questions, do not place the dates in a way that directly reveals the correct option before the candidate performs the required ordering.

7. NEVER put the answer, answer-key clue, explanation, date, definition, parenthetical hint, or identifying metadata inside the question text if it makes the question trivially solvable.

8. Question construction must preserve genuine assessment value. The candidate should need to recall, reason, compare, classify, or analyze the information.

==================================================
B. STRICT QUESTION UNIQUENESS
==================================================

1. EVERY question MUST be genuinely unique.

2. Do NOT repeatedly ask the same fact using slightly different wording.

3. Do NOT create multiple questions whose correct answer depends on the same single fact unless the questions test substantially different concepts.

4. Avoid:
   - Same fact + different wording
   - Same correct answer + superficial wording change
   - Same pair of facts repeatedly
   - Same chronology repeatedly
   - Same inscription/site/ruler/book repeatedly
   - Same question pattern repeatedly

5. Questions must vary in:
   - Knowledge point
   - Concept
   - Question construction
   - Reasoning requirement
   - Distractor strategy
   - Question type

6. Prefer covering different factual/conceptual areas of the provided source material rather than repeatedly selecting the most obvious or famous facts.

7. Do NOT overuse the same question type. When appropriate, intelligently mix MCQ, assertion-reason, statement-reason, match-following, sequence, true-false, table, etc.

==================================================
C. CROSS-TURN / PREVIOUS QUESTION UNIQUENESS
==================================================

IMPORTANT:

The user may generate questions in multiple batches within the SAME conversation.

For every new batch, you MUST treat all questions previously generated in the conversation as an exclusion set.

Example:

Batch 1:
Questions 1–10 are generated.

Batch 2:
The user asks for 10 more questions.

You MUST generate 10 NEW questions that are substantially different from Questions 1–10.

Batch 3:
The user asks for another 10 questions.

You MUST generate 10 NEW questions that are substantially different from ALL previously generated questions in the conversation, not merely different from the immediately preceding batch.

RULES:

1. Never intentionally repeat a previously generated question.

2. Never reuse the same fact with only superficial wording changes.

3. Never reuse the same question-answer relationship unless the new question tests a clearly different concept.

4. Before generating a new batch, internally compare the new questions against the previously generated questions available in the conversation.

5. Maintain a conceptual "used-question memory" for the current conversation.

6. If the user says:
   - "give me 10 more"
   - "another 10"
   - "generate 20 more"
   - "next set"
   - "continue"
   - "make another batch"

   automatically interpret this as:
   "Generate NEW questions that do not substantially overlap with any previously generated questions in this conversation."

7. Do NOT ask the user to provide the previous questions again when they are already available in the conversation.

8. If sufficient unique facts are available in the provided source material, prioritize unused facts/concepts.

==================================================
D. SOURCE-FIRST QUESTION GENERATION
==================================================

1. When source material/documentation is provided, use it as the primary knowledge base.

2. Prefer facts and concepts from unused portions of the source material when generating subsequent batches.

3. Do not repeatedly select the same small set of famous facts simply because they are easier to generate.

4. Explore the source systematically across different sections, topics, rulers, inscriptions, archaeological sites, books, dates, movements, concepts, and relationships.

5. Do not invent facts that are not supported by the provided source material.

==================================================
E. RESPONSE FORMAT — MANDATORY JSON OUTPUT
==================================================

The response MUST be returned in the structured JSON output format.

1. ALWAYS return the result as a valid JSON object/JSON response that can be rendered in the platform's JSON/code output box.

2. NEVER return the JSON as ordinary conversational text.

3. NEVER add explanatory text before or after the JSON.

4. NEVER use Markdown code fences such as:
   \`\`\`json
   [...]
   \`\`\`
`;
}