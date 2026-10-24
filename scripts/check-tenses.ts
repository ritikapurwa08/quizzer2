import fs from "fs";
import path from "path";

async function main() {
  const isProd = process.argv.includes("--prod");
  const convexUrl = isProd
    ? "https://shiny-wildcat-270.convex.cloud"
    : "https://perceptive-orca-161.convex.cloud";
  console.log(`Checking ${isProd ? "PROD" : "DEV"} (${convexUrl})...`);
  const subRes = await fetch(convexUrl + "/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: "subjects:list", args: {} }),
  });
  const subjects = ((await subRes.json()) as any).value || [];
  
  console.log("=== CONVEX DEV STATUS ===");
  let convexQuestions: any[] = [];
  for (const s of subjects) {
    const topRes = await fetch(convexUrl + "/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "topics:listBySubject", args: { subjectId: s._id } }),
    });
    const topics = ((await topRes.json()) as any).value || [];
    for (const t of topics) {
      if (t.name.toLowerCase().includes("tense")) {
        const setsRes = await fetch(convexUrl + "/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "testSets:listByTopic", args: { topicId: t._id } }),
        });
        const sets = ((await setsRes.json()) as any).value || [];
        console.log("Subject:", s.name, "| Topic:", t.name, "| Sets:", sets.length);
        let totalQ = 0;
        for (const set of sets) {
          totalQ += set.questionCount;
          const qRes = await fetch(convexUrl + "/api/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: "questions:listByTestSet", args: { testSetId: set._id } }),
          });
          const qList = ((await qRes.json()) as any).value || [];
          convexQuestions.push(...qList.map((q: any) => ({ ...q, setName: set.name, setId: set._id })));
          console.log("  -", set.name, `(${qList.length} questions, ID: ${set._id})`);
        }
        console.log("Total Convex questions loaded for tenses:", convexQuestions.length);
      }
    }
  }

  // Also check local files
  console.log("\n=== LOCAL REPO POOL STATUS ===");
  const localTopic61 = path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json");
  if (fs.existsSync(localTopic61)) {
    const data = JSON.parse(fs.readFileSync(localTopic61, "utf-8"));
    console.log("Local 61_Tenses_&_Sequence_of_Tenses.json:", data.questions?.length, "questions");
  }
  const localTopic01 = path.join(process.cwd(), "data", "ddd", "english", "topics", "01_Tense.json");
  if (fs.existsSync(localTopic01)) {
    const data = JSON.parse(fs.readFileSync(localTopic01, "utf-8"));
    console.log("Local 01_Tense.json:", data.questions?.length, "questions");
  }
  const localTensesQuestions = path.join(process.cwd(), "data", "english", "part_1_secondary_sr_secondary", "03_tenses", "tenses_questions.json");
  if (fs.existsSync(localTensesQuestions)) {
    const data = JSON.parse(fs.readFileSync(localTensesQuestions, "utf-8"));
    console.log("Local 03_tenses/tenses_questions.json:", data.questions?.length, "questions");
  }

  // Save list of all convex questions to a file for easy diffing/inspection
  fs.writeFileSync(
    path.join(process.cwd(), "scripts", "convex-tenses-questions.json"),
    JSON.stringify(convexQuestions, null, 2),
    "utf-8"
  );
  console.log("\nSaved Convex questions snapshot to scripts/convex-tenses-questions.json");
}

main().catch(console.error);
