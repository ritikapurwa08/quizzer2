import { generateAiQuestionPrompt } from "../lib/prompts/aiQuestionPrompt";
import { validateGeminiComposition } from "../lib/validators/question";
import { validateQuestionBank, QuestionForValidation } from "../lib/questionQualityValidator";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`[PASS] ${msg}`);
}

console.log("================================================================================");
console.log("TESTING STATEMENT PATTERN CONTRACT & 16:4 QUESTION ENGINE");
console.log("================================================================================");

// 1. Verify Prompt contains Statement-Based Question Rules
const prompt = generateAiQuestionPrompt({
  subject: "राजस्थान का इतिहास",
  topic: "1857 की क्रांति",
  count: 20,
});

assert(
  prompt.includes("CRITICAL FIX: STATEMENT-BASED QUESTION TRUTH-PATTERN DIVERSITY"),
  "Prompt contains dedicated Statement-Based Question Truth-Pattern Diversity section"
);
assert(
  prompt.includes("TRUE / TRUE / FALSE") &&
  prompt.includes("TRUE / FALSE / TRUE") &&
  prompt.includes("FALSE / TRUE / TRUE"),
  "Prompt outlines diverse 3-statement truth combinations"
);
assert(
  prompt.includes("Do NOT repeatedly make all statements true"),
  "Prompt explicitly bans repeatedly making all statements true"
);
assert(
  prompt.includes("Do NOT repeatedly make two statements true"),
  "Prompt explicitly bans repeatedly making two statements true"
);
assert(
  prompt.includes("natural truth-pattern diversity"),
  "Prompt verification checklist includes statement truth-pattern diversity"
);
assert(
  prompt.includes("Every statement is independently verifiable with clear factual truth/false status"),
  "Prompt verification checklist includes clear independent factual status rule"
);

// 2. Build a high-quality 20-question test set with Diverse Statement Questions
const diverseSet: QuestionForValidation[] = [];

// 16 Original PYQs
for (let i = 1; i <= 16; i++) {
  diverseSet.push({
    questionText: `1857 की क्रांति के संदर्भ में प्रामाणिक परीक्षा प्रश्न #${i}: राजस्थान में क्रांति का प्रारम्भ कहाँ हुआ?`,
    options: [
      { id: "opt1", text: "नसीराबाद" },
      { id: "opt2", text: "नीमच" },
      { id: "opt3", text: "एरिनपुरा" },
      { id: "opt4", text: "कोटा" },
    ],
    correctAnswer: "opt1",
    type: "mcq",
    difficulty: "medium",
    sourceType: "PYQ",
    sourceQuestionId: 8000 + i,
    exam: "RPSC RAS 2021",
    explanation: "राजस्थान में 1857 की क्रांति का सूत्रपात 28 मई 1857 को नसीराबाद छावनी से हुआ था।",
  });
}

// 4 Genuinely New AI Questions with Diverse Statement Truth Patterns
// AI Q1: 3 statements with pattern TRUE / FALSE / TRUE -> "केवल 1 और 3 सही हैं"
diverseSet.push({
  questionText: "1857 की क्रांति के दौरान मेवाड़ रियासत के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:\n1. उस समय मेवाड़ के महाराणा स्वरूप सिंह थे।\n2. मेजर बर्टन मेवाड़ के पॉलिटिकल एजेंट थे।\n3. मेवाड़ महाराणा ने अंग्रेजों को शरण तथा सुरक्षा प्रदान की।\nउपर्युक्त कथनों में से कौन-सा/से सही है/हैं?",
  options: [
    { id: "opt1", text: "केवल 1 और 2" },
    { id: "opt2", text: "केवल 1 और 3" },
    { id: "opt3", text: "1, 2 और 3" },
    { id: "opt4", text: "केवल 2" },
  ],
  correctAnswer: "opt2", // Pattern: T / F / T -> Option 2 (केवल 1 और 3)
  type: "mcq",
  difficulty: "medium",
  sourceType: "AI_NEW",
  sourceQuestionId: undefined,
  exam: undefined,
  explanation: "कथन 1 सत्य है (महाराणा स्वरूप सिंह थे)। कथन 2 असत्य है क्योंकि मेजर बर्टन कोटा के पॉलिटिकल एजेंट थे (मेवाड़ के कैप्टन शावर्स थे)। कथन 3 सत्य है क्योंकि स्वरूप सिंह ने जगमंदिर में अंग्रेज परिवारों को सुरक्षा दी। अतः केवल 1 और 3 सही हैं।",
});

// AI Q2: 2 statements with pattern FALSE / TRUE -> "केवल 2 सही है"
diverseSet.push({
  questionText: "कोटा में 1857 के विद्रोह के संबंध में निम्नलिखित कथनों पर विचार कीजिए:\n1. कोटा में विद्रोह का नेतृत्व ठाकुर कुशाल सिंह ने किया था।\n2. जयदयाल और मेहराब खां ने कोटा में क्रांति का नेतृत्व किया।\nउपर्युक्त कथनों में से कौन-सा कथन सही है?",
  options: [
    { id: "opt1", text: "केवल 1" },
    { id: "opt2", text: "केवल 2" },
    { id: "opt3", text: "1 और 2 दोनों" },
    { id: "opt4", text: "न तो 1 और न ही 2" },
  ],
  correctAnswer: "opt2", // Pattern: F / T -> Option 2 (केवल 2)
  type: "mcq",
  difficulty: "medium",
  sourceType: "AI_NEW",
  sourceQuestionId: undefined,
  exam: undefined,
  explanation: "कथन 1 असत्य है क्योंकि ठाकुर कुशाल सिंह ने आउवा (पाली) में नेतृत्व किया था। कथन 2 सत्य है क्योंकि कोटा में क्रांति का नेतृत्व लाला जयदयाल और रिसालदार मेहराब खां ने किया था।",
});

