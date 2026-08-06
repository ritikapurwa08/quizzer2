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
    questionText: "What is the capital of Rajasthan?",
    options: [
      { id: "opt1", text: "Jodhpur" },
      { id: "opt2", text: "Jaipur" },
      { id: "opt3", text: "Udaipur" },
      { id: "opt4", text: "Kota" }
    ],
    correctAnswer: "opt2",
    explanation: "Jaipur is the capital city of Rajasthan.",
    difficulty: "easy",
    reference: "Rajasthan Geography"
  },
  sequence: {
    type: "sequence",
    questionText: "Arrange the following acts in chronological order (oldest to newest):",
    options: [
      { id: "opt1", text: "Regulating Act (1773) → Pitt's India Act (1784) → Charter Act (1813) → Charter Act (1833)" },
      { id: "opt2", text: "Pitt's India Act (1784) → Regulating Act (1773) → Charter Act (1833) → Charter Act (1813)" },
      { id: "opt3", text: "Regulating Act (1773) → Charter Act (1813) → Pitt's India Act (1784) → Charter Act (1833)" },
      { id: "opt4", text: "Charter Act (1813) → Regulating Act (1773) → Pitt's India Act (1784) → Charter Act (1833)" }
    ],
    correctAnswer: "opt1",
    explanation: "Chronological order: Regulating Act (1773) -> Pitt's India Act (1784) -> Charter Act (1813) -> Charter Act (1833).",
    difficulty: "medium",
    reference: "Constitutional Development",
    meta: {
      items: [
        "Regulating Act (1773)",
        "Pitt's India Act (1784)",
        "Charter Act (1813)",
        "Charter Act (1833)"
      ]
    }
  },
  match_following: {
    type: "match_following",
    questionText: "Match List-I with List-II correctly:",
    options: [
      { id: "opt1", text: "A-2, B-1, C-4, D-3" },
      { id: "opt2", text: "A-1, B-2, C-3, D-4" },
      { id: "opt3", text: "A-3, B-1, C-2, D-4" },
      { id: "opt4", text: "A-4, B-3, C-1, D-2" }
    ],
    correctAnswer: "opt1",
    explanation: "Warren Hastings -> 1st Governor-General of Bengal (A-2), Sir Elijah Impey -> 1st Chief Justice (B-1)...",
    difficulty: "medium",
    reference: "Constitutional Development",
    meta: {
      left: ["A. Warren Hastings", "B. Sir Elijah Impey", "C. Lord William Bentinck", "D. Lord Macaulay"],
      right: ["1. First Chief Justice", "2. First Governor-General of Bengal", "3. First Law Member", "4. First Governor-General of India"]
    }
  },
  statement_reason: {
    type: "statement_reason",
    questionText: "Statement (A): Board of Control was established by Pitt's India Act 1784.\n\nReason (R): It aimed to establish British government control over political affairs.",
    options: [
      { id: "opt1", text: "Both A and R are true and R is the correct explanation of A." },
      { id: "opt2", text: "Both A and R are true but R is NOT the correct explanation of A." },
      { id: "opt3", text: "A is true but R is false." },
      { id: "opt4", text: "A is false but R is true." }
    ],
    correctAnswer: "opt1",
    explanation: "Board of Control was established in 1784 specifically for political oversight.",
    difficulty: "medium",
    reference: "Pitt's India Act 1784"
  }
};

export function generateAiQuestionPrompt(options: PromptOptions): string {
  const {
    subject,
    topic,
    difficulty = "mixed",
    language = "English",
    count = 10,
  } = options;

  const difficultyText =
    difficulty === "any" || difficulty === "mixed" || !difficulty
      ? "Balanced mix of easy, medium, and hard difficulty questions"
      : `${difficulty.toUpperCase()} difficulty only`;

  return `You are an expert educational content creator and assessment generator.

Generate exactly ${count} high-quality, accurate, and unique questions for competitive examinations.

==================================================
TARGET SPECIFICATIONS:
==================================================
- Subject: ${subject || "General Knowledge"}
- Topic: ${topic || "General"}
- Language: ${language}
- Difficulty Level: ${difficultyText}
- Number of Questions: ${count}

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
   - YOU MUST INCLUDE THE "meta" OBJECT WITH AN "items" ARRAY.
   - Example: "meta": { "items": ["Step 1", "Step 2", "Step 3", "Step 4"] }

2. IF TYPE IS "match_following":
   - YOU MUST INCLUDE THE "meta" OBJECT WITH "left" AND "right" ARRAYS.
   - Example: "meta": { "left": ["A. Item 1", "B. Item 2"], "right": ["1. Def 1", "2. Def 2"] }

3. IF YOU DO NOT INCLUDE A "meta" OBJECT FOR SEQUENCE OR MATCH FOLLOWING:
   - YOU MUST SET "type": "mcq" INSTEAD OF "sequence" OR "match_following".

==================================================
CRITICAL RULES & CONSTRAINTS:
==================================================
THINGS YOU MUST DO:
1. Return ONLY a raw valid JSON Array of question objects: [ { ... }, { ... } ].
2. Ensure EXACTLY 4 options for every question ("opt1", "opt2", "opt3", "opt4").
3. Ensure EXACTLY 1 correct answer referencing a valid option ID ("opt1", "opt2", "opt3", or "opt4").
4. Provide comprehensive explanations in ${language}.
5. Ensure all questions are factual, accurate, and unique.
6. Match the requested difficulty level (${difficultyText}).
7. Generate content strictly in the specified language (${language}).
8. Include required "meta" fields whenever using "sequence" or "match_following" types.

THINGS YOU MUST NOT DO:
1. DO NOT wrap the response in Markdown code blocks (NO \`\`\`json or \`\`\` fences).
2. DO NOT include top-level "subject", "topic", or "testSet" keys in the JSON.
3. DO NOT write any introductory text, greeting, commentary, or explanation outside the JSON.
4. DO NOT write any closing remarks or notes outside the JSON.
5. DO NOT number questions outside the JSON array structure.
6. DO NOT invent new JSON fields not present in the schema.
7. DO NOT omit required question fields ("type", "questionText", "options", "correctAnswer", "difficulty").
8. DO NOT use "sequence" or "match_following" without including the required "meta" object.
`;
}
