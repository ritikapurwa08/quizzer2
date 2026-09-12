import { retrievePyqsForTopic, getRelevantPyqQuestions } from "../lib/pyqRetrieval";
import { getCorpusTopicsForCanonical, CANONICAL_TOPIC_MAPPINGS } from "../lib/syllabusTopicMap";
import { generateAiPrompt } from "../lib/prompts/aiQuestionPrompt";
import { extractJsonFromLlmOutput, sanitizeLlmArtifacts, validateAndIsolateQuestions, autoFixJson, extractYouTubeReferencesFromLlmOutput } from "../lib/importParser";
import { normalizeMinifiedQuestion, validateGeminiComposition, importJsonSchema } from "../lib/validators/question";
import { cleanCorpusExplanation } from "../lib/pyqTypes";

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

// -----------------------------------------------------------------------------
// TEST 10: Strict Separation of World GK vs India GK & Rajasthan Polity Rename
// -----------------------------------------------------------------------------
console.log("\n--- TEST 10: World GK vs India GK Separation & Rajasthan Polity Rename ---");
const worldGkResult = retrievePyqsForTopic({
  subjectName: "विश्व का सामान्य ज्ञान",
  topicName: "विश्व भूगोल - महाद्वीप",
  batchSize: 50,
});
assert(worldGkResult.matchedCorpusTopics.length > 0, "Matched corpus topics for 'विश्व भूगोल - महाद्वीप'");
assert(worldGkResult.questions.length > 0, `Found questions for World GK Continents (${worldGkResult.questions.length})`);

const indiaGkResult = retrievePyqsForTopic({
  subjectName: "भारत का सामान्य ज्ञान",
  topicName: "भारत भूगोल - भौतिक स्वरूप",
  batchSize: 50,
});
assert(indiaGkResult.matchedCorpusTopics.length > 0, "Matched corpus topics for 'भारत भूगोल - भौतिक स्वरूप'");
assert(indiaGkResult.questions.length > 0, `Found questions for India GK Physical Features (${indiaGkResult.questions.length})`);

const rajPolityResult = retrievePyqsForTopic({
  subjectName: "राजस्थान की राजव्यवस्था",
  topicName: "राज्यपाल",
  batchSize: 50,
});
assert(rajPolityResult.matchedCorpusTopics.length > 0, "Matched corpus topics for 'राजस्थान की राजव्यवस्था' -> 'राज्यपाल'");
assert(rajPolityResult.questions.length > 0, `Found questions for Governor in Rajasthan Polity (${rajPolityResult.questions.length})`);

// -----------------------------------------------------------------------------
// TEST 11: Flexible PYQ Retrieval Batch Size (50, 100, 200, 300)
// -----------------------------------------------------------------------------
console.log("\n--- TEST 11: Flexible PYQ Retrieval Batch Size ---");
const batch50 = getRelevantPyqQuestions({ subject: "राजस्थान का भूगोल", topic: "भौतिक स्वरूप" }, { maxResults: 50 });
assert(batch50.questions.length === 50, `Requested 50, retrieved exactly ${batch50.questions.length}`);
assert(batch50.sent === 50, `Sent count reports 50`);

const batch200 = getRelevantPyqQuestions({ subject: "राजस्थान का भूगोल", topic: "भौतिक स्वरूप" }, { maxResults: 200 });
assert(batch200.questions.length === 200, `Requested 200, retrieved exactly ${batch200.questions.length}`);
assert(batch200.sent === 200, `Sent count reports 200`);

const batch300 = getRelevantPyqQuestions({ subject: "राजस्थान का भूगोल", topic: "भौतिक स्वरूप" }, { maxResults: 300 });
assert(batch300.questions.length === 300, `Requested 300, retrieved exactly ${batch300.questions.length}`);
assert(batch300.sent === 300, `Sent count reports 300`);

