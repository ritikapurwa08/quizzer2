import fs from "fs";
import path from "path";

function cleanForFuzzy(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/fill in the blank[s]? with [^:\n]*[:\n]?/gi, "")
    .replace(/choose the correct [^:\n]*[:\n]?/gi, "")
    .replace(/select the [^:\n]*[:\n]?/gi, "")
    .replace(/complete the [^:\n]*[:\n]?/gi, "")
    .replace(/identify the [^:\n]*[:\n]?/gi, "")
    .replace(/pick the [^:\n]*[:\n]?/gi, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const uniquePath = path.join(process.cwd(), "scripts", "incoming-tenses-unique.json");
const uniqueQs: any[] = JSON.parse(fs.readFileSync(uniquePath, "utf-8"));

const convexPath = path.join(process.cwd(), "scripts", "convex-tenses-questions.json");
const convexQs: any[] = fs.existsSync(convexPath) ? JSON.parse(fs.readFileSync(convexPath, "utf-8")) : [];

const local61Path = path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json");
const local61Qs: any[] = JSON.parse(fs.readFileSync(local61Path, "utf-8")).questions || [];

const allExisting = [
  ...convexQs.map(q => ({ source: "Convex", id: q._id, text: q.questionText })),
  ...local61Qs.map(q => ({ source: "Local61", id: q.id, text: q.question })),
];

console.log("Checking 149 candidate unique questions for fuzzy duplicates...");

const fuzzyMatches: any[] = [];
for (const u of uniqueQs) {
  const uClean = cleanForFuzzy(u.question);
  if (uClean.length < 15) continue;

  for (const ex of allExisting) {
    const exClean = cleanForFuzzy(ex.text);
    if (exClean.length < 15) continue;

    // Check words overlap
    const uWords = new Set(uClean.split(" "));
    const exWords = new Set(exClean.split(" "));
    let common = 0;
    for (const w of uWords) {
      if (exWords.has(w)) common++;
    }
    const jaccard = common / Math.max(uWords.size, exWords.size);

    if (jaccard > 0.75 || uClean.includes(exClean) || exClean.includes(uClean)) {
      fuzzyMatches.push({
        qNum: u.question_number,
        uText: u.question.replace(/\n/g, " "),
        exText: ex.text.replace(/\n/g, " "),
        jaccard: jaccard.toFixed(2),
        exSource: ex.source,
      });
      break;
    }
  }
}

console.log(`Found ${fuzzyMatches.length} additional potential fuzzy duplicates:`);
fuzzyMatches.forEach((m) => {
  console.log(`Q#${m.qNum} (Similarity: ${m.jaccard}):`);
  console.log(`  Incoming: "${m.uText.slice(0, 80)}"`);
  console.log(`  Existing: "${m.exText.slice(0, 80)}" [${m.exSource}]\n`);
});
