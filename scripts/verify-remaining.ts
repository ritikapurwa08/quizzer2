import fs from "fs";
import path from "path";

const incoming: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "incoming-tenses-raw.json"), "utf-8"));
const dupNums = new Set([
  21, 26, 31, 32, 33, 35, 40, 41, 44, 46, 50, 51, 52, 54, 60, 61, 62, 63, 64, 68,
  79, 81, 82, 83, 84, 85, 86, 90, 91, 92, 93, 94, 95, 96, 100, 101, 103, 105, 106,
  108, 111, 112, 113, 114, 115, 116, 148, 158, 161, 171, 172, 180, 182
]);

const remainingUnique = incoming.filter(q => !dupNums.has(q.question_number));
console.log(`Remaining Unique Questions Count: ${remainingUnique.length}`);

// Check question 99
const q99 = remainingUnique.find(q => q.question_number === 99);
console.log("Q99:", q99);

// Check if any remaining question has Option E
let countWithOptE = 0;
for (const q of remainingUnique) {
  if (q.options && q.options.E) countWithOptE++;
}
console.log(`Questions with Option E (Question not attempted): ${countWithOptE}`);

const answers: Record<string, number> = {};
for (const q of remainingUnique) {
  const a = (q.answer || "").trim().toUpperCase();
  answers[a] = (answers[a] || 0) + 1;
}
console.log("Answer distribution:", answers);