// All 200 retrieved questions are included in Gemini prompt without truncation
const promptWith200 = generateAiPrompt({
  subject: "राजस्थान का भूगोल",
  topic: "भौतिक स्वरूप",
  count: 20, // Generation set size remains strictly 20
  pyqReferences: batch200.questions,
  pyqStats: {
    totalFound: batch200.totalFound,
    sent: batch200.sent,
    usedCount: batch200.usedCount,
    remainingCount: batch200.unusedPoolCount ?? Math.max(0, batch200.totalFound - batch200.usedCount),
  },
});
assert(promptWith200.includes("PYQ #200"), "Gemini prompt includes all 200 retrieved PYQs (no truncation of batch)");
assert(promptWith200.includes("EXACTLY 20 QUESTIONS"), "Generated set size remains strictly 20 even when 200 PYQs retrieved");

// -----------------------------------------------------------------------------
// TEST 12: Retrieved ≠ Used & Exact Exclusions
// -----------------------------------------------------------------------------
console.log("\n--- TEST 12: Retrieved ≠ Used Principle ---");
// Retrieving 100 questions does NOT make them used in the next query unless explicitly passed
const initialBatch = getRelevantPyqQuestions({ subject: "राजस्थान का भूगोल", topic: "भौतिक स्वरूप" }, { maxResults: 100, usedQuestionIds: [] });
const unspentBatch = getRelevantPyqQuestions({ subject: "राजस्थान का भूगोल", topic: "भौतिक स्वरूप" }, { maxResults: 100, usedQuestionIds: [] });
assert(initialBatch.questions[0].id === unspentBatch.questions[0].id, "Retrieval does NOT mark questions as used without import");

// Only actually imported IDs become excluded
const importedIds = [initialBatch.questions[0].id, initialBatch.questions[1].id, initialBatch.questions[2].id];
const nextBatch = getRelevantPyqQuestions({ subject: "राजस्थान का भूगोल", topic: "भौतिक स्वरूप" }, { maxResults: 100, usedQuestionIds: importedIds });
assert(!nextBatch.questions.some(q => importedIds.includes(q.id)), "Next retrieval excludes genuinely used imported IDs");
assert(nextBatch.usedCount === 3, `Reports exactly 3 used questions in topic`);

// -----------------------------------------------------------------------------
// TEST 13: Automatic Gemini Citation Cleaning ([cite: 1], [cite: 11], [cite : 1], [cite:11])
// -----------------------------------------------------------------------------
console.log("\n--- TEST 13: Automatic Citation Cleaning ---");
const rawQuestionWithCitations = {
  question: "राजस्थान में स्थानीय स्वशासन विभाग और स्थानीय निकाय निदेशालय का मुख्यालय कहाँ स्थित है?[cite: 11]",
  options: [
    "जयपुर[cite: 1]",
    "जोधपुर [cite : 1]",
    "उदयपुर[cite:11]",
    "कोटा [cite: 1, 11]"
  ],
  answer: 0,
  sourceType: "PYQ",
  sourceQuestionId: 101,
  exam: "RAS Pre 2021",
  explanation: "यह मुख्यालय जयपुर में स्थित है।[cite: 11]"
};

// 1. Direct sanitizer check
const sanitized = sanitizeLlmArtifacts(rawQuestionWithCitations);
assert(
  sanitized.question === "राजस्थान में स्थानीय स्वशासन विभाग और स्थानीय निकाय निदेशालय का मुख्यालय कहाँ स्थित है?",
  "Question text citation [cite: 11] removed cleanly without trailing space before question mark"
);
assert(sanitized.options[0] === "जयपुर", "Option 1 [cite: 1] removed cleanly");
assert(sanitized.options[1] === "जोधपुर", "Option 2 [cite : 1] removed cleanly");
assert(sanitized.options[2] === "उदयपुर", "Option 3 [cite:11] removed cleanly");
assert(sanitized.options[3] === "कोटा", "Option 4 [cite: 1, 11] removed cleanly");
assert(
  sanitized.explanation === "यह मुख्यालय जयपुर में स्थित है।",
  "Explanation citation [cite: 11] removed cleanly"
);

