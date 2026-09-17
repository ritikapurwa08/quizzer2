import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../../..");
const INDEX_PATH = path.join(ROOT_DIR, "src/xdata/topics/index.json");
const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));

const groups: Record<string, any[]> = { "0_20": [], "21_40": [], "41_60": [], "61_plus": [] };

indexData.topics.forEach((t: any) => {
  const c = t.questionCount || 0;
  if (c <= 20) groups["0_20"].push(t);
  else if (c <= 40) groups["21_40"].push(t);
  else if (c <= 60) groups["41_60"].push(t);
  else groups["61_plus"].push(t);
});

console.log("=== 189 OLD TOPICS QUESTION COUNT DISTRIBUTION ===");
console.log(`0-20 questions: ${groups["0_20"].length} topics`);
console.log(`21-40 questions: ${groups["21_40"].length} topics`);
console.log(`41-60 questions: ${groups["41_60"].length} topics`);
console.log(`61+ questions: ${groups["61_plus"].length} topics`);

console.log("\n--- GROUP 1: 0 - 20 QUESTIONS ---");
groups["0_20"].forEach(t => console.log(`  [ID ${t.id}] ${t.topic} (${t.questionCount} Qs) [${t.source}]`));

console.log("\n--- GROUP 2: 21 - 40 QUESTIONS ---");
groups["21_40"].forEach(t => console.log(`  [ID ${t.id}] ${t.topic} (${t.questionCount} Qs) [${t.source}]`));

console.log("\n--- GROUP 3: 41 - 60 QUESTIONS ---");
groups["41_60"].forEach(t => console.log(`  [ID ${t.id}] ${t.topic} (${t.questionCount} Qs) [${t.source}]`));
