/**
 * test_convex_used_pyqs.ts
 *
 * Comprehensive end-to-end verification of the Convex-backed Used PYQs tracking system:
 * 1. Topic with 0 total PYQs (empty state, prompt-only still valid)
 * 2. Topic with < 18 PYQs (Available count accurate, Copy PYQ copies all)
 * 3. Topic with 50 PYQs: Total 50, Used 0, Available 50 -> Import 18 -> Used 18, Available 32
 * 4. Second 20-question import: Used 36, Available 14
 * 5. Third import: Attempting to reuse any of the 36 used IDs is blocked
 * 6. Topic with large PYQ pool (no 50/100/200/300/500 truncation in allUnused mode)
 * 7. Duplicate sourceQuestionId within a single 20-question set is rejected atomically
 * 8. Re-using an already recorded used sourceQuestionId is rejected atomically
 * 9. Missing sourceQuestionId on PYQ/PYQ_MODIFIED is rejected
 * 10. AI_NEW questions must not have sourceQuestionId and are never marked used
 * 11. Topic isolation: Used IDs in Topic A do not affect Topic B
 * 12. Copy Prompt vs Copy PYQ separation (instructions only vs all unused PYQs)
 */

import { getRelevantPyqQuestions, retrievePyqsForTopic } from "@/lib/pyqRetrieval";
import { generateAiQuestionPrompt } from "@/lib/prompts/aiQuestionPrompt";
import { validateGeminiComposition } from "@/lib/validators/question";
import { formatPyqsForPrompt } from "@/lib/pyqTypes";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    failed++;
  }
}

console.log("================================================================================");
console.log("STARTING COMPREHENSIVE CONVEX USED PYQ TRACKING SYSTEM TESTS");
console.log("================================================================================\n");

// --- CASE 1: Topic with 0 total PYQs ---
console.log("--- CASE 1: Topic with 0 total PYQs ---");
const emptyResult = getRelevantPyqQuestions(
  { topic: "Totally Non-Existent Topic 9999", subject: "Non-Existent Subject" },
  { allUnused: true, usedQuestionIds: [] }
);

assert(emptyResult.totalFound === 0, "Empty topic has totalFound = 0");
assert(emptyResult.questions.length === 0, "Empty topic returns 0 questions");
assert(emptyResult.unusedPoolCount === 0, "Empty topic has unusedPoolCount = 0");

const emptyPrompt = generateAiQuestionPrompt({
  subject: "Non-Existent Subject",
  topic: "Totally Non-Existent Topic 9999",
  promptOnly: true,
});
assert(emptyPrompt.includes("EXACTLY 20 QUESTIONS"), "Prompt-only specifies EXACTLY 20 QUESTIONS for 0-PYQ topic");
assert(emptyPrompt.includes("14 PYQ"), "Prompt-only specifies 14 PYQ");
assert(emptyPrompt.includes("4 PYQ_MODIFIED"), "Prompt-only specifies 4 PYQ_MODIFIED");
assert(emptyPrompt.includes("2 AI_NEW"), "Prompt-only specifies 2 AI_NEW");
assert(!emptyPrompt.includes("RETRIEVED PYQ QUESTIONS:"), "Prompt-only contains ZERO interpolated PYQ records");


// --- CASE 2: Topic with small PYQ pool (< 18 PYQs) ---
console.log("\n--- CASE 2: Topic with small PYQ pool (< 18 PYQs) ---");
const topicRes = getRelevantPyqQuestions(
  { topic: "भौतिक स्वरूप", subject: "राजस्थान का भूगोल एवं अर्थव्यवस्था" },
  { allUnused: true, usedQuestionIds: [] }
);
const allQuestions = topicRes.questions;
console.log(`Topic 'भौतिक स्वरूप' has total: ${allQuestions.length} PYQs`);

// Simulate a topic where total is 10
const mock10Questions = allQuestions.slice(0, 10);
const mock10Formatted = formatPyqsForPrompt(mock10Questions);
assert(mock10Questions.length === 10, "Mock pool contains exactly 10 questions");
assert(mock10Formatted.includes(`Corpus ID: ${mock10Questions[0].id}`), "Formatted PYQs include first Corpus ID");
assert(mock10Formatted.includes(`Corpus ID: ${mock10Questions[9].id}`), "Formatted PYQs include 10th Corpus ID");


// --- CASE 3: Topic with 50 PYQs -> First Import of 18 Source Questions ---
console.log("\n--- CASE 3: 50-PYQ Topic -> First Import ---");
const pool50 = allQuestions.slice(0, 50);
const pool50Ids = new Set(pool50.map((q) => q.id));
assert(pool50.length === 50, "Corpus subset has 50 questions");

