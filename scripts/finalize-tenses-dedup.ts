import fs from "fs";
import path from "path";

function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/["'“”‘’]/g, "")
    .replace(/[._\-–—,;:?!/\\()[\]{}*#~`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanInstruction(s: string): string {
  return norm(s)
    .replace(/^fill in the blank[s]? (with|by|choosing|using) [a-z0-9 ]+ (below|from the options|options given below|given options)?[:\n]?\s*/gi, "")
    .replace(/^choose the (most )?(appropriate|correct) (word|option|verb form|tense form|form of verb|tense of the verb|form of the verb)? (from the options|to complete|to fill|in the blank space|for the following blank|from those given below)?[:\n]?\s*/gi, "")
    .replace(/^select the (most )?(appropriate|correct|best) (option|verb form|sentence)? (to fill|given below)?[:\n]?\s*/gi, "")
    .replace(/^complete the (given )?sentence [a-z0-9 ]+[:\n]?\s*/gi, "")
    .replace(/^identify the [a-z0-9 ]+[:\n]?\s*/gi, "")
    .replace(/^pick the [a-z0-9 ]+[:\n]?\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

const incoming: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "incoming-tenses-raw.json"), "utf-8"));
const convexQs: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "convex-tenses-questions.json"), "utf-8"));
const local61Qs: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json"), "utf-8")).questions || [];

const existingList: { id: string; source: string; rawText: string; normText: string; cleanText: string; options: string[] }[] = [];

for (const q of convexQs) {
  existingList.push({
    id: q._id,
    source: `Convex (${q.setName})`,
    rawText: q.questionText,
    normText: norm(q.questionText),
    cleanText: cleanInstruction(q.questionText),
    options: (q.options || []).map((o: any) => norm(o.text)),
  });
}

for (const q of local61Qs) {
  // Avoid duplicate entries if already in convex
  const n = norm(q.question);
  if (!existingList.some(e => e.normText === n)) {
    existingList.push({
      id: q.id,
      source: "Local 61_Tenses.json",
      rawText: q.question,
      normText: n,
      cleanText: cleanInstruction(q.question),
      options: (q.options || []).map((o: string) => norm(o)),
    });
  }
}

console.log(`Indexed ${existingList.length} unique existing questions in pool.`);

const duplicates: { incNum: number; incText: string; matchId: string; matchSource: string; matchText: string; matchType: string }[] = [];
const unique: any[] = [];
const seenIncNorm = new Set<string>();

for (const inc of incoming) {
  const incNorm = norm(inc.question);
  const incClean = cleanInstruction(inc.question);
  const incOpts = Object.entries(inc.options)
    .filter(([k]) => k.toUpperCase() !== "E")
    .map(([, v]) => norm(v as string));

  // 1. Check internal duplicate within this incoming batch
  if (seenIncNorm.has(incNorm) || (incClean.length > 20 && seenIncNorm.has(incClean))) {
    duplicates.push({
      incNum: inc.question_number,
      incText: inc.question.replace(/\n/g, " "),
      matchId: "internal",
      matchSource: "Incoming Batch",
      matchText: "Earlier question in same batch",
      matchType: "Internal Batch Duplicate",
    });
    continue;
  }

  // 2. Check match with existing pool
  let foundMatch: any = null;
  let matchType = "";

  for (const ex of existingList) {
    // A. Direct normalized match
    if (ex.normText === incNorm) {
      foundMatch = ex;
      matchType = "Exact Normalized Text Match";
      break;
    }

    // B. Clean text match (ignoring instruction header like "Fill in the blank...")
    if (incClean.length > 15 && ex.cleanText.length > 15 && incClean === ex.cleanText) {
      foundMatch = ex;
      matchType = "Core Sentence Exact Match";
      break;
    }

    // C. Substring match if long enough
    if (incClean.length > 25 && ex.cleanText.length > 25) {
      if (incClean.includes(ex.cleanText) || ex.cleanText.includes(incClean)) {
        // verify options overlap
        let commonOpts = 0;
        for (const io of incOpts) {
          if (ex.options.includes(io)) commonOpts++;
        }
        if (commonOpts >= 2) {
          foundMatch = ex;
          matchType = `Core Sentence Substring + Options Match (${commonOpts} options)`;
          break;
        }
      }
    }
  }

  if (foundMatch) {
    duplicates.push({
      incNum: inc.question_number,
      incText: inc.question.replace(/\n/g, " "),
      matchId: foundMatch.id,
      matchSource: foundMatch.source,
      matchText: foundMatch.rawText.replace(/\n/g, " "),
      matchType,
    });
  } else {
    seenIncNorm.add(incNorm);
    if (incClean.length > 20) seenIncNorm.add(incClean);
    unique.push(inc);
  }
}

console.log("\n=======================================================");
console.log("FINAL DEDUPLICATION SUMMARY");
console.log("=======================================================");
console.log(`Total Incoming Questions:       ${incoming.length}`);
console.log(`Duplicates Removed:             ${duplicates.length}`);
console.log(`Unique New Questions Retained:  ${unique.length}`);
console.log("=======================================================\n");

// Write duplicates report
fs.writeFileSync(
  path.join(process.cwd(), "scripts", "dedup-report-duplicates.json"),
  JSON.stringify(duplicates, null, 2),
  "utf-8"
);

// Write final unique questions
fs.writeFileSync(
  path.join(process.cwd(), "scripts", "dedup-final-unique.json"),
  JSON.stringify(unique, null, 2),
  "utf-8"
);

console.log("First 10 duplicates detected:");
duplicates.slice(0, 10).forEach(d => {
  console.log(`- Q#${d.incNum}: "${d.incText.slice(0, 50)}..."`);
  console.log(`  -> [${d.matchSource}] "${d.matchText.slice(0, 50)}..." (${d.matchType})`);
});

console.log(`\nSaved dedup-final-unique.json with ${unique.length} verified unique questions!`);