// AI Q3: 3 statements with pattern TRUE / TRUE / FALSE -> "केवल 1 और 2 सही हैं"
diverseSet.push({
  questionText: "एरिनपुरा छावनी में 1857 के विद्रोह के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:\n1. यहाँ विद्रोह 21 अगस्त 1857 को हुआ।\n2. विद्रोही सैनिकों ने 'चलो दिल्ली मारो फिरंगी' का नारा दिया।\n3. यह विद्रोह मेजर बर्टन की हत्या के बाद समाप्त हुआ।\nउपर्युक्त में से कौन-सा/से कथन सत्य है/हैं?",
  options: [
    { id: "opt1", text: "केवल 1 और 2" },
    { id: "opt2", text: "केवल 2 और 3" },
    { id: "opt3", text: "1, 2 और 3" },
    { id: "opt4", text: "केवल 1" },
  ],
  correctAnswer: "opt1", // Pattern: T / T / F -> Option 1 (केवल 1 और 2)
  type: "mcq",
  difficulty: "hard",
  sourceType: "AI_NEW",
  sourceQuestionId: undefined,
  exam: undefined,
  explanation: "कथन 1 और 2 सत्य हैं (21 अगस्त 1857 को जोधपुर लीजियन के सैनिकों ने नारा दिया)। कथन 3 असत्य है क्योंकि मेजर बर्टन की हत्या कोटा में हुई थी, एरिनपुरा में नहीं।",
});

// AI Q4: Standard conceptual MCQ testing understanding
diverseSet.push({
  questionText: "राजस्थान में 1857 की क्रांति के समय ब्रिटिश पॉलिटिकल एजेंटों के संबंध में कौन-सा युग्म सही सुमेलित नहीं है?",
  options: [
    { id: "opt1", text: "मेवाड़ — कैप्टन शावर्स" },
    { id: "opt2", text: "मारवाड़ — मैक मेसन" },
    { id: "opt3", text: "जयपुर — कर्नल ईडन" },
    { id: "opt4", text: "भरतपुर — मेजर निक्सन" },
  ],
  correctAnswer: "opt4",
  type: "mcq",
  difficulty: "medium",
  sourceType: "AI_NEW",
  sourceQuestionId: undefined,
  exam: undefined,
  explanation: "भरतपुर का पॉलिटिकल एजेंट मॉरिसन (Morrison) था। अतः युग्म (4) सुमेलित नहीं है।",
});

// 3. Test validateGeminiComposition
const compQuestions = diverseSet.map((q) => ({
  type: "mcq" as const,
  questionText: q.questionText,
  options: q.options,
  correctAnswer: q.correctAnswer,
  explanation: q.explanation,
  sourceType: q.sourceType,
  sourceQuestionId: q.sourceQuestionId,
  exam: q.exam,
}));

const compResult = validateGeminiComposition(compQuestions);
assert(compResult.isValid, "validateGeminiComposition passes for diverse 16 PYQ + 4 AI_NEW set");
assert(compResult.pyqCount === 16, "Composition has exactly 16 PYQ");
assert(compResult.pyqModifiedCount === 0, "Composition has exactly 0 PYQ_MODIFIED");
assert(compResult.aiNewCount === 4, "Composition has exactly 4 AI_NEW");
assert(compResult.errors.length === 0, "No composition errors returned");

// 4. Test validateQuestionBank for Quality, Provenance, and Diversity
const bankReport = validateQuestionBank(diverseSet);
const statementPatternIssues = bankReport.issues.filter(
  (i) => i.code === "STATEMENT_PATTERN_REPETITION"
);
assert(
  statementPatternIssues.length === 0,
  "Diverse statement question patterns do NOT trigger STATEMENT_PATTERN_REPETITION warning"
);
assert(
  bankReport.stats.sourceTypeDistribution.PYQ === 16,
  "Report tracks 16 PYQ"
);
assert(
  bankReport.stats.sourceTypeDistribution.AI_NEW === 4,
  "Report tracks 4 AI_NEW"
);
assert(
  bankReport.stats.sourceTypeDistribution.PYQ_MODIFIED === 0,
  "Report tracks 0 PYQ_MODIFIED"
);

// 5. Verify that repetitive "all true" pattern IS flagged when present
const repetitiveStatementSet: QuestionForValidation[] = diverseSet.map((q, idx) => {
  if (idx >= 16) {
    // Force repetitive "all true" answers on all statement questions
    return {
      ...q,
      options: [
        { id: "opt1", text: "केवल 1" },
        { id: "opt2", text: "केवल 2" },
        { id: "opt3", text: "1, 2 और 3 (सभी कथन सही हैं)" },
        { id: "opt4", text: "कोई नहीं" },
      ],
      correctAnswer: "opt3",
    };
  }
  return q;
});

const repReport = validateQuestionBank(repetitiveStatementSet);
const repIssues = repReport.issues.filter(
  (i) => i.code === "STATEMENT_PATTERN_REPETITION"
);
assert(
  repIssues.length > 0,
  "STATEMENT_PATTERN_REPETITION warning is raised when ALL statement questions have 'all true' answers"
);

console.log("================================================================================");
console.log("STATEMENT PATTERN CONTRACT VERIFICATION COMPLETE: ALL CHECKS PASSED!");
console.log("================================================================================");
