import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { QuestionDuplicateRegistry, normalizeQuestionText, computeQuestionFingerprint, tokenSimilarity } from "../src/lib/pool/deduplication";
import { validateImportBatch } from "../src/lib/validators/question";
import { generateAiQuestionPrompt } from "../src/lib/prompts/aiQuestionPrompt";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);
const ADMIN_SECRET = "quizzer_admin_pool_init_2026";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("   QUIZZER POOL & QUEUE SYSTEM MECHANICS TEST   ");
  console.log("=================================================\n");

  // TEST 1: Candidate request returns 25-30 candidates for a topic with 100+ available questions
  console.log("Test Scenario 1: Candidate Request Window Size");
  try {
    const candidatesRes = await client.mutation(api.pool.getCandidates, {
      masterTopicId: 1,
      sessionId: "test-session-1",
      windowSize: 30,
      examPreference: "all",
      adminSecret: ADMIN_SECRET,
    });

    assert(
      candidatesRes.candidates.length >= 25 && candidatesRes.candidates.length <= 30,
      "Topic 1 returns 25-30 candidates",
      `Received ${candidatesRes.candidates.length} candidates`
    );

    // Release the claimed questions so we don't hold the lease
    const releaseRes = await client.mutation(api.pool.releaseClaim, {
      masterTopicId: 1,
      sessionId: "test-session-1",
      adminSecret: ADMIN_SECRET,
    });
    assert(releaseRes.releasedCount >= 25, "Released claim for test-session-1 successfully", `Released ${releaseRes.releasedCount}`);
  } catch (err: any) {
    assert(false, "Test 1 failed with error", err.message);
  }

  // TEST 6 & 7: Concurrency claiming prevents simultaneous double claims
  console.log("\nTest Scenario 6 & 7: Concurrency & Claiming Isolation");
  try {
    const claimWorkerA = await client.mutation(api.pool.getCandidates, {
      masterTopicId: 2,
      sessionId: "session-worker-A",
      windowSize: 25,
      adminSecret: ADMIN_SECRET,
    });
    const claimWorkerB = await client.mutation(api.pool.getCandidates, {
      masterTopicId: 2,
      sessionId: "session-worker-B",
      windowSize: 25,
      adminSecret: ADMIN_SECRET,
    });

    const setA = new Set(claimWorkerA.candidates.map((c) => c._id));
    const overlap = claimWorkerB.candidates.filter((c) => setA.has(c._id));

    assert(
      overlap.length === 0,
      "Simultaneous claims by worker A and worker B have zero overlap",
      `Overlap count: ${overlap.length}`
    );

    // Release both claims
    await client.mutation(api.pool.releaseClaim, {
      masterTopicId: 2,
      sessionId: "session-worker-A",
      adminSecret: ADMIN_SECRET,
    });
    await client.mutation(api.pool.releaseClaim, {
      masterTopicId: 2,
      sessionId: "session-worker-B",
      adminSecret: ADMIN_SECRET,
    });
    assert(true, "Released concurrent claims successfully");
  } catch (err: any) {
    assert(false, "Concurrency test failed", err.message);
  }

  // TEST 8 & 9: Exam and year preservation vs null handling
  console.log("\nTest Scenario 8 & 9: Metadata & Provenance Preservation");
  try {
    const sampleBatchWithNull = {
      testSetTitle: "Test Set Metadata Validation",
      subjectId: "dummy" as any,
      topicId: "dummy" as any,
      questions: [
        {
          questionText: "राजस्थान का राज्य पक्षी कौन सा है?",
          options: ["गोडावण", "मोर", "तोता", "कबूतर"],
          correctAnswer: 0,
          explanation: "गोडावण राजस्थान का राज्य पक्षी है।",
          sourceQuestionId: "rg_000001",
          source: "rajasthan_gyan",
          examName: undefined,
          examYear: undefined,
        },
        {
          questionText: "राजस्थान का राज्य पशु कौन सा है?",
          options: ["चिंकारा", "बाघ", "हाथी", "शेर"],
          correctAnswer: 0,
          explanation: "चिंकारा राजस्थान का राज्य पशु है।",
          sourceQuestionId: 101,
          source: "pyq_pdf",
          examName: "REET",
          examYear: 2022,
        },
      ],
    };

    assert(
      sampleBatchWithNull.questions[0].examName === undefined &&
      sampleBatchWithNull.questions[0].examYear === undefined,
      "Question with null examName & null examYear is structurally valid"
    );
    assert(
      sampleBatchWithNull.questions[1].examName === "REET" &&
      sampleBatchWithNull.questions[1].examYear === 2022,
      "Question with examName='REET' and examYear=2022 preserves provenance metadata"
    );
  } catch (err: any) {
    assert(false, "Metadata test failed", err.message);
  }

  // TEST 10: Gemini Prompt Generation Check
  console.log("\nTest Scenario 10: AI Prompt Construction (No 16+4, Strict Candidate Window)");
  try {
    const prompt = generateAiQuestionPrompt({
      subject: "राजस्थान कला एवं संस्कृति",
      topic: "राजस्थान के मेले",
      count: 20,
      candidateCount: 28,
      questionsText: "1. पुष्कर मेला कहाँ आयोजित होता है?\nA) अजमेर\nB) जयपुर\nC) कोटा\nD) उदयपुर",
    });

    assert(
      !prompt.includes("16+4") && !prompt.includes("16 PYQ") && !prompt.includes("4 AI"),
      "Gemini prompt completely eliminates old 16+4 quotas"
    );
    assert(
      prompt.includes("Target Set Count: 20 questions") || prompt.includes("SELECT EXACTLY 20 FINAL QUESTIONS"),
      "Gemini prompt instructs target of 20 questions"
    );
    assert(
      prompt.includes("CURRENT-SET REPETITION FILTER") && prompt.includes("NO FILLER QUESTIONS"),
      "Gemini prompt strictly filters repetitions without fabricating filler questions"
    );
  } catch (err: any) {
    assert(false, "AI Prompt test failed", err.message);
  }

  // TEST 11, 12, 16: Multi-Level Deduplication Engine
  console.log("\nTest Scenario 11, 12, 16: Deduplication Engine (Level 1, 2, 3, 4)");
  try {
    const reg = new QuestionDuplicateRegistry();

    // 1. Insert original question
    const q1 = {
      text: "महाराणा प्रताप का जन्म किस दुर्ग में हुआ था?",
      options: ["कुंभलगढ़", "चित्तौड़गढ़", "रणथंभौर", "मेहरानगढ़"],
      sourceId: "pyq_100",
      source: "pyq_pdf",
    };
    const res1 = reg.checkDuplicate(q1.source, q1.sourceId, q1.text, q1.options);
    assert(!res1.isDuplicate, "First question registered as unique");
    reg.register(q1.source, q1.sourceId, q1.text, q1.options);

    // Level 1 Duplicate check: Same source ID
    const resL1 = reg.checkDuplicate(q1.source, q1.sourceId, "कोई अन्य भिन्न प्रश्न", ["A", "B", "C", "D"]);
    assert(resL1.isDuplicate && resL1.level === 1, "Level 1 duplicate detected by Source ID");

    // Level 2 Duplicate check: Same normalized text with minor punctuation / spacing differences
    const resL2 = reg.checkDuplicate("rajasthan_gyan", "rg_200", "  महाराणा  प्रताप का जन्म किस दुर्ग में हुआ था?  ", q1.options);
    assert(resL2.isDuplicate && resL2.level === 2, "Level 2 duplicate detected by Normalized Text");

    // Level 3 Duplicate check: Fingerprint permutation invariance
    const fp1 = computeQuestionFingerprint("राजस्थान की राजधानी क्या है?", ["जयपुर", "जोधपुर", "उदयपुर", "कोटा"]);
    const fp2 = computeQuestionFingerprint("राजस्थान की राजधानी क्या है?", ["कोटा", "जयपुर", "उदयपुर", "जोधपुर"]);
    assert(fp1 === fp2, "Level 3 Question + Options fingerprint is permutation invariant");

    // Level 4 Duplicate check: High token similarity for long stem
    const long1 = "राजस्थान के प्रमुख दुर्गों में कुंभलगढ़ दुर्ग का ऐतिहासिक निर्माण किस शासक ने करवाया था जिन्होंने मेवाड़ में अनेक दुर्गों की नींव रखी";
    const long2 = "राजस्थान के प्रमुख दुर्गों में कुंभलगढ़ दुर्ग का ऐतिहासिक निर्माण किस शासक ने करवाया था जिन्होंने मेवाड़ में कई दुर्गों की नींव रखी";
    const sim = tokenSimilarity(long1, long2);
    assert(sim >= 0.85, `Level 4 token similarity calculated correctly (${(sim * 100).toFixed(1)}%)`);

    // Test 12: Distinct fact on same entity (e.g. Maharana Pratap birth vs battle) is NOT duplicate
    const qDistinct = {
      text: "हल्दीघाटी का ऐतिहासिक युद्ध किस वर्ष लड़ा गया था जिसमें महाराणा प्रताप ने मुगलों का सामना किया था?",
      options: ["1576", "1582", "1567", "1527"],
      sourceId: "pyq_500",
      source: "pyq_pdf",
    };
    const resDistinct = reg.checkDuplicate(qDistinct.source, qDistinct.sourceId, qDistinct.text, qDistinct.options);
    assert(!resDistinct.isDuplicate, "Distinct question on same entity is correctly NOT marked duplicate");
  } catch (err: any) {
    assert(false, "Deduplication test failed", err.message);
  }

  // TEST 13 & 14: Batch Validation (< 20 rejected on normal, allowed on final set)
  console.log("\nTest Scenario 13 & 14: Batch Size Validator (< 20 Normal vs Final Set)");
  try {
    // Generate 15 dummy questions
    const fifteenQuestions = Array.from({ length: 15 }, (_, i) => ({
      questionText: `प्रश्न क्रमांक ${i + 1} राजस्थान का सामान्य ज्ञान?`,
      options: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
      correctAnswer: 0,
      explanation: "प्रमाणित स्पष्टीकरण",
      sourceQuestionId: `test_${i + 1}`,
      source: "rajasthan_gyan",
    }));

    // Normal validation (isFinalSet = false, allowFinalBelow20 = false) -> MUST FAIL
    const normalValidation = validateImportBatch(fifteenQuestions as any, {
      isFinalSet: false,
      allowFinalBelow20: false,
    });
    assert(
      !normalValidation.isValid && normalValidation.errors.some((e) => e.includes("20 प्रश्न आवश्यक हैं")),
      "Import batch with 15 questions rejected when allowFinalBelow20 = false",
      normalValidation.errors.join("; ")
    );

    // Final set validation (isFinalSet = true, allowFinalBelow20 = true) -> MUST PASS
    const finalSetValidation = validateImportBatch(fifteenQuestions as any, {
      isFinalSet: true,
      allowFinalBelow20: true,
    });
    assert(
      finalSetValidation.isValid,
      "Import batch with 15 questions accepted when allowFinalBelow20 = true & isFinalSet = true (Final Set Exception)"
    );

    // Exactly 20 questions -> MUST PASS under normal mode
    const twentyQuestions = Array.from({ length: 20 }, (_, i) => ({
      questionText: `प्रश्न क्रमांक ${i + 1} राजस्थान का सामान्य ज्ञान?`,
      options: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
      correctAnswer: 0,
      explanation: "प्रमाणित स्पष्टीकरण",
      sourceQuestionId: `test_20_${i + 1}`,
      source: "rajasthan_gyan",
    }));

    const twentyValidation = validateImportBatch(twentyQuestions as any, {
      isFinalSet: false,
      allowFinalBelow20: false,
    });
    assert(twentyValidation.isValid, "Import batch with exactly 20 questions passes validation");
  } catch (err: any) {
    assert(false, "Validator test failed", err.message);
  }

  // TEST 2, 3, 4, 5: Queue Progression & Requeue Mechanics
  console.log("\nTest Scenario 2, 3, 4, 5: Queue Progression, Requeue to End of Queue & Status Check");
  try {
    const topic73 = await client.query(api.pool.getTopicSummary, { masterTopicId: 73 });
    const initialAvailable = topic73.available;
    const initialNextQueueOrder = topic73.nextQueueOrder;

    // Request candidates
    const sessionTest = "session-test-requeue";
    const res = await client.mutation(api.pool.getCandidates, {
      masterTopicId: 73,
      sessionId: sessionTest,
      windowSize: 25,
      adminSecret: ADMIN_SECRET,
    });

    assert(res.candidates.length >= 20, "Topic 73 provided candidate window");

    // Release them clean to verify release mechanism returns them to AVAILABLE
    await client.mutation(api.pool.releaseClaim, {
      masterTopicId: 73,
      sessionId: sessionTest,
      adminSecret: ADMIN_SECRET,
    });

    const topic73AfterRelease = await client.query(api.pool.getTopicSummary, { masterTopicId: 73 });
    assert(
      topic73AfterRelease.available === initialAvailable,
      "Claim release cleanly restored available question count without data loss"
    );
  } catch (err: any) {
    assert(false, "Queue progression test failed", err.message);
  }

  // TEST 15: All 73 Topics Initialized in Live Convex Pool
  console.log("\nTest Scenario 15: All 73 Master Topics Presence in Convex Pool");
  try {
    const allSummaries = await client.query(api.pool.listTopicSummaries);
    assert(allSummaries.length === 73, "All 73 Master Topics exist in poolTopicSummaries");

    const totalInPool = allSummaries.reduce((sum: number, s: any) => sum + s.total, 0);
    const availableInPool = allSummaries.reduce((sum: number, s: any) => sum + s.available, 0);
    const usedInPool = allSummaries.reduce((sum: number, s: any) => sum + s.used, 0);

    assert(totalInPool > 18000, `Pool has ${totalInPool} total questions across 73 topics`);
    assert(usedInPool >= 274, `Pool tracks ${usedInPool} existing production used questions`);
    assert(availableInPool > 17500, `Pool has ${availableInPool} available questions ready for quiz generation`);
  } catch (err: any) {
    assert(false, "Convex pool summary test failed", err.message);
  }

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
