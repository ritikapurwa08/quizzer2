import fs from "fs";
import path from "path";

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function run() {
  const localTopic61 = path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json");
  const localData = JSON.parse(fs.readFileSync(localTopic61, "utf-8"));
  const localQs = localData.questions || [];

  const convexPath = path.join(process.cwd(), "scripts", "convex-tenses-questions.json");
  const convexQs = fs.existsSync(convexPath) ? JSON.parse(fs.readFileSync(convexPath, "utf-8")) : [];

  console.log("Local 61_Tenses questions count:", localQs.length);
  console.log("Convex PROD questions count:", convexQs.length);

  const localNormMap = new Map<string, any>();
  for (const q of localQs) {
    const k = norm(q.question);
    if (!localNormMap.has(k)) {
      localNormMap.set(k, q);
    }
  }

  const convexNormMap = new Map<string, any>();
  for (const q of convexQs) {
    const k = norm(q.questionText);
    if (!convexNormMap.has(k)) {
      convexNormMap.set(k, q);
    }
  }

  console.log("Unique questions in local pool:", localNormMap.size);
  console.log("Unique questions in Convex PROD:", convexNormMap.size);

  let matchCount = 0;
  for (const [k] of convexNormMap) {
    if (localNormMap.has(k)) {
      matchCount++;
    }
  }
  console.log("Matching questions between Convex and Local:", matchCount);
}

run();