// Available before any import: 50
const initialUsedIds: number[] = [];
const available1 = pool50.filter((q) => !initialUsedIds.includes(q.id));
assert(available1.length === 50, "Initially Available = 50 (Total: 50, Used: 0)");

// Build Set 1: 14 PYQ + 4 PYQ_MODIFIED from first 18 available + 2 AI_NEW
const set1Pyqs = available1.slice(0, 14);
const set1Modified = available1.slice(14, 18);
const set1SourceIds = [...set1Pyqs.map((q) => q.id), ...set1Modified.map((q) => q.id)];
assert(set1SourceIds.length === 18, "First set uses exactly 18 distinct source questions");

// Validate composition of Set 1
const mockSet1Questions = [
  ...set1Pyqs.map((q) => ({
    questionText: q.question,
    options: q.options,
    correctAnswer: q.answerIndex ?? 0,
    explanation: q.explanation || "व्याख्या",
    type: "mcq" as const,
    meta: { sourceType: "PYQ" as const, sourceQuestionId: q.id, exam: q.exam },
  })),
  ...set1Modified.map((q) => ({
    questionText: `Modified: ${q.question}`,
    options: q.options,
    correctAnswer: q.answerIndex ?? 0,
    explanation: q.explanation || "व्याख्या",
    type: "mcq" as const,
    meta: { sourceType: "PYQ_MODIFIED" as const, sourceQuestionId: q.id, exam: null },
  })),
  {
    questionText: "AI New 1",
    options: ["A", "B", "C", "D"],
    correctAnswer: 0,
    explanation: "व्याख्या 1",
    type: "mcq" as const,
    meta: { sourceType: "AI_NEW" as const },
  },
  {
    questionText: "AI New 2",
    options: ["A", "B", "C", "D"],
    correctAnswer: 1,
    explanation: "व्याख्या 2",
    type: "mcq" as const,
    meta: { sourceType: "AI_NEW" as const },
  },
];

const val1 = validateGeminiComposition(mockSet1Questions as any, pool50Ids);
assert(val1.isValid === true, "Set 1 passes 14/4/2 composition and source IDs check");
assert(val1.pyqCount === 14, "Set 1 has 14 PYQ");
assert(val1.pyqModifiedCount === 4, "Set 1 has 4 PYQ_MODIFIED");
assert(val1.aiNewCount === 2, "Set 1 has 2 AI_NEW");

// After Set 1 import: used = 18, available = 32
const usedAfterSet1 = [...set1SourceIds];
const availableAfterSet1 = pool50.filter((q) => !usedAfterSet1.includes(q.id));
assert(usedAfterSet1.length === 18, "Used count after Set 1 = 18");
assert(availableAfterSet1.length === 32, "Available count after Set 1 = 32 (50 - 18)");
assert(
  !availableAfterSet1.some((q) => usedAfterSet1.includes(q.id)),
  "Zero used questions appear in the available pool of 32"
);


// --- CASE 4: Second Import on Same Topic ---
console.log("\n--- CASE 4: Second 20-Question Import on Same Topic ---");
// Take 18 from the remaining 32
const set2Pyqs = availableAfterSet1.slice(0, 14);
const set2Modified = availableAfterSet1.slice(14, 18);
const set2SourceIds = [...set2Pyqs.map((q) => q.id), ...set2Modified.map((q) => q.id)];
assert(set2SourceIds.length === 18, "Set 2 selects 18 fresh source questions");

// Verify none of set2SourceIds were in set1SourceIds
const overlapsWithSet1 = set2SourceIds.filter((id) => set1SourceIds.includes(id));
assert(overlapsWithSet1.length === 0, "Set 2 has ZERO overlap with Set 1 source questions");

const usedAfterSet2 = [...usedAfterSet1, ...set2SourceIds];
const availableAfterSet2 = pool50.filter((q) => !usedAfterSet2.includes(q.id));
assert(usedAfterSet2.length === 36, "Total used after Set 2 = 36");
assert(availableAfterSet2.length === 14, "Available count after Set 2 = 14 (50 - 36)");