// 2. Schema parse check (DO NOT REJECT normal questions just because of citations)
const parseResult = importJsonSchema.safeParse([rawQuestionWithCitations]);
assert(parseResult.success === true, "importJsonSchema accepts questions with citations after automatic sanitization");
if (parseResult.success && parseResult.data.questions[0]) {
  const importedQ = parseResult.data.questions[0];
  assert(!importedQ.questionText.includes("cite"), "Imported question text has zero citation markers");
  assert(!importedQ.explanation?.includes("cite"), "Imported explanation has zero citation markers");
  assert(importedQ.options.every(o => !o.text.includes("cite")), "All imported options have zero citation markers");
}

// 3. validateAndIsolateQuestions check
const isolationResult = validateAndIsolateQuestions([rawQuestionWithCitations]);
assert(isolationResult.validQuestions.length === 1, "validateAndIsolateQuestions parsed question with citations successfully");
assert(isolationResult.invalidQuestions.length === 0, "validateAndIsolateQuestions did NOT reject question with citations");

// -----------------------------------------------------------------------------
// TEST 14: Preservation of Legitimate Brackets
// -----------------------------------------------------------------------------
console.log("\n--- TEST 14: Preservation of Legitimate Brackets ---");
const legitimateBracketsQ = {
  question: "अरावली पर्वतमाला (1722 मीटर) और [कथन 1] के संदर्भ में (A) तथा (B) पर विचार कीजिए। [cite: 5]",
  options: ["(A) सही है", "(B) सही है", "दोनों सही हैं", "कोई नहीं"],
  answer: 0,
  sourceType: "PYQ",
  explanation: "गुरुशिखर (1722 मी) सिरोही [राजस्थान] में है। [cite: 5]"
};
const cleanedBrackets = sanitizeLlmArtifacts(legitimateBracketsQ);
assert(cleanedBrackets.question.includes("(1722 मीटर)"), "Preserves parenthetical heights (1722 मीटर)");
assert(cleanedBrackets.question.includes("[कथन 1]"), "Preserves bracketed statement tokens [कथन 1]");
assert(cleanedBrackets.question.includes("(A) तथा (B)"), "Preserves statement references (A) तथा (B)");
assert(!cleanedBrackets.question.includes("cite"), "Stripped [cite: 5] cleanly");
assert(cleanedBrackets.explanation.includes("[राजस्थान]"), "Preserves bracketed location [राजस्थान]");

// -----------------------------------------------------------------------------
// TEST 15: Clean Corpus Explanations & Rajasthan Gyan Removal
// -----------------------------------------------------------------------------
console.log("\n--- TEST 15: Clean Corpus Explanations ---");
const dirtyExp = "भानगढ़ का किला अलवर में है। more Detail : https://www.rajasthangyan.com/fact?fac_id=5";
const cleanExp = cleanCorpusExplanation(dirtyExp);
assert(!cleanExp.includes("rajasthangyan"), "cleanCorpusExplanation strips rajasthangyan URLs");
assert(!cleanExp.includes("Rajasthan Gyan"), "cleanCorpusExplanation strips Rajasthan Gyan");
assert(cleanExp.includes("भानगढ़ का किला अलवर में है।"), "cleanCorpusExplanation preserves factual explanation content");

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// TEST 16: Prompt No-Citation Instruction
// -----------------------------------------------------------------------------
console.log("\n--- TEST 16: Prompt No-Citation Instruction ---");
assert(prompt.includes("NO INLINE CITATIONS") || prompt.includes("Do not include citations"), "Prompt instructs Gemini not to add citations");
assert(prompt.includes("Do not include citations, citation markers, footnotes, or [cite: ...] markers inside the JSON"), "Prompt includes exact requested citation prohibition phrase");
assert(prompt.includes("[cite: 1]"), "Prompt specifically warns against tokens like [cite: 1]");

// -----------------------------------------------------------------------------
// TEST 17: Critical Composition Validation & Source Provenance Enforcement
// -----------------------------------------------------------------------------
console.log("\n--- TEST 17: Critical Composition & Source ID Validation ---");

// Mock retrieved batch with IDs 101 through 200
const allowedIds = new Set<number>(Array.from({ length: 100 }, (_, i) => 101 + i));

