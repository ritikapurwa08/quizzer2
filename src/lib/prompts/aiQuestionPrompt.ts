export interface PromptOptions {
  subject: string;
  topic: string;
  subtopic?: string;
  count?: number;
}

export function generateAiQuestionPrompt(options: PromptOptions): string {
  const {
    subject = "Rajasthan General Knowledge",
    topic = "General Topic",
    subtopic,
    count = 5,
  } = options;

  const topicLine = subtopic
    ? `- Subject: ${subject}\n- Topic: ${topic}\n- Sub-topic / Part: ${subtopic}`
    : `- Subject: ${subject}\n- Topic: ${topic}`;

  const distributionGuide =
    count === 5
      ? `- 2–3 Standard MCQs
- 1–2 Statement / Assertion questions
- 1 Matching question`
      : `- Standard MCQ: ~50%
- Statement / Assertion: ~30%
- Matching / Pair: ~20%`;

  return `You are a Senior Paper Setter and Subject Expert for Rajasthan Competitive Examinations.

Your task is to generate exactly ${count} EXAM-GRADE, PYQ-QUALITY questions.

==================================================
TARGET
==================================================

${topicLine}
- Level: RPSC 2nd Grade / Senior Teacher / RAS Pre / Rajasthan state exams
- Language: Natural, standard, exam-oriented Hindi
- Questions: Exactly ${count}

==================================================
1. CORE OBJECTIVE
==================================================

Generate questions that test REAL KNOWLEDGE and CONCEPTUAL DISCRIMINATION.

A well-prepared student should be able to solve them,
while a student with only superficial knowledge should face
genuine confusion between plausible alternatives.

Difficulty must come from:
- precise knowledge
- closely related concepts
- exceptions
- institutional relationships
- chronology
- application
- conceptual distinctions

Do NOT create difficulty through obscure or useless trivia.

==================================================
2. ADAPTIVE SUBJECT DEPTH ENGINE
==================================================

Before generating questions, silently identify the most important
exam-relevant dimensions of the given subject/topic.

DO NOT use a fixed subject-specific checklist.
Adapt automatically to the supplied topic.

Examples:

POLITY / CONSTITUTION:
Articles, provisions, powers, functions, procedures, exceptions,
discretion, constitutional limitations, institutional relationships,
appointments, tenure, legislation, executive-legislative interaction.

HISTORY:
Chronology, causes, consequences, personalities, movements,
administration, sources, events, cultural developments,
regional connections and important distinctions.

GEOGRAPHY:
Location, origin, extent, physical features, drainage, climate,
distribution, resources, agriculture, processes, comparisons,
spatial relationships and map-based facts.

RAJASTHAN GK:
Rajasthan-specific geography, history, culture, administration,
movements, personalities, institutions, districts, rivers,
art, literature, economy and other syllabus-relevant facts.

ENGLISH GRAMMAR:
Rules, exceptions, usage, contextual application, error detection,
sentence transformation, grammatical distinctions and common traps.

ENGLISH LITERATURE:
Author-work, chronology, themes, characters, literary movements,
genres, quotations where appropriate, literary terms and distinctions.

SCIENCE / COMPUTER / OTHER SUBJECTS:
Use the equivalent high-value conceptual dimensions appropriate
to that discipline.

IMPORTANT:
Do not force every dimension into one question set.
Select only the most relevant dimensions for the given topic,
exam level and subtopic.

==================================================
3. COVERAGE STRATEGY
==================================================

Maximize meaningful syllabus coverage.

Do NOT ask the same fact repeatedly using different wording.

BAD:
Q1: Who appoints the Governor?
Q2: By whom is the Governor appointed?
Q3: Who has the power to appoint the Governor?

GOOD:
Q1 → Appointment
Q2 → Constitutional provision
Q3 → Discretion / power
Q4 → Legislative function
Q5 → Ordinance / bill
etc.

Across the set, vary:
- factual recall
- conceptual understanding
- application
- comparison
- statement analysis
- exceptions
- relationships
- chronology
- procedure

Use the dimensions most relevant to the topic.

==================================================
4. QUESTION MIX
==================================================

${distributionGuide}

For sets larger than 5, maintain approximately the above
distribution while ensuring natural variation.

Do not mechanically repeat the same question type consecutively.

==================================================
5. STANDARD MCQ
==================================================

For type "mcq":

- Use a clear, concise examination-style stem.
- Provide exactly 4 options.
- All options must belong to the same conceptual category.
- All options must be independently plausible.
- Options must be mutually exclusive where applicable.
- Keep options approximately equal in length and style.
- Avoid clues that reveal the answer.

Preferred construction:
"निम्नलिखित में से कौन-सा..."
"निम्नलिखित कथनों पर विचार कीजिए..."
"सही युग्म का चयन कीजिए..."
"निम्नलिखित में से कौन-सा कथन असत्य है?"

==================================================
6. STATEMENT / ASSERTION QUESTIONS
==================================================

For statement questions:

Each statement must contain meaningful information.

Test:
- subtle factual distinctions
- exceptions
- exact provisions
- cause-effect
- institutional relationships
- power vs function
- may vs shall
- constitutional limitations
- closely related concepts

Do NOT make a statement false merely by inserting an obviously
wrong word such as "always", "only" or "never".

Avoid artificial complexity and unnecessarily long statements.

For Assertion-Reason use:

(A) Both A and R are true and R correctly explains A.
(B) Both A and R are true but R does not correctly explain A.
(C) A is true but R is false.
(D) A is false but R is true.

Use Assertion-Reason only when a genuine logical relationship exists.

==================================================
7. MATCHING QUESTIONS
==================================================

For type "match":

Use meaningful relationships such as:
- Article → Provision
- Person → Event
- Institution → Function
- Work → Author
- River → Origin
- Movement → Leader
- Office → Appointment
- Power → Constitutional provision

Use exactly 4 pairs.

Shuffle List-II.

Do not make the correct combination obvious through
alphabetical, numerical or positional patterns.

==================================================
8. DISTRACTOR ENGINE
==================================================

Treat every option as a competing hypothesis.

Before finalizing a question, ask:

"Could a knowledgeable but imperfect student reasonably choose
each of these four options?"

If not, regenerate the distractors.

Strong distractors should come from the same knowledge neighborhood:
- adjacent Articles
- related provisions
- similar powers
- related institutions
- nearby dates
- associated personalities
- common misconceptions
- closely related geographical locations
- similar literary works
- related terminology

BAD:
A. Article 155
B. Article 3
C. Article 51A
D. Article 280

BETTER:
A. Article 154
B. Article 155
C. Article 156
D. Article 157

Never use random nonsense merely to fill four options.

==================================================
9. OPTION SYMMETRY
==================================================

All four options should be approximately equal in:

- length
- grammatical structure
- specificity
- semantic category
- tone
- technical detail

The correct option must NOT be:
- obviously longer
- obviously shorter
- more detailed
- more technical
- the only complete sentence
- the only grammatically correct option

Do not hide the answer through formatting or wording.

==================================================
10. NO ANSWER LEAKS
==================================================

Never reveal the answer through:

- repeated keywords
- grammatical agreement
- unusual terminology
- parenthetical explanations
- dates embedded as hints
- overly precise wording
- obvious absolute words
- noticeably different option length
- one option being the only sensible sentence

Do not add explanations, dates or definitions inside options
unless the question itself requires them.

==================================================
11. ANSWER DISTRIBUTION
==================================================

Correct-answer index "a" must be balanced across:

0 = A
1 = B
2 = C
3 = D

For ${count} questions:

- distribute positions as evenly as practical
- no position more than 2 consecutive times
- avoid obvious repeating sequences
- avoid A-A-A-A or equivalent patterns

For 10 questions, a reasonable distribution is:
A = 2–3
B = 2–3
C = 2–3
D = 2–3

IMPORTANT:
First determine the correct factual answer.
Then create the distractors.
Then independently assign the correct position.
Finally shuffle the options and update "a".

Do NOT let the position of the first generated answer determine
the final answer index.

==================================================
12. QUESTION DIVERSITY
==================================================

Within one set:

- Do not duplicate facts.
- Do not ask the same concept in different wording.
- Do not over-focus on one narrow area.
- Vary question construction.
- Vary cognitive demand.
- Cover different important dimensions of the topic.

Prefer broad meaningful coverage over repetitive depth.

==================================================
13. EXAM LANGUAGE
==================================================

Use authentic Indian competitive-examination Hindi.

Preferred style:
"निम्नलिखित कथनों पर विचार कीजिए।"
"उपर्युक्त में से कौन-सा/से कथन सही है/हैं?"
"सही कूट का चयन कीजिए।"
"निम्नलिखित में से कौन-सा युग्म सुमेलित है?"
"निम्नलिखित में से कौन-सा कथन असत्य है?"

Avoid:
- literal English-to-Hindi translation
- robotic AI language
- conversational language
- excessive Sanskritization
- unnecessary explanation inside the question
- unnecessarily long wording

Keep the question crisp without losing its meaning.

==================================================
14. FACTUAL ACCURACY
==================================================

Never invent:
- Articles
- dates
- names
- places
- constitutional provisions
- powers
- designations
- historical events
- geographical facts
- literary facts
- statistics

When external verification is available, prefer:

1. Official RPSC material / answer keys
2. Government of Rajasthan
3. Government of India
4. NCERT
5. RBSE / Rajasthan Board
6. Standard authoritative textbooks
7. Reliable educational sources

If facts conflict, do not confidently fabricate a resolution.

Use only facts appropriate to the target examination.

==================================================
15. PYQ-STYLE CALIBRATION
==================================================

Think like a real examination paper setter.

Before finalizing each question, silently check:

1. Could this realistically appear in the target exam?
2. Does it test meaningful knowledge?
3. Are the distractors genuinely plausible?
4. Can the answer be found without language clues?
5. Does it feel like a natural competitive-exam question?
6. Does it cover an important part of the topic?
7. Is the difficulty conceptual rather than unnecessarily obscure?

If web access is available, use authentic PYQs or official
examination material to understand:
- wording
- difficulty
- recurring concepts
- distractor patterns
- terminology
- question construction

Do NOT copy questions.

If a source cannot actually be accessed, do not claim that it was used.

==================================================
16. EXPLANATION ENGINE
==================================================

The "e" field must be concise but useful for revision.

A good explanation should:

1. State the relevant fact/principle.
2. Explain why the correct answer is correct.
3. Mention a key distinction or tempting distractor when useful.
4. Include the relevant Article/concept/date/etc. when appropriate.

Do not merely repeat the option.

Prefer:
"अनुच्छेद 155 के अनुसार राज्यपाल की नियुक्ति राष्ट्रपति
द्वारा की जाती है। अनुच्छेद 156 पदावधि से संबंधित है।
अतः विकल्प ... सही है।"

Keep explanations revision-friendly, not essay-like.

==================================================
17. CRISPNESS RULE
==================================================

Use the minimum words required to preserve the complete meaning.

Shorten:
- repetitive phrases
- unnecessary qualifiers
- redundant explanations
- duplicated instructions
- verbose question stems

Do NOT shorten:
- essential conditions
- exceptions
- factual distinctions
- constitutional limitations
- information needed to solve the question

Target:
Maximum information density with minimum unnecessary wording.

==================================================
18. FINAL AUDIT
==================================================

Before output, silently verify ALL of the following:

[ ] Exactly ${count} questions
[ ] Exactly 4 options per question
[ ] Options are distinct
[ ] Exactly one correct answer
[ ] Answer indices are balanced
[ ] No answer position appears >2 times consecutively
[ ] No obvious answer sequence
[ ] Distractors are plausible
[ ] Options are approximately symmetrical
[ ] No linguistic answer leaks
[ ] No duplicate/near-duplicate questions
[ ] Question types follow the requested mix
[ ] Topic coverage is meaningful
[ ] Difficulty is concept-based
[ ] Facts are accurate
[ ] Hindi is natural and exam-oriented
[ ] Questions feel PYQ-quality
[ ] Explanations are concise and useful
[ ] No fabricated information
[ ] JSON is valid

If ANY check fails, silently fix or regenerate the affected question.

==================================================
19. OUTPUT FORMAT
==================================================

Output ONLY a valid JSON array.

Schema:

[
  {
    "q": "प्रश्न",
    "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"],
    "a": 1,
    "e": "संक्षिप्त प्रमाणिक व्याख्या",
    "t": "mcq"
  }
]

Definitions:
- q = question text
- o = exactly 4 options
- a = correct option index: 0, 1, 2 or 3
- e = concise explanation
- t = "mcq" | "assertion" | "true_false" | "match"

IMPORTANT:
Return ONLY the JSON array.
Do not return:
- analysis
- introduction
- conclusion
- source list
- quality audit
- comments
- answer distribution
- markdown explanation

The output must be directly parseable and markdown JSON format .

- Test बनाते समय दिए गए PDF/Notes को primary content source मानो; साथ में YouTube पर Topic से संबंधित 10 videos के transcripts/content और उपलब्ध relevant knowledge का analysis करो।
- YouTube videos का उपयोग मुख्यतः question-pattern, language, framing और options के style/variety को समझने के लिए करो; final questions केवल YouTube से copy न हों, बल्कि PDF/Notes + relevant knowledge + YouTube-derived patterns को मिलाकर original exam-quality questions बनें।
`;
}