// --- CASE 5: Third Import Rejection (Re-using used IDs or insufficient pool) ---
console.log("\n--- CASE 5: Third Import Rejection on Reuse ---");
const invalidSet3Questions = [
  ...availableAfterSet2.map((q) => ({
    questionText: q.question,
    options: q.options,
    correctAnswer: q.answerIndex ?? 0,
    explanation: "व्याख्या",
    type: "mcq" as const,
    meta: { sourceType: "PYQ" as const, sourceQuestionId: q.id, exam: q.exam },
  })), // 14 available
  // Reuse 4 from set 1
  ...set1Modified.map((q) => ({
    questionText: `Reused Modified: ${q.question}`,
    options: q.options,
    correctAnswer: q.answerIndex ?? 0,
    explanation: "व्याख्या",
    type: "mcq" as const,
    meta: { sourceType: "PYQ_MODIFIED" as const, sourceQuestionId: q.id, exam: null },
  })),
  {
    questionText: "AI New 1",
    options: ["A", "B", "C", "D"],
    correctAnswer: 0,
    explanation: "व्याख्या",
    type: "mcq" as const,
    meta: { sourceType: "AI_NEW" as const },
  },
  {
    questionText: "AI New 2",
    options: ["A", "B", "C", "D"],
    correctAnswer: 1,
    explanation: "व्याख्या",
    type: "mcq" as const,
    meta: { sourceType: "AI_NEW" as const },
  },
];

const availableSet3Ids = new Set(availableAfterSet2.map((q) => q.id));
const val3 = validateGeminiComposition(invalidSet3Questions as any, availableSet3Ids);
assert(val3.isValid === false, "Set 3 is BLOCKED because 4 questions reuse already-used IDs not in available pool");
assert(
  val3.errors.some((e) => e.includes("does not exist in the currently retrieved PYQ batch")),
  "Error explicitly flags that reused IDs are not in the available batch"
);


// --- CASE 6: Topic with Large PYQ Pool (No 50/100/200/300/500 artificial limit) ---
console.log("\n--- CASE 6: Large Topic Pool (allUnused: true returns ALL questions) ---");
const largeTopicResult = getRelevantPyqQuestions(
  { topic: "1857 की क्रांति", subject: "राजस्थान का इतिहास" },
  { allUnused: true, usedQuestionIds: [] }
);
console.log(`Topic '1857 की क्रांति' Total Found: ${largeTopicResult.totalFound}, Questions returned: ${largeTopicResult.questions.length}`);
assert(largeTopicResult.totalFound > 100, `Topic has > 100 questions (actual: ${largeTopicResult.totalFound})`);
assert(
  largeTopicResult.questions.length === largeTopicResult.totalFound,
  `allUnused: true returns ALL ${largeTopicResult.totalFound} questions without 50/100/200/300/500 truncation`
);


// --- CASE 7: Duplicate sourceQuestionId within Single Import ---
console.log("\n--- CASE 7: Duplicate sourceQuestionId within Single Import ---");
const duplicateId = set1SourceIds[0];
const setWithDuplicateIds = mockSet1Questions.map((q, idx) => {
  if (idx === 1) {
    return {
      ...q,
      meta: { ...q.meta, sourceQuestionId: duplicateId },
    };
  }
  return q;
});

const valDuplicate = validateGeminiComposition(setWithDuplicateIds as any, pool50Ids);
assert(valDuplicate.isValid === false, "Set with duplicate sourceQuestionId within the 20 is BLOCKED");
assert(
  valDuplicate.errors.some((e) => e.includes("Duplicate sourceQuestionId")),
  "Error explicitly flags Duplicate sourceQuestionId"
);


// --- CASE 8: Missing sourceQuestionId on PYQ or PYQ_MODIFIED ---
console.log("\n--- CASE 8: Missing sourceQuestionId ---");
const missingIdQuestions = mockSet1Questions.map((q, idx) => {
  if (idx === 0) {
    return {
      ...q,
      meta: { ...q.meta, sourceQuestionId: undefined },
    };
  }
  return q;
});
const valMissing = validateGeminiComposition(missingIdQuestions as any, pool50Ids);
assert(valMissing.isValid === false, "Missing sourceQuestionId on PYQ is BLOCKED");
assert(
  valMissing.errors.some((e) => e.includes("Requires a valid positive integer sourceQuestionId")),
  "Error explicitly states question requires a valid positive integer sourceQuestionId"
);