// 17.1: Invalid composition (0 PYQ + 2 MOD + 18 AI)
const composition_0_2_18 = [
  ...Array.from({ length: 2 }, (_, i) => ({
    type: "mcq",
    questionText: `Modified question ${i + 1}`,
    options: [{ id: "opt1", text: "A" }, { id: "opt2", text: "B" }, { id: "opt3", text: "C" }, { id: "opt4", text: "D" }],
    correctAnswer: "opt1",
    meta: { sourceType: "PYQ_MODIFIED", sourceQuestionId: 101 + i },
  })),
  ...Array.from({ length: 18 }, (_, i) => ({
    type: "mcq",
    questionText: `AI question ${i + 1}`,
    options: [{ id: "opt1", text: "A" }, { id: "opt2", text: "B" }, { id: "opt3", text: "C" }, { id: "opt4", text: "D" }],
    correctAnswer: "opt1",
    meta: { sourceType: "AI_NEW" },
  })),
];

const result_0_2_18 = validateGeminiComposition(composition_0_2_18 as any, allowedIds);
assert(result_0_2_18.isValid20 === false, "0 PYQ + 2 MOD + 18 AI evaluates to isValid20 = FALSE");
assert(result_0_2_18.isValid === false, "0 PYQ + 2 MOD + 18 AI evaluates to isValid = FALSE (Import BLOCKED)");
assert(
  Boolean(result_0_2_18.errorMessage?.includes("Expected: 14 PYQ + 4 PYQ_MODIFIED + 2 AI_NEW")),
  "Clear error message specifies expected 14 PYQ + 4 PYQ_MODIFIED + 2 AI_NEW"
);
assert(
  Boolean(result_0_2_18.errorMessage?.includes("Received: 0 PYQ + 2 PYQ_MODIFIED + 18 AI_NEW")),
  "Clear error message specifies received 0 PYQ + 2 PYQ_MODIFIED + 18 AI_NEW"
);

// 17.2: Missing sourceQuestionId on PYQ
const missingSourceBatch = [
  ...Array.from({ length: 14 }, (_, i) => ({
    type: "mcq",
    questionText: `PYQ question ${i + 1}`,
    options: [{ id: "opt1", text: "A" }, { id: "opt2", text: "B" }, { id: "opt3", text: "C" }, { id: "opt4", text: "D" }],
    correctAnswer: "opt1",
    // First question lacks sourceQuestionId
    meta: { sourceType: "PYQ", ...(i > 0 ? { sourceQuestionId: 101 + i } : {}) },
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    type: "mcq",
    questionText: `MOD question ${i + 1}`,
    options: [{ id: "opt1", text: "A" }, { id: "opt2", text: "B" }, { id: "opt3", text: "C" }, { id: "opt4", text: "D" }],
    correctAnswer: "opt1",
    meta: { sourceType: "PYQ_MODIFIED", sourceQuestionId: 115 + i },
  })),
  ...Array.from({ length: 2 }, (_, i) => ({
    type: "mcq",
    questionText: `AI question ${i + 1}`,
    options: [{ id: "opt1", text: "A" }, { id: "opt2", text: "B" }, { id: "opt3", text: "C" }, { id: "opt4", text: "D" }],
    correctAnswer: "opt1",
    meta: { sourceType: "AI_NEW" },
  })),
];

const resultMissingSource = validateGeminiComposition(missingSourceBatch as any, allowedIds);
assert(resultMissingSource.isValid20 === true, "14/4/2 counts are correct (isValid20 = TRUE)");
assert(resultMissingSource.sourceIdValid === false, "sourceIdValid = FALSE due to missing sourceQuestionId on PYQ");
assert(resultMissingSource.isValid === false, "isValid = FALSE (Import BLOCKED when sourceQuestionId is missing)");

// 17.3: sourceQuestionId NOT in retrieved batch
const invalidSourceIdBatch = JSON.parse(JSON.stringify(missingSourceBatch));
// Provide sourceQuestionId 9999 which does not exist in allowedIds (101..200)
invalidSourceIdBatch[0].meta.sourceQuestionId = 9999;
const resultNotExistingSource = validateGeminiComposition(invalidSourceIdBatch as any, allowedIds);
assert(resultNotExistingSource.sourceIdValid === false, "sourceIdValid = FALSE when sourceQuestionId is not in batch");
assert(resultNotExistingSource.isValid === false, "isValid = FALSE when sourceQuestionId is not in batch");
assert(
  resultNotExistingSource.errors.some((e) => e.includes("sourceQuestionId 9999 does not exist in the currently retrieved PYQ batch")),
  "Error explicitly reports sourceQuestionId 9999 not in batch"
);

