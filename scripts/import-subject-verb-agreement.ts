import fs from "fs";
import path from "path";
import { ALL_RAW_QUESTIONS } from "./parse-incoming-questions";

const PROD_CONVEX_URL = "https://shiny-wildcat-270.convex.cloud";
const isProd = process.argv.includes("--prod");
const CONVEX_URL = isProd
  ? PROD_CONVEX_URL
  : process.env.NEXT_PUBLIC_CONVEX_URL || "https://perceptive-orca-161.convex.cloud";

export interface FormattedQuestion {
  id: string;
  type: "mcq";
  questionText: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  reference?: string;
  meta: {
    source: string;
    sourceQuestionId: string;
    originalId: number;
    exam: string;
    year: number;
    concept: string;
    elimination_logic: string;
    topic: string;
    masterTopicId: number;
  };
}

function extractYear(examStr: string | null | undefined): number {
  if (!examStr) return 2026;
  const match = examStr.match(/\b(20\d{2}|19\d{2})\b/);
  return match ? parseInt(match[1], 10) : 2026;
}

export function formatRawQuestions(): FormattedQuestion[] {
  return ALL_RAW_QUESTIONS.map((raw) => {
    // 1. Disambiguate question texts that would collide in deduplication check
    let qText = raw.question.trim();
    if (raw.id === 3) {
      qText = "Choose the grammatically correct option (Any dictionary...):";
    } else if (raw.id === 4) {
      qText = "Choose the grammatically correct option (Many a flower...):";
    } else if (raw.id === 14) {
      qText = "Choose the correct sentence (One of these candidates...):";
    } else if (raw.id === 15) {
      qText = "Choose the correct sentence (The class divided in opinions):";
    } else if (raw.id === 81) {
      qText = "Choose the correct sentence (The jury divided in opinions):";
    } else if (raw.id === 104) {
      qText = "Choose the correct sentence (What we urgently need...):";
    }

    // 2. Parse options
    const optEntries = Object.entries(raw.options);
    // Filter out 5th option "Question not attempted"
    const validEntries = optEntries.filter(([k, v]) => {
      const val = String(v).trim().toLowerCase();
      const key = String(k).trim().toLowerCase();
      if (key === "e" || key === "5") {
        if (val.includes("question not attempted") || val.includes("अनुत्तरित प्रश्न") || val === "") {
          return false;
        }
      }
      return true;
    });

    // Determine correct option
    const rawAnswer = String(raw.answer).trim();
    let correctIdx = -1;

    // Check direct key match (e.g., 'a', 'b', 'A', 'B', '1', '2')
    const keyMatchIdx = validEntries.findIndex(([k]) => k.toLowerCase() === rawAnswer.toLowerCase());
    if (keyMatchIdx !== -1) {
      correctIdx = keyMatchIdx;
    } else {
      // Check 1-based index (e.g., '1', '2', '3', '4')
      const num = parseInt(rawAnswer, 10);
      if (!isNaN(num) && num >= 1 && num <= validEntries.length) {
        correctIdx = num - 1;
      }
    }

    if (correctIdx === -1) {
      throw new Error(`Failed to resolve correct answer '${rawAnswer}' for question ${raw.id}`);
    }

    const options = validEntries.map(([_, text], i) => ({
      id: `opt${i + 1}`,
      text: String(text).trim(),
    }));

    const correctAnswer = `opt${correctIdx + 1}`;

    // 3. Explanation markdown
    const concept = raw.concept?.trim() || "";
    const elimination = raw.elimination_logic?.trim() || "";
    const explanationParts: string[] = [];
    if (concept) {
      explanationParts.push(`**नियम / अवधारणा (Grammar Concept):**\n${concept}`);
    }
    if (elimination) {
      explanationParts.push(`**विकल्प विश्लेषण (Elimination Logic):**\n${elimination}`);
    }
    const explanation = explanationParts.join("\n\n");

    // 4. Difficulty
    let difficulty: "easy" | "medium" | "hard" = "medium";
    if (
      concept.includes("Inversion") ||
      concept.includes("Antecedent") ||
      concept.includes("What-clause") ||
      concept.includes("Noun of Multitude") ||
      concept.includes("the only one")
    ) {
      difficulty = "hard";
    } else if (raw.id <= 10 || raw.id === 46 || raw.id === 63 || raw.id === 66) {
      difficulty = "easy";
    }

    const year = extractYear(raw.exam);
    const sourceId = `eng_sva_${String(raw.id).padStart(4, "0")}`;

    return {
      id: sourceId,
      type: "mcq",
      questionText: qText,
      options,
      correctAnswer,
      explanation,
      difficulty,
      reference: raw.exam || "RPSC / REET English Grammar",
      meta: {
        source: "RPSC & State Exams PYQ / Target Mock",
        sourceQuestionId: sourceId,
        originalId: raw.id,
        exam: raw.exam || "RPSC 2nd Grade English",
        year,
        concept,
        elimination_logic: elimination,
        topic: "Subject-Verb Agreement",
        masterTopicId: 57,
      },
    };
  });
}

