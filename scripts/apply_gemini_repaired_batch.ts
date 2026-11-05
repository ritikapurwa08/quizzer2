import fs from "fs";
import path from "path";

const batchPath = path.join(process.cwd(), "data", "gemini_repaired_batch_1.json");
const pubSetsPath = path.join(process.cwd(), "data", "master-pool", "published-sets.json");
const masterPoolPath = path.join(process.cwd(), "data", "master-pool", "master-pool.json");
const topicsDir = path.join(process.cwd(), "data", "ddd", "topics");

const batch: any[] = JSON.parse(fs.readFileSync(batchPath, "utf-8"));
console.log(`Loaded ${batch.length} repaired questions from Gemini.`);

const batchMap = new Map<string, any>();
for (const q of batch) {
  batchMap.set(q.id, q);
}

// Helper to convert options array to standard { id, text } format
function toStandardOptions(opts: string[] | { id: string; text: string }[]): { id: string; text: string }[] {
  return opts.map((opt, i) => {
    if (typeof opt === "string") {
      return { id: `opt${i + 1}`, text: opt.trim() };
    }
    return { id: opt.id || `opt${i + 1}`, text: String(opt.text || "").trim() };
  });
}

function toStandardAnswer(answer: number | string): string {
  if (typeof answer === "number") {
    return `opt${answer + 1}`;
  }
  const str = String(answer).trim().toLowerCase();
  if (str === "0" || str === "a") return "opt1";
  if (str === "1" || str === "b") return "opt2";
  if (str === "2" || str === "c") return "opt3";
  if (str === "3" || str === "d") return "opt4";
  if (str.startsWith("opt")) return str;
  return "opt1";
}

// 1. Update published-sets.json
let pubUpdated = 0;
if (fs.existsSync(pubSetsPath)) {
  const pubSets = JSON.parse(fs.readFileSync(pubSetsPath, "utf-8"));
  for (const s of pubSets) {
    for (const q of (s.questions || [])) {
      const match = batchMap.get(q.canonicalId) || batchMap.get(q.id);
      if (match) {
        pubUpdated++;
        q.questionText = match.question;
        q.question = match.question;
        q.options = toStandardOptions(match.options);
        q.correctAnswer = toStandardAnswer(match.answer);
        if (match.explanation) q.explanation = match.explanation;
        if (match.exam) {
          q.exam = match.exam;
          if (q.meta) q.meta.exam = match.exam;
        }
        if (match.year) {
          q.year = match.year;
          if (q.meta) q.meta.year = match.year;
        }
        // Clean fake match meta
        if (q.meta) {
          delete q.meta.left;
          delete q.meta.right;
          delete q.meta.leftTitle;
          delete q.meta.rightTitle;
          q.meta.rawQuestionText = match.question;
        }
        // If question was match following with pair-code options (like Q12, Q17, Q59), keep match_following
        const isPairCode = match.options.every((o: string) => /[a-dA-D\d]\s*[-–—:]\s*[I-Vi-v\d]/.test(String(o)));
        if (!isPairCode) {
          q.type = "mcq";
        }
      }
    }
  }
  fs.writeFileSync(pubSetsPath, JSON.stringify(pubSets, null, 2), "utf-8");
  console.log(`Updated ${pubUpdated} questions in published-sets.json.`);
}

// 2. Update master-pool.json
let masterUpdated = 0;
if (fs.existsSync(masterPoolPath)) {
  const masterPool: any[] = JSON.parse(fs.readFileSync(masterPoolPath, "utf-8"));
  for (const q of masterPool) {
    const match = batchMap.get(q.id);
    if (match) {
      masterUpdated++;
      q.question = match.question;
      q.questionText = match.question;
      q.options = match.options;
      q.answer = typeof match.answer === "number" ? ["A", "B", "C", "D"][match.answer] || "A" : match.answer;
      if (match.explanation) q.explanation = match.explanation;
      if (match.exam) q.exam = match.exam;
      if (match.year) q.year = match.year;
      const isPairCode = match.options.every((o: string) => /[a-dA-D\d]\s*[-–—:]\s*[I-Vi-v\d]/.test(String(o)));
      if (!isPairCode) {
        q.type = "mcq";
      }
    }
  }
  fs.writeFileSync(masterPoolPath, JSON.stringify(masterPool, null, 2), "utf-8");
  console.log(`Updated ${masterUpdated} questions in master-pool.json.`);
}

// 3. Update data/ddd/topics/*.json
let topicsUpdated = 0;
if (fs.existsSync(topicsDir)) {
  for (const f of fs.readdirSync(topicsDir)) {
    if (f.endsWith(".json")) {
      const topicPath = path.join(topicsDir, f);
      const topicData = JSON.parse(fs.readFileSync(topicPath, "utf-8"));
      let changed = false;
      for (const q of (topicData.questions || [])) {
        const match = batchMap.get(q.id);
        if (match) {
          topicsUpdated++;
          changed = true;
          q.question = match.question;
          q.questionText = match.question;
          q.options = match.options;
          q.answer = typeof match.answer === "number" ? ["A", "B", "C", "D"][match.answer] || "A" : match.answer;
          if (match.explanation) q.explanation = match.explanation;
          if (match.exam) q.exam = match.exam;
          if (match.year) q.year = match.year;
          const isPairCode = match.options.every((o: string) => /[a-dA-D\d]\s*[-–—:]\s*[I-Vi-v\d]/.test(String(o)));
          if (!isPairCode) {
            q.type = "mcq";
          }
        }
      }
      if (changed) {
        fs.writeFileSync(topicPath, JSON.stringify(topicData, null, 2), "utf-8");
      }
    }
  }
  console.log(`Updated ${topicsUpdated} questions in data/ddd/topics/*.json.`);
}

console.log("All batch 1 questions applied successfully!");