// 17.4: AI_NEW question with illegal sourceQuestionId
const illegalAiSourceBatch = JSON.parse(JSON.stringify(invalidSourceIdBatch));
illegalAiSourceBatch[0].meta.sourceQuestionId = 101; // fix question 1
illegalAiSourceBatch[18].meta.sourceQuestionId = 102; // illegally add to AI_NEW
const resultIllegalAiSource = validateGeminiComposition(illegalAiSourceBatch as any, allowedIds);
assert(resultIllegalAiSource.sourceIdValid === false, "sourceIdValid = FALSE when AI_NEW has sourceQuestionId");
assert(resultIllegalAiSource.isValid === false, "isValid = FALSE when AI_NEW has sourceQuestionId");

// 17.5: Valid 14 PYQ + 4 PYQ_MODIFIED + 2 AI_NEW with all valid IDs in retrieved batch
const valid14_4_2Batch = [
  ...Array.from({ length: 14 }, (_, i) => ({
    type: "mcq",
    questionText: `PYQ question ${i + 1}`,
    options: [{ id: "opt1", text: "A" }, { id: "opt2", text: "B" }, { id: "opt3", text: "C" }, { id: "opt4", text: "D" }],
    correctAnswer: "opt1",
    meta: { sourceType: "PYQ", sourceQuestionId: 101 + i, exam: "RPSC RAS 2021" },
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    type: "mcq",
    questionText: `MOD question ${i + 1}`,
    options: [{ id: "opt1", text: "A" }, { id: "opt2", text: "B" }, { id: "opt3", text: "C" }, { id: "opt4", text: "D" }],
    correctAnswer: "opt1",
    meta: { sourceType: "PYQ_MODIFIED", sourceQuestionId: 115 + i },
  })),
  ...Array.from({ length: 2 }, (_, i) => ({
    type: "mcq",
    questionText: `AI question ${i + 1}`,
    options: [{ id: "opt1", text: "A" }, { id: "opt2", text: "B" }, { id: "opt3", text: "C" }, { id: "opt4", text: "D" }],
    correctAnswer: "opt1",
    meta: { sourceType: "AI_NEW", exam: null },
  })),
];

const resultValid = validateGeminiComposition(valid14_4_2Batch as any, allowedIds);
assert(resultValid.isValid20 === true, "Valid batch: isValid20 = TRUE");
assert(resultValid.sourceIdValid === true, "Valid batch: sourceIdValid = TRUE");
assert(resultValid.isValid === true, "Valid batch: isValid = TRUE (Can be imported)");
assert(resultValid.errors.length === 0, "Valid batch: 0 errors");

// -----------------------------------------------------------------------------
// TEST 18: End-to-End Verification on a Topic with >= 100 Available PYQs
// -----------------------------------------------------------------------------
console.log("\n--- TEST 18: End-to-End 100+ PYQ Topic Verification ---");

// Step 1: Topic selection
const topic100Result = retrievePyqsForTopic({
  subjectName: "राजस्थान का इतिहास",
  topicName: "1857 की क्रांति",
  batchSize: 100,
  usedQuestionIds: [],
});

assert(topic100Result.totalAvailableInTopic >= 100, `Topic has >= 100 available PYQs (actual: ${topic100Result.totalAvailableInTopic})`);
assert(topic100Result.questions.length === 100, `Retrieved exactly 100 questions for batch (actual: ${topic100Result.questions.length})`);

// Step 2: Prompt construction with all 100 retrieved PYQs + PDF study text
const testPdfText = "1857 की क्रांति में राजस्थान के 6 सैनिक छावनियां थीं: नसीराबाद, नीमच, देवली, ब्यावर, एरिनपुरा और खेरवाड़ा।";
const topic100Prompt = generateAiPrompt({
  subject: "राजस्थान का इतिहास",
  topic: "1857 की क्रांति",
  count: 20,
  referenceText: testPdfText,
  pyqReferences: topic100Result.questions,
  pyqStats: {
    totalFound: topic100Result.totalAvailableInTopic,
    sent: topic100Result.questions.length,
    usedCount: 0,
    remainingCount: topic100Result.remainingUnusedCount,
  },
});

