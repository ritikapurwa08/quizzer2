import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const INDEX_PATH = path.join(ROOT_DIR, "src/xdata/topics/index.json");
const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));

console.log(`Total topics in index.json: ${indexData.topics.length}`);

// Group by question count ranges as requested by user in Part 4:
// - 0-20 questions
// - 21-40 questions
// - 41-60 questions
// - 61+ questions
const range_0_20: any[] = [];
const range_21_40: any[] = [];
const range_41_60: any[] = [];
const range_61_plus: any[] = [];

indexData.topics.forEach((t: any) => {
  const count = t.questionCount || 0;
  if (count <= 20) range_0_20.push(t);
  else if (count <= 40) range_21_40.push(t);
  else if (count <= 60) range_41_60.push(t);
  else range_61_plus.push(t);
});

console.log(`\nQuestion count distribution across 189 old topics:`);
console.log(`  0 - 20 questions: ${range_0_20.length} topics`);
console.log(`  21 - 40 questions: ${range_21_40.length} topics`);
console.log(`  41 - 60 questions: ${range_41_60.length} topics`);
console.log(`  61+ questions: ${range_61_plus.length} topics`);

console.log(`\nSample topics in 0 - 20 questions:`);
range_0_20.slice(0, 10).forEach(t => console.log(`  [ID ${t.id}] ${t.topic} (${t.questionCount} Qs) [${t.source}]`));
