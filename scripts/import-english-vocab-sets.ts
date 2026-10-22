import fs from "fs";
import path from "path";

const PROD_CONVEX_URL = "https://shiny-wildcat-270.convex.cloud";

async function run() {
  const isProd = process.argv.includes("--prod");
  const convexUrl = isProd
    ? PROD_CONVEX_URL
    : process.env.NEXT_PUBLIC_CONVEX_URL || "https://perceptive-orca-161.convex.cloud";

  console.log(`\n=== IMPORTING ENGLISH VOCAB TEST SETS ===`);
  console.log(`Target: ${isProd ? "PRODUCTION (" + convexUrl + ")" : "DEVELOPMENT (" + convexUrl + ")"}\n`);

  // 1. Find English subject and 'Synonyms and Antonyms' topic
  const subRes = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "subjects:getBySlug",
      args: { slug: "english" },
    }),
  });

  const subJson = await subRes.json();
  const subject = subJson.value;

  if (!subject) {
    console.error("❌ English subject not found! Run seed:seedEnglishSyllabus first.");
    process.exit(1);
  }

  const topicsRes = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "topics:listBySubject",
      args: { subjectId: subject._id },
    }),
  });

  const topicsJson = await topicsRes.json();
  const topics: any[] = topicsJson.value || [];

  const targetTopic = topics.find(
    (t) =>
      t.slug === "synonyms-and-antonyms" ||
      t.name.toLowerCase().includes("synonym") ||
      t.nameHindi?.includes("समानार्थी")
  );

  if (!targetTopic) {
    console.error("❌ Topic 'Synonyms and Antonyms' not found under English subject.");
    process.exit(1);
  }

  console.log(`✓ Found Subject: ${subject.name} (${subject._id})`);
  console.log(`✓ Found Topic  : ${targetTopic.name} (${targetTopic._id})\n`);

  // 2. Import Sets 1, 2, 3
  const cwd = process.cwd();
  const quizSetsDir = path.join(cwd, "data", "english", "quiz_sets");
  const setFiles = [
    "set_01_vocab_mcqs.json",
    "set_02_vocab_mcqs.json",
    "set_03_vocab_mcqs.json",
  ];

  for (const file of setFiles) {
    const filePath = path.join(quizSetsDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}, skipping.`);
      continue;
    }

    const setData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    console.log(`Importing "${setData.name}" (${setData.questions.length} questions)...`);

    const formattedQuestions = setData.questions.map((q: any) => ({
      type: "mcq",
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || "medium",
      meta: {
        ...(q.meta || {}),
        sourceQuestionId: q.id,
      },
    }));

    const importRes = await fetch(`${convexUrl}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "questions:importTestSet",
        args: {
          topicId: targetTopic._id,
          name: setData.name,
          negativeMarking: setData.negativeMarking ?? true,
          questions: formattedQuestions,
          isFinalSet: true,
          adminSecret: "quizzer_admin_pool_init_2026",
        },
      }),
    });

    const resJson = await importRes.json();
    if (!importRes.ok || resJson.errorMessage) {
      console.error(`❌ Failed to import ${file}:`, resJson.errorMessage || resJson);
    } else {
      console.log(`  ✓ Successfully imported ${resJson.value?.totalQuestions ?? formattedQuestions.length} questions!\n`);
    }
  }

  console.log("=== ALL ENGLISH SETS IMPORTED SUCCESSFULLY ===");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