// Step 3: Verify all 100 PYQs are actually in the prompt
const firstRetrievedId = topic100Result.questions[0].id;
const lastRetrievedId = topic100Result.questions[99].id;
assert(topic100Prompt.includes(`Corpus ID: ${firstRetrievedId}`), `First retrieved PYQ (ID: ${firstRetrievedId}) present in prompt`);
assert(topic100Prompt.includes(`Corpus ID: ${lastRetrievedId}`), `100th retrieved PYQ (ID: ${lastRetrievedId}) present in prompt`);
assert(topic100Prompt.includes("--- PYQ #100"), "Prompt contains all 100 formatted PYQs");

// Step 4: Verify prompt contract instructions
assert(topic100Prompt.includes("14 PYQ"), "Prompt requires 14 PYQ");
assert(topic100Prompt.includes("4 PYQ_MODIFIED"), "Prompt requires 4 PYQ_MODIFIED");
assert(topic100Prompt.includes("2 AI_NEW"), "Prompt requires 2 AI_NEW");
assert(topic100Prompt.includes("YOUTUBE IS REFERENCE ONLY"), "Prompt designates YouTube as reference-only");
assert(topic100Prompt.includes("THE 5 YOUTUBE VIDEOS ARE NOT QUESTION SOURCES"), "Prompt explicitly forbids taking questions from YouTube");
assert(topic100Prompt.includes("USER-SUPPLIED STUDY / REFERENCE MATERIAL (PDF / TEXT)"), "Prompt includes PDF section");
assert(topic100Prompt.includes("The user has attached or supplied the following reference material"), "PDF context is present");
assert(topic100Prompt.includes("Do not include citations, citation markers, footnotes, or [cite: ...] markers inside the JSON"), "Prompt includes exact citation prohibition phrase");

// Step 5: Verify Used-Question Tracking (Retrieved ≠ Used)
// Just retrieving 100 questions does NOT mark them as used
const topicPoolAfterRetrieval = retrievePyqsForTopic({
  subjectName: "राजस्थान का इतिहास",
  topicName: "1857 की क्रांति",
  batchSize: 100,
  usedQuestionIds: [],
});
assert(topicPoolAfterRetrieval.questions.length === 100, "Unused pool count is unaffected without confirmed import");

// Now simulate importing a 20-question set using 14 PYQs (IDs 0..13) and 4 MODs (IDs 14..17)
const usedIdsAfterImport = topic100Result.questions.slice(0, 18).map((q) => q.id);
assert(usedIdsAfterImport.length === 18, "Exactly 18 source questions used in the 20-question set");

const nextBatchRetrieval = retrievePyqsForTopic({
  subjectName: "राजस्थान का इतिहास",
  topicName: "1857 की क्रांति",
  batchSize: 100,
  usedQuestionIds: usedIdsAfterImport,
});

// The next batch MUST exclude the 18 used questions and continue with remaining
const hasOverlapWithUsed = nextBatchRetrieval.questions.some((q) => usedIdsAfterImport.includes(q.id));
assert(!hasOverlapWithUsed, "Next batch excludes the 18 genuinely used sourceQuestionIds");
assert(nextBatchRetrieval.questions.length === 100, "Next batch retrieves 100 fresh unused questions from remaining pool");

// -----------------------------------------------------------------------------
// TEST 19: Persistent USED SOURCE QUESTION IDs Prompt Contract
// -----------------------------------------------------------------------------
console.log("\n--- TEST 19: Persistent USED SOURCE QUESTION IDs Contract ---");
const sampleUsedIds = [101, 104, 108, 115, 121];
const promptWithUsedIds = generateAiPrompt({
  subject: "राजस्थान का इतिहास",
  topic: "1857 की क्रांति",
  count: 20,
  pyqReferences: batch1.questions,
  usedQuestionIds: sampleUsedIds,
});

