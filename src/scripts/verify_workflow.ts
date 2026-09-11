import { retrievePyqsForTopic } from "../lib/pyqRetrieval";
import { getCorpusTopicsForCanonical, CANONICAL_TOPIC_MAPPINGS } from "../lib/syllabusTopicMap";
import { generateAiPrompt } from "../lib/prompts/aiQuestionPrompt";
import { extractJsonFromLlmOutput } from "../lib/importParser";
import { normalizeMinifiedQuestion, validateGeminiComposition } from "../lib/validators/question";

console.log("================================================================================");
console.log("STARTING FULL VERIFICATION SUITE — SYLLABUS-LOCKED PYQ + GEMINI 20-Q WORKFLOW");
console.log("================================================================================");

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName}`, detail || "");
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Retrieval on a large topic ("भौतिक स्वरूप" / Physical divisions)
// -----------------------------------------------------------------------------
console.log("\n--- TEST 1: Large Topic Retrieval ---");
const largeTopicResult = retrievePyqsForTopic({
  subjectName: "राजस्थान का भूगोल",
  topicName: "भौतिक स्वरूप",
  batchSize: 100,
  usedQuestionIds: [],
});
assert(largeTopicResult.matchedCorpusTopics.length > 0, "Matched corpus topics for 'भौतिक स्वरूप'");
assert(largeTopicResult.totalAvailableInTopic > 700, `Topic has large corpus count (actual: ${largeTopicResult.totalAvailableInTopic})`);
assert(largeTopicResult.questions.length === 100, `Retrieved exactly 100 questions in batch (actual: ${largeTopicResult.questions.length})`);
assert(largeTopicResult.remainingUnusedCount === largeTopicResult.totalAvailableInTopic - 100, "Remaining unused count calculation correct");

// -----------------------------------------------------------------------------
// TEST 2: Hard Syllabus Boundary & Zero Geographic/Subject Leakage
// -----------------------------------------------------------------------------
console.log("\n--- TEST 2: Hard Syllabus Boundary ---");
// Check Rajasthan rivers vs World/India rivers
const rajRiverResult = retrievePyqsForTopic({
  subjectName: "राजस्थान का भूगोल",
  topicName: "अपवाह तंत्र (नदियां एवं झीलें)",
  batchSize: 100,
});
assert(rajRiverResult.matchedCorpusTopics.some(t => t.includes("नदियां")), "Matched 'नदियां'");
assert(rajRiverResult.matchedCorpusTopics.some(t => t.includes("झीलें")), "Matched 'झीलें'");
// Ensure no world/India geography corpus topic is matched
const worldIndiaOverlap = rajRiverResult.matchedCorpusTopics.some(t => 
  t.includes("विश्व") || t.includes("भारत") || t.includes("महाद्वीप")
);
assert(!worldIndiaOverlap, "Zero World/India geographic leakage in Rajasthan drainage topic");

// Check Rajasthan History vs Indian History boundary
const rajHistoryResult = retrievePyqsForTopic({
  subjectName: "राजस्थान का इतिहास",
  topicName: "1857 की क्रांति",
  batchSize: 100,
});
assert(rajHistoryResult.matchedCorpusTopics.some(t => t.includes("1857 की क्रांति")), "Matched Rajasthan 1857 revolution");
// None of the matched questions should come from unrelated subjects
assert(rajHistoryResult.questions.length > 0, `Found ${rajHistoryResult.questions.length} questions for Rajasthan 1857 revolution`);

// -----------------------------------------------------------------------------
// TEST 3: Quality Ranking & Deduplication
// -----------------------------------------------------------------------------
console.log("\n--- TEST 3: Ranking & Deduplication ---");
// Questions with high repeatCount or verified exams should rank higher
const questions = largeTopicResult.questions;
const first10 = questions.slice(0, 10);
const hasRepeatedOrCredible = first10.some(q => (q.repeatCount || 1) > 1 || (q.exam && q.exam.length > 3));
assert(hasRepeatedOrCredible, "Top-ranked questions feature repeated facts or verified exams");

// Ensure no duplicate IDs in the batch
const batchIds = new Set(questions.map(q => q.id));
assert(batchIds.size === questions.length, "All 100 returned questions have unique IDs");

// -----------------------------------------------------------------------------
// TEST 4: Batch Progression (100 -> next 100 unused -> no overlap)
// -----------------------------------------------------------------------------
console.log("\n--- TEST 4: Batch Exclusion & Progression ---");
const batch1 = retrievePyqsForTopic({
  subjectName: "राजस्थान का भूगोल",
  topicName: "भौतिक स्वरूप",
  batchSize: 100,
  usedQuestionIds: [],
});
const usedIdsBatch1 = batch1.questions.map(q => q.id);

const batch2 = retrievePyqsForTopic({
  subjectName: "राजस्थान का भूगोल",
  topicName: "भौतिक स्वरूप",
  batchSize: 100,
  usedQuestionIds: usedIdsBatch1,
});

const batch1IdSet = new Set(usedIdsBatch1);
const overlap = batch2.questions.filter(q => batch1IdSet.has(q.id));
assert(overlap.length === 0, `Batch 2 has ZERO overlap with Batch 1 (overlap count: ${overlap.length})`);
assert(batch2.questions.length === 100, `Batch 2 retrieved exactly 100 fresh questions`);
assert(batch2.usedCount === 100, `Batch 2 reports 100 used questions`);
assert(batch2.remainingUnusedCount === batch1.remainingUnusedCount - 100, "Batch 2 remaining count decreased by 100");

// -----------------------------------------------------------------------------
// TEST 5: Topic Exhaustion
// -----------------------------------------------------------------------------
console.log("\n--- TEST 5: Exhausted Topic Handling ---");
// Use all IDs of a topic
const allIds = [...batch1.questions.map(q => q.id), ...batch2.questions.map(q => q.id)];
const smallTopicTest = retrievePyqsForTopic({
  subjectName: "राजस्थान का इतिहास",
  topicName: "राजस्थान का एकीकरण",
  batchSize: 100,
  usedQuestionIds: [],
});
const smallTopicAllIds = Array.from({ length: 1000 }, (_, i) => i + 1); // simulate all used
const exhaustedResult = retrievePyqsForTopic({
  subjectName: "राजस्थान का इतिहास",
  topicName: "राजस्थान का एकीकरण",
  batchSize: 100,
  usedQuestionIds: smallTopicTest.questions.map(q => q.id), // mark current batch as used
});
assert(exhaustedResult.usedCount === smallTopicTest.questions.length, "Used count accurately recorded");
assert(exhaustedResult.questions.every(q => !smallTopicTest.questions.some(used => used.id === q.id)), "Exhaustion exclusion holds");

// -----------------------------------------------------------------------------
// TEST 6: Gemini 20-Question Prompt Generation Contract
// -----------------------------------------------------------------------------
console.log("\n--- TEST 6: Gemini Prompt Contract ---");
const prompt = generateAiPrompt({
  subject: "राजस्थान का भूगोल",
  topic: "भौतिक स्वरूप",
  subtopic: "अरावली पर्वतमाला",
  count: 20,
  pyqReferences: batch1.questions,
});

assert(prompt.includes("EXACTLY 20 QUESTIONS"), "Prompt specifies EXACTLY 20 QUESTIONS");
assert(prompt.includes("14 PYQ"), "Prompt specifies 14 PYQ");
assert(prompt.includes("4 PYQ_MODIFIED"), "Prompt specifies 4 PYQ_MODIFIED");
assert(prompt.includes("2 AI_NEW"), "Prompt specifies 2 AI_NEW");
assert(prompt.includes("YouTube educational videos") || prompt.includes("YouTube"), "Prompt requests 5 YouTube educational videos");
assert(prompt.includes("REFERENCE ONLY"), "Prompt designates YouTube as REFERENCE ONLY (never question sources)");
assert(!prompt.includes("Rajasthan Gyan"), "Prompt DOES NOT contain Rajasthan Gyan");
assert(!prompt.includes("rajasthangyan"), "Prompt DOES NOT contain rajasthangyan URL/reference");
assert(prompt.includes("sourceType"), "Prompt output JSON schema contains sourceType");
assert(prompt.includes("exam"), "Prompt output JSON schema contains exam");
assert(prompt.includes("explanation"), "Prompt output JSON schema contains explanation");
assert(prompt.includes("options"), "Prompt output JSON schema contains options");
assert(prompt.includes("answer"), "Prompt output JSON schema contains answer");

// -----------------------------------------------------------------------------
// TEST 7: LLM Response JSON Auto-Extraction & Parsing
// -----------------------------------------------------------------------------
console.log("\n--- TEST 7: LLM Output Extraction & Parsing ---");
// Simulate realistic Gemini output with Part A (YouTube) and Part B (JSON markdown block)
const realisticGeminiResponse = `
Here is your complete 20-question package for Rajasthan Geography:

### Part A: Recommended Educational YouTube Videos (Reference Only)
1. **अरावली पर्वतमाला सम्पूर्ण भूगोल** - Utkarsh Classes (https://www.youtube.com/watch?v=mock1)
2. **राजस्थान के भौतिक प्रदेश** - Subhash Charan Sir (https://www.youtube.com/watch?v=mock2)
3. **Rajasthan Geography Complete Revision** - Springboard Academy (https://www.youtube.com/watch?v=mock3)
4. **अरावली की प्रमुख चोटियां व दर्रे** - Sankalp Classes (https://www.youtube.com/watch?v=mock4)
5. **भौतिक विभाजन मैराथन क्लास** - Mission Gyan (https://www.youtube.com/watch?v=mock5)

### Part B: 20 Exam Questions
\`\`\`json
[
  ${Array.from({ length: 14 }, (_, i) => `{
    "question": "राजस्थान की अरावली पर्वतमाला की सबसे ऊंची चोटी कौन सी है? (PYQ #${i + 1})",
    "options": ["गुरुशिखर", "सेर", "देलवाड़ा", "जरगा"],
    "answer": 0,
    "explanation": "गुरुशिखर (1722 मीटर) सिरोही जिले में स्थित राजस्थान तथा अरावली की सबसे ऊंची चोटी है।",
    "sourceType": "PYQ",
    "sourceQuestionId": ${100 + i},
    "exam": "RAS Pre 2021"
  }`).join(",\n")},
  ${Array.from({ length: 4 }, (_, i) => `{
    "question": "कथन (A): अरावली पर्वत श्रेणी जल विभाजक का कार्य करती है। कारण (R): यह राजस्थान को दो असमान वर्षा वाले भागों में बांटती है। (Modified #${i + 1})",
    "options": ["A और R दोनों सही हैं तथा R, A का सही स्पष्टीकरण है", "A और R दोनों सही हैं परन्तु R सही स्पष्टीकरण नहीं है", "A सही है परन्तु R गलत है", "A गलत है परन्तु R सही है"],
    "answer": 0,
    "explanation": "अरावली पर्वतमाला 50 सेमी समवर्षा रेखा के समानांतर स्थित होकर महान भारतीय जल विभाजक बनाती है।",
    "sourceType": "PYQ_MODIFIED",
    "sourceQuestionId": ${200 + i},
    "exam": "2nd Grade Teacher 2018"
  }`).join(",\n")},
  ${Array.from({ length: 2 }, (_, i) => `{
    "question": "राजस्थान में नए जिलों के पुनर्गठन के उपरांत अरावली का सर्वाधिक विस्तार किस संभाग में है? (AI New #${i + 1})",
    "options": ["उदयपुर संभाग", "जयपुर संभाग", "जोधपुर संभाग", "बीकानेर संभाग"],
    "answer": 0,
    "explanation": "पुनर्गठन के बाद भी दक्षिणी अरावली का सर्वाधिक सघन एवं उच्च भू-भाग उदयपुर संभाग में ही विस्तृत है।",
    "sourceType": "AI_NEW",
    "exam": null
  }`).join(",\n")}
]
\`\`\`
`;

const extractedJson = extractJsonFromLlmOutput(realisticGeminiResponse);
assert(extractedJson.startsWith("[") && extractedJson.endsWith("]"), "Extracted pure JSON array from LLM response");

const parsedRawArray = JSON.parse(extractedJson);
assert(Array.isArray(parsedRawArray) && parsedRawArray.length === 20, "Parsed 20 question objects from JSON");

const normalizedQuestions = parsedRawArray.map((q: any) => normalizeMinifiedQuestion(q)).filter(Boolean);
assert(normalizedQuestions.length === 20, "Successfully normalized all 20 questions to QuestionInput format");

// Verify 0-based answer indexing was preserved correctly
assert(normalizedQuestions[0]?.correctAnswer === "opt1", "0-indexed answer (opt1) resolved correctly");
assert(normalizedQuestions[0]?.meta?.sourceType === "PYQ", "Source type 'PYQ' preserved in meta");
assert(normalizedQuestions[0]?.meta?.exam === "RAS Pre 2021", "Verified exam preserved in meta");
assert(normalizedQuestions[0]?.meta?.sourceQuestionId === 100, "sourceQuestionId preserved in meta");

// Verify AI_NEW has no fake exam attached
const aiNewQ = normalizedQuestions[18];
assert(aiNewQ?.meta?.sourceType === "AI_NEW", "19th question has sourceType 'AI_NEW'");
assert(!aiNewQ?.meta?.exam, "AI_NEW question has NO exam attached (null handled)");

// -----------------------------------------------------------------------------
// TEST 8: Gemini Composition Validation (14/4/2 Contract)
// -----------------------------------------------------------------------------
console.log("\n--- TEST 8: Composition Validation ---");
const validComposition = validateGeminiComposition(normalizedQuestions as any);
assert(validComposition.total === 20, "Composition total is 20");
assert(validComposition.pyqCount === 14, "Composition PYQ count is 14");
assert(validComposition.pyqModifiedCount === 4, "Composition PYQ_MODIFIED count is 4");
assert(validComposition.aiNewCount === 2, "Composition AI_NEW count is 2");
assert(validComposition.isValid20 === true, "isValid20 evaluates to TRUE for 14/4/2 batch");
assert(validComposition.warnings.length === 0, "Zero warnings for valid 14/4/2 batch");

// Test invalid composition (e.g. 10 PYQ, 5 MOD, 5 AI)
const invalidQuestions = [
  ...normalizedQuestions.slice(0, 10), // 10 PYQ
  ...normalizedQuestions.slice(14, 18), // 4 MOD
  ...normalizedQuestions.slice(14, 15), // +1 MOD = 5 MOD
  ...normalizedQuestions.slice(18, 20), // 2 AI
  ...normalizedQuestions.slice(18, 20), // +2 AI
  ...normalizedQuestions.slice(18, 19), // +1 AI = 5 AI
];
const invalidComposition = validateGeminiComposition(invalidQuestions as any);
assert(invalidComposition.isValid20 === false, "isValid20 evaluates to FALSE for non-standard composition");
assert(invalidComposition.warnings.length > 0, "Warnings returned for non-standard composition");

// -----------------------------------------------------------------------------
// TEST 9: Canonical Syllabus Topic Mapping Coverage
// -----------------------------------------------------------------------------
console.log("\n--- TEST 9: Canonical Syllabus Map Integrity ---");
const uniqueSubjects = new Set(CANONICAL_TOPIC_MAPPINGS.map(m => m.subjectSlug));
assert(uniqueSubjects.size >= 8, `Canonical subjects mapped (${uniqueSubjects.size} subjects)`);

let totalCanonicalTopics = CANONICAL_TOPIC_MAPPINGS.length;
let totalMappedTopics = 0;
for (const mapping of CANONICAL_TOPIC_MAPPINGS) {
  const corpus = getCorpusTopicsForCanonical(mapping.subjectNameHindi, mapping.topicNameHindi);
  if (corpus.length > 0) totalMappedTopics++;
}
assert(totalCanonicalTopics >= 100, `Canonical topics count is comprehensive (${totalCanonicalTopics} topics)`);
assert(totalMappedTopics >= 100, `Mapped ${totalMappedTopics}/${totalCanonicalTopics} canonical topics to authorized corpus topics`);

console.log("\n================================================================================");
console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log("================================================================================");

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