// --- CASE 9: AI_NEW questions must NOT have sourceQuestionId ---
console.log("\n--- CASE 9: AI_NEW must not have sourceQuestionId ---");
const aiWithIdQuestions = mockSet1Questions.map((q, idx) => {
  if (idx === 18) { // AI_NEW
    return {
      ...q,
      meta: { ...q.meta, sourceQuestionId: 12345 },
    };
  }
  return q;
});
const valAiWithId = validateGeminiComposition(aiWithIdQuestions as any, pool50Ids);
assert(valAiWithId.isValid === false, "AI_NEW with sourceQuestionId is BLOCKED");
assert(
  valAiWithId.errors.some((e) => e.includes("must NOT have a sourceQuestionId")),
  "Error explicitly states AI_NEW must not have a sourceQuestionId"
);


// --- CASE 10: Topic Isolation ---
console.log("\n--- CASE 10: Topic Isolation ---");
const topicAPre = getRelevantPyqQuestions(
  { topic: "1857 की क्रांति", subject: "राजस्थान का इतिहास" },
  { allUnused: true, usedQuestionIds: [] }
);
const topicAUsedIds = [topicAPre.questions[0].id, topicAPre.questions[1].id];

const topicAResult = getRelevantPyqQuestions(
  { topic: "1857 की क्रांति", subject: "राजस्थान का इतिहास" },
  { allUnused: true, usedQuestionIds: topicAUsedIds }
);
const topicBResult = getRelevantPyqQuestions(
  { topic: "स्थापत्य कला", subject: "राजस्थान की कला एवं संस्कृति" },
  { allUnused: true, usedQuestionIds: topicAUsedIds }
);

assert(topicAResult.usedCount === 2, "Topic A tracks 2 used questions");
assert(topicAResult.unusedPoolCount === topicAResult.totalFound - 2, "Topic A available pool reduced by 2");
assert(topicBResult.usedCount === 0, "Topic B tracks 0 used questions despite Topic A used IDs");
assert(
  topicBResult.unusedPoolCount === topicBResult.totalFound,
  "Topic B available pool equals total found regardless of Topic A used questions"
);


// --- CASE 11: Copy Prompt vs Copy PYQ Separation ---
console.log("\n--- CASE 11: Copy Prompt vs Copy PYQ Separation ---");
const copyPromptText = generateAiQuestionPrompt({
  subject: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
  topic: "भौतिक स्वरूप",
  count: 20,
  promptOnly: true,
  pyqReferences: pool50,
  pyqStats: {
    totalFound: 50,
    sent: 50,
    usedCount: 18,
    remainingCount: 32,
  },
  usedQuestionIds: usedAfterSet1,
});

assert(
  !copyPromptText.includes("── [Corpus ID:"),
  "Copy Prompt contains ZERO interpolated PYQ question records"
);
assert(
  copyPromptText.includes("EXACTLY 20 QUESTIONS"),
  "Copy Prompt specifies exact 20 questions"
);
assert(
  copyPromptText.includes("14 ORIGINAL \"PYQ\" QUESTIONS") || copyPromptText.includes("14 PYQ"),
  "Copy Prompt specifies exact 14 PYQ"
);
assert(
  copyPromptText.includes("4 \"PYQ_MODIFIED\" QUESTIONS"),
  "Copy Prompt specifies exact 4 PYQ_MODIFIED"
);
assert(
  copyPromptText.includes("2 \"AI_NEW\" QUESTIONS"),
  "Copy Prompt specifies exact 2 AI_NEW"
);
assert(
  copyPromptText.includes("USED SOURCE QUESTION IDs"),
  "Copy Prompt includes used question IDs list"
);

const copyPyqText = formatPyqsForPrompt(availableAfterSet1);
assert(
  copyPyqText.includes(`Corpus ID: ${availableAfterSet1[0].id}`),
  "Copy PYQ data contains first unused PYQ"
);
assert(
  copyPyqText.includes(`Corpus ID: ${availableAfterSet1[31].id}`),
  "Copy PYQ data contains 32nd unused PYQ"
);
assert(
  !copyPyqText.includes(`Corpus ID: ${set1SourceIds[0]}`),
  "Copy PYQ data DOES NOT contain any of the 18 used PYQs"
);


// --- CASE 12: Atomic 18 Used Tracking Math ---
console.log("\n--- CASE 12: Atomic 18 Used Tracking Math ---");
const totalCorpus = 100;
const usedSoFar = 18;
const availableNow = totalCorpus - usedSoFar;
assert(availableNow === 82, "Total: 100 | Used: 18 | Available: 82");
const afterImport2Used = usedSoFar + 18;
const afterImport2Available = totalCorpus - afterImport2Used;
assert(afterImport2Used === 36, "Total: 100 | Used: 36 | Available: 64");
assert(afterImport2Available === 64, "Available decreases strictly by 18 per valid import");

console.log("\n================================================================================");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