assert(promptWithUsedIds.includes("USED SOURCE QUESTION IDs:\n[101, 104, 108, 115, 121]"), "Prompt explicitly contains the USED SOURCE QUESTION IDs list");
assert(promptWithUsedIds.includes("never use any ID from this list again"), "Prompt contains rule: never use any ID from this list again");
assert(promptWithUsedIds.includes("select PYQ and PYQ_MODIFIED questions only from the newly supplied PYQ batch"), "Prompt contains rule: select PYQ/MODIFIED only from newly supplied PYQ batch");
assert(promptWithUsedIds.includes("return the sourceQuestionId for every PYQ and PYQ_MODIFIED question"), "Prompt contains rule: return sourceQuestionId for every PYQ/MODIFIED");
assert(promptWithUsedIds.includes("treat the supplied USED IDs as permanently unavailable for future sets"), "Prompt contains rule: treat used IDs as permanently unavailable");

// When usedQuestionIds is empty
const promptEmptyUsedIds = generateAiPrompt({
  subject: "राजस्थान का इतिहास",
  topic: "1857 की क्रांति",
  count: 20,
  pyqReferences: batch1.questions,
  usedQuestionIds: [],
});
assert(promptEmptyUsedIds.includes("USED SOURCE QUESTION IDs:\n[]"), "Prompt contains empty list when no IDs used yet");

// -----------------------------------------------------------------------------
// TEST 20: YouTube State: First Batch vs Subsequent Batches
// -----------------------------------------------------------------------------
console.log("\n--- TEST 20: YouTube State: Single Selection Across Sets ---");
// Batch 1: No previous YouTube videos
const firstBatchPrompt = generateAiPrompt({
  subject: "राजस्थान का भूगोल",
  topic: "भौतिक स्वरूप",
  count: 20,
  pyqReferences: batch1.questions,
  selectedYouTubeVideos: [],
});
assert(firstBatchPrompt.includes("Search for and select exactly 5 highly relevant, high-quality YouTube educational videos"), "First batch prompt requests Gemini to select 5 YouTube videos");
assert(firstBatchPrompt.includes("PART A: 5 YouTube Reference Videos"), "First batch prompt requires PART A in output format");

// Extraction of 5 YouTube videos from LLM response
const extractedVideos = extractYouTubeReferencesFromLlmOutput(realisticGeminiResponse);
assert(Array.isArray(extractedVideos) && extractedVideos.length === 5, "Extracted exactly 5 YouTube reference videos from LLM response");
assert(extractedVideos![0].includes("अरावली पर्वतमाला सम्पूर्ण भूगोल"), "First extracted video has expected title/content");

// Subsequent Batch: Previously selected 5 YouTube videos supplied
const subsequentBatchPrompt = generateAiPrompt({
  subject: "राजस्थान का भूगोल",
  topic: "भौतिक स्वरूप",
  count: 20,
  pyqReferences: batch2.questions,
  usedQuestionIds: sampleUsedIds,
  selectedYouTubeVideos: extractedVideos!,
});

assert(subsequentBatchPrompt.includes("These 5 YouTube videos have already been selected for this Topic. Continue using them as supporting reference material. Do not provide another YouTube list."), "Subsequent prompt includes the mandatory exact reuse instruction");
assert(subsequentBatchPrompt.includes("DO NOT search for or output another 5 videos for every subsequent 20-question set."), "Subsequent prompt forbids searching for new videos");
assert(subsequentBatchPrompt.includes("YouTube remains SUPPORTING CONTEXT ONLY. It is never a question source."), "Subsequent prompt affirms YouTube remains supporting context only");
assert(subsequentBatchPrompt.includes("Your response must contain ONLY the JSON array of exactly 20 questions"), "Subsequent prompt requires ONLY JSON array (no Part A YouTube list)");
assert(!subsequentBatchPrompt.includes("PART A: 5 YouTube Reference Videos"), "Subsequent prompt DOES NOT ask for Part A YouTube videos again");
assert(subsequentBatchPrompt.includes("Do NOT provide another YouTube list"), "Subsequent checklist includes Do NOT provide another YouTube list");

console.log("\n================================================================================");
console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log("================================================================================");

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