async function main() {
  console.log("==========================================================");
  console.log("   IMPORTING SUBJECT-VERB AGREEMENT POOL TO CONVEX & FILES ");
  console.log("==========================================================\n");

  const formattedQuestions = formatRawQuestions();
  console.log(`✓ Successfully formatted ${formattedQuestions.length} questions.`);

  // 1. Save master quiz set JSON file in data/english/quiz_sets
  const cwd = process.cwd();
  const quizSetsDir = path.join(cwd, "data", "english", "quiz_sets");
  fs.mkdirSync(quizSetsDir, { recursive: true });

  const quizSetPayload = {
    name: "Subject-Verb Agreement & Concord Practice",
    topicName: "Parts of Speech – Verbs",
    subjectName: "English (Paper-II)",
    questionCount: formattedQuestions.length,
    durationMinutes: Math.round(formattedQuestions.length * 0.75),
    negativeMarking: true,
    questions: formattedQuestions,
  };

  const quizSetPath = path.join(quizSetsDir, "set_04_subject_verb_agreement_concord.json");
  fs.writeFileSync(quizSetPath, JSON.stringify(quizSetPayload, null, 2), "utf-8");
  console.log(`✓ Saved master quiz set JSON to ${quizSetPath}`);

  // 2. Update data/ddd/english/topics/27_Subject-Verb_Agreement.json
  const svaTopicPath = path.join(cwd, "data", "ddd", "english", "topics", "27_Subject-Verb_Agreement.json");
  let existingSvaQuestions: any[] = [];
  if (fs.existsSync(svaTopicPath)) {
    const svaData = JSON.parse(fs.readFileSync(svaTopicPath, "utf-8"));
    existingSvaQuestions = svaData.questions || [];
  }

  // Convert to pool question format
  const poolQuestions = formattedQuestions.map((q, idx) => {
    const ansNum = parseInt(q.correctAnswer.replace("opt", ""), 10);
    const ansLetter = ["A", "B", "C", "D"][ansNum - 1] || "A";
    return {
      id: q.id,
      source: "RPSC & State Exams PYQ / Target Mock",
      sourceTopicId: 600,
      sourceTopic: "Subject-Verb Agreement",
      topicId: 27,
      topic: "Subject-Verb Agreement",
      topicHindi: "कर्ता-क्रिया सामंजस्य (Subject-Verb Agreement)",
      masterTopicId: 57,
      masterTopic: "Parts of Speech – Verbs",
      question: q.questionText,
      options: q.options.map((o) => o.text),
      answer: ansLetter,
      answerIndex: ansNum - 1,
      exam: q.meta.exam,
      year: q.meta.year,
      explanation: q.explanation,
      rawPosition: existingSvaQuestions.length + idx + 1,
      pageStart: 0,
    };
  });

  const updatedSvaTopic = {
    topicId: 27,
    websiteTopicId: 600,
    topic: "Subject-Verb Agreement",
    topicHindi: "कर्ता-क्रिया सामंजस्य (Subject-Verb Agreement)",
    totalAvailable: existingSvaQuestions.length + poolQuestions.length,
    questions: [...existingSvaQuestions, ...poolQuestions],
  };
  fs.writeFileSync(svaTopicPath, JSON.stringify(updatedSvaTopic, null, 2), "utf-8");
  console.log(`✓ Updated ${svaTopicPath} (Total: ${updatedSvaTopic.totalAvailable} questions)`);

  // 3. Update data/ddd/english/topics/57_Parts_of_Speech_–_Verbs.json
  const verbsTopicPath = path.join(cwd, "data", "ddd", "english", "topics", "57_Parts_of_Speech_–_Verbs.json");
  let existingVerbsData: any = {};
  let existingVerbsQuestions: any[] = [];
  if (fs.existsSync(verbsTopicPath)) {
    existingVerbsData = JSON.parse(fs.readFileSync(verbsTopicPath, "utf-8"));
    existingVerbsQuestions = existingVerbsData.questions || [];
  }

  const combinedVerbsQuestions = [...existingVerbsQuestions, ...poolQuestions];
  const updatedVerbsTopic = {
    ...existingVerbsData,
    masterTopicId: 57,
    topicId: 57,
    order: 1,
    name: "Parts of Speech – Verbs",
    nameHindi: "क्रिया (Verbs)",
    slug: "parts-of-speech-verbs",
    part: "Part-I (Grammar & Usage)",
    totalAvailable: combinedVerbsQuestions.length,
    subtopics: [
      { name: "Verb", count: 76 },
      { name: "Subject-Verb Agreement", count: existingSvaQuestions.length + poolQuestions.length },
    ],
    questions: combinedVerbsQuestions,
  };
  fs.writeFileSync(verbsTopicPath, JSON.stringify(updatedVerbsTopic, null, 2), "utf-8");
  console.log(`✓ Updated ${verbsTopicPath} (Total: ${updatedVerbsTopic.totalAvailable} questions)`);

  // 4. Update data/ddd/english/pool-state.json
  const poolStatePath = path.join(cwd, "data", "ddd", "english", "pool-state.json");
  if (fs.existsSync(poolStatePath)) {
    const poolState = JSON.parse(fs.readFileSync(poolStatePath, "utf-8"));
    if (poolState.topics && poolState.topics["57"]) {
      const top57 = poolState.topics["57"];
      const newIds = poolQuestions.map((q) => q.id);
      const combinedQueue = [...top57.queue, ...newIds];
      const combinedAvail = [...top57.available, ...newIds];
      top57.totalAvailable = combinedQueue.length;
      top57.queue = combinedQueue;
      top57.available = combinedAvail;
      poolState.totalMasterPoolQuestions = (poolState.totalMasterPoolQuestions || 0) + poolQuestions.length;
      poolState.totalTopicAssignedQuestions = (poolState.totalTopicAssignedQuestions || 0) + poolQuestions.length;
      poolState.totalAvailable = (poolState.totalAvailable || 0) + poolQuestions.length;
      fs.writeFileSync(poolStatePath, JSON.stringify(poolState, null, 2), "utf-8");
      console.log(`✓ Updated ${poolStatePath} (Topic 57 available: ${top57.totalAvailable})`);
    }
  }

  // 5. Update data/ddd/english/prepared/all_questions.json
  const allQuestionsPath = path.join(cwd, "data", "ddd", "english", "prepared", "all_questions.json");
  if (fs.existsSync(allQuestionsPath)) {
    const allQ = JSON.parse(fs.readFileSync(allQuestionsPath, "utf-8"));
    const updatedAllQ = [...allQ, ...poolQuestions];
    fs.writeFileSync(allQuestionsPath, JSON.stringify(updatedAllQ, null, 2), "utf-8");
    console.log(`✓ Appended ${poolQuestions.length} questions to ${allQuestionsPath} (Total: ${updatedAllQ.length})`);
  }

  // 6. Now Import to Convex Database!
  console.log(`\nImporting to Convex (${CONVEX_URL}) [${isProd ? "PRODUCTION" : "DEVELOPMENT"}]...`);

  // Dynamically find English subject and Parts of Speech – Verbs topic
  const subRes = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "subjects:getBySlug",
      args: { slug: "english" },
    }),
  });
  const subject = (await subRes.json()).value;
  if (!subject) {
    throw new Error(`English subject not found on ${CONVEX_URL}`);
  }

  const topicsRes = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "topics:listBySubject",
      args: { subjectId: subject._id },
    }),
  });
  const topics: any[] = (await topicsRes.json()).value || [];
  const targetTopic = topics.find(
    (t) => t.slug === "parts-of-speech-verbs" || t.name.toLowerCase().includes("verb")
  );
  if (!targetTopic) {
    throw new Error(`Topic 'Parts of Speech – Verbs' not found on ${CONVEX_URL}`);
  }

  const targetTopicId = targetTopic._id;
  console.log(`✓ Resolved Topic: ${targetTopic.name} (${targetTopicId})`);

  const importPayload = {
    topicId: targetTopicId,
    name: "Subject-Verb Agreement & Concord Practice",
    negativeMarking: true,
    isFinalSet: true,
    adminSecret: "quizzer_admin_pool_init_2026",
    questions: formattedQuestions.map((q) => ({
      type: q.type,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      reference: q.reference,
      meta: q.meta,
    })),
  };

  const importRes = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "questions:importTestSet",
      args: importPayload,
    }),
  });

  const importResult = await importRes.json();
  if (!importRes.ok || importResult.errorMessage) {
    console.error("❌ Convex Import Failed:", importResult.errorMessage || importResult);
    process.exit(1);
  }

  console.log("\n🎉 CONVEX IMPORT SUCCESSFUL!");
  console.log("Import Result:", JSON.stringify(importResult.value, null, 2));
}

main().catch((err) => {
  console.error("FATAL ERROR in import runner:", err);
  process.exit(1);
});
