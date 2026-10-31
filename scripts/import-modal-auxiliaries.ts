import fs from "fs";
import path from "path";

const PROD_CONVEX_URL = "https://shiny-wildcat-270.convex.cloud";
const isProd = process.argv.includes("--prod");
const CONVEX_URL = isProd
  ? PROD_CONVEX_URL
  : process.env.NEXT_PUBLIC_CONVEX_URL || "https://perceptive-orca-161.convex.cloud";

export interface ConvexQuestionInput {
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
    originalId: string;
    exam: string;
    year: number;
    topic: string;
    masterTopicId: number;
    sourceType: string;
  };
}

async function main() {
  console.log("==========================================================");
  console.log("     IMPORTING MODAL AUXILIARIES POOL TO CONVEX & FILES   ");
  console.log("==========================================================\n");

  const cwd = process.cwd();
  const convexImportPath = path.join(
    cwd,
    "data",
    "english",
    "part_1_secondary_sr_secondary",
    "05_modal_auxiliaries",
    "modals_convex_import.json"
  );

  if (!fs.existsSync(convexImportPath)) {
    throw new Error(`Convex import file not found: ${convexImportPath}`);
  }

  const convexQuestions: ConvexQuestionInput[] = JSON.parse(
    fs.readFileSync(convexImportPath, "utf-8")
  );
  console.log(`✓ Loaded ${convexQuestions.length} verified questions for Modal Auxiliaries.`);

  // 1. Update pool-state.json if available
  const poolStatePath = path.join(cwd, "data", "ddd", "english", "pool-state.json");
  if (fs.existsSync(poolStatePath)) {
    const poolState = JSON.parse(fs.readFileSync(poolStatePath, "utf-8"));
    const topicKey = "63";
    const qIds = convexQuestions.map((q) => q.meta.sourceQuestionId);

    if (!poolState.topics) poolState.topics = {};
    if (!poolState.topics[topicKey]) {
      poolState.topics[topicKey] = {
        masterTopicId: 63,
        topicId: 63,
        order: 7,
        topic: "Modal Auxiliaries",
        topicHindi: "रूपात्मक सहायक क्रियाएँ (Modal Auxiliaries)",
        slug: "modal-auxiliaries",
        part: "Part-I (Grammar & Usage)",
        totalAvailable: qIds.length,
        queue: qIds,
        available: qIds,
        used: [],
        requeued: [],
        rejected: [],
      };
    } else {
      poolState.topics[topicKey].queue = qIds;
      poolState.topics[topicKey].available = qIds;
      poolState.topics[topicKey].totalAvailable = qIds.length;
    }

    fs.writeFileSync(poolStatePath, JSON.stringify(poolState, null, 2), "utf-8");
    console.log(`✓ Updated ${poolStatePath} for Topic 63 (${qIds.length} available).`);
  }

  // 2. Import to Convex Database
  console.log(`\nImporting to Convex (${CONVEX_URL}) [${isProd ? "PRODUCTION" : "DEVELOPMENT"}]...`);

  // Query English subject
  const subRes = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "subjects:getBySlug",
      args: { slug: "english" },
    }),
  });

  if (!subRes.ok) {
    console.warn(`Could not reach Convex at ${CONVEX_URL}. Status: ${subRes.statusText}`);
    return;
  }

  const subject = (await subRes.json()).value;
  if (!subject) {
    console.warn(`English subject not found on ${CONVEX_URL}. Skipping live database mutation.`);
    return;
  }

  // List topics for English
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
    (t) =>
      t.slug === "modal-auxiliaries" ||
      t.name.toLowerCase().includes("modal")
  );

  if (!targetTopic) {
    console.warn(`Topic 'Modal Auxiliaries' not found on ${CONVEX_URL}. Available topics: ${topics.map((t) => t.slug).join(", ")}`);
    return;
  }

  console.log(`✓ Resolved Topic on Convex: ${targetTopic.name} (${targetTopic._id})`);

  const importPayload = {
    topicId: targetTopic._id,
    name: "Modal Auxiliaries PYQ & Standard Practice",
    negativeMarking: true,
    isFinalSet: true,
    adminSecret: "quizzer_admin_pool_init_2026",
    questions: convexQuestions.map((q) => ({
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
    return;
  }

  console.log("\n🎉 CONVEX IMPORT SUCCESSFUL!");
  console.log("Import Result:", JSON.stringify(importResult.value, null, 2));
}

main().catch((err) => {
  console.error("FATAL ERROR in import runner:", err);
  process.exit(1);
});
