import fs from "fs";
import path from "path";

function norm(s: string): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/["'“”‘’`]/g, "")
    .replace(/[._\-–—,;:?!/\\()[\]{}*#~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCoreSentence(s: string): string {
  if (!s) return "";
  const lines = s.split("\n").map(l => l.trim()).filter(Boolean);
  // If there are multiple lines, the core sentence is usually the line with blanks or the main sentence
  for (const line of lines) {
    if (line.includes("...") || line.includes("___") || line.includes("---") || line.includes("....")) {
      return norm(line);
    }
  }
  // Otherwise strip common leading instructions
  return norm(s)
    .replace(/^(fill in the blank[s]?|choose the|select the|complete the|identify the|pick the|use the|rearrange the|match)[a-z0-9 ]*[:\n\-]+/i, "")
    .trim();
}

interface IncomingQuestion {
  question_number: number;
  question: string;
  exam_tag?: string;
  options: Record<string, string>;
  answer: string;
}

interface ExistingQuestion {
  id: string;
  source: string;
  rawText: string;
  normText: string;
  coreText: string;
  options: string[];
}

function main() {
  const incomingPath = path.join(process.cwd(), "scripts", "incoming-tenses-raw.json");
  const incoming: IncomingQuestion[] = JSON.parse(fs.readFileSync(incomingPath, "utf-8"));

  const convexPath = path.join(process.cwd(), "scripts", "convex-tenses-questions.json");
  const convexQs: any[] = fs.existsSync(convexPath) ? JSON.parse(fs.readFileSync(convexPath, "utf-8")) : [];

  const local61Path = path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json");
  const local61: any = fs.existsSync(local61Path) ? JSON.parse(fs.readFileSync(local61Path, "utf-8")) : { questions: [] };
  const local61Qs: any[] = local61.questions || [];

  const existingPool: ExistingQuestion[] = [];

  for (const q of convexQs) {
    existingPool.push({
      id: q._id,
      source: `Convex (${q.setName})`,
      rawText: q.questionText,
      normText: norm(q.questionText),
      coreText: extractCoreSentence(q.questionText),
      options: (q.options || []).map((o: any) => norm(o.text)),
    });
  }

  for (const q of local61Qs) {
    const n = norm(q.question);
    if (!existingPool.some(e => e.normText === n)) {
      existingPool.push({
        id: q.id,
        source: "Local 61_Tenses.json",
        rawText: q.question,
        normText: n,
        coreText: extractCoreSentence(q.question),
        options: (q.options || []).map((o: string) => norm(o)),
      });
    }
  }

  console.log(`Pool contains ${existingPool.length} unique existing questions for reference.`);

  const duplicateResults: any[] = [];
  const uniqueQuestions: IncomingQuestion[] = [];
  const seenIncoming = new Map<string, number>();

  for (const inc of incoming) {
    const incNorm = norm(inc.question);
    const incCore = extractCoreSentence(inc.question);
    const incOpts = Object.entries(inc.options)
      .filter(([k]) => k.toUpperCase() !== "E")
      .map(([, v]) => norm(v));

    // 1. Internal check
    if (seenIncoming.has(incNorm)) {
      duplicateResults.push({
        question_number: inc.question_number,
        incomingText: inc.question.replace(/\n/g, " "),
        matchType: "Internal Batch Duplicate",
        matchedWith: `Question #${seenIncoming.get(incNorm)}`,
      });
      continue;
    }

    // 2. Check against existing pool
    let match: ExistingQuestion | null = null;
    let matchReason = "";

    for (const ex of existingPool) {
      // Direct exact match
      if (ex.normText === incNorm) {
        match = ex;
        matchReason = "Exact Normalized Text Match";
        break;
      }

      // Core sentence match
      if (incCore.length > 15 && ex.coreText.length > 15) {
        if (incCore === ex.coreText) {
          match = ex;
          matchReason = "Core Sentence Exact Match";
          break;
        }

        if (incCore.includes(ex.coreText) || ex.coreText.includes(incCore)) {
          // Check options
          let commonOpts = 0;
          for (const io of incOpts) {
            if (ex.options.includes(io)) commonOpts++;
          }
          if (commonOpts >= 2) {
            match = ex;
            matchReason = `Core Sentence Substring + ${commonOpts} Options Match`;
            break;
          }
        }
      }

      // Check option match (if 4 options identical and text contains core keywords)
      let commonOpts = 0;
      for (const io of incOpts) {
        if (ex.options.includes(io)) commonOpts++;
      }
      if (commonOpts === 4 && incCore.length > 12 && ex.coreText.length > 12) {
        // Check if there is keyword overlap
        const incWords = new Set(incCore.split(" ").filter(w => w.length > 3));
        const exWords = new Set(ex.coreText.split(" ").filter(w => w.length > 3));
        let commonWords = 0;
        for (const w of incWords) {
          if (exWords.has(w)) commonWords++;
        }
        if (commonWords >= 2) {
          match = ex;
          matchReason = `Identical Options (4/4) + Keyword Overlap (${commonWords} words)`;
          break;
        }
      }
    }

    if (match) {
      duplicateResults.push({
        question_number: inc.question_number,
        incomingText: inc.question.replace(/\n/g, " "),
        matchType: matchReason,
        matchedWith: `[${match.source}] ${match.rawText.replace(/\n/g, " ")}`,
      });
    } else {
      seenIncoming.set(incNorm, inc.question_number);
      if (incCore.length > 20) seenIncoming.set(incCore, inc.question_number);
      uniqueQuestions.push(inc);
    }
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL INCOMING:     ${incoming.length}`);
  console.log(`DUPLICATES FOUND:   ${duplicateResults.length}`);
  console.log(`UNIQUE TO ADD:      ${uniqueQuestions.length}`);
  console.log(`======================================================\n`);

  fs.writeFileSync(
    path.join(process.cwd(), "scripts", "final-verified-duplicates.json"),
    JSON.stringify(duplicateResults, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(process.cwd(), "scripts", "final-verified-unique.json"),
    JSON.stringify(uniqueQuestions, null, 2),
    "utf-8"
  );

  console.log("All duplicate numbers:");
  console.log(duplicateResults.map(d => d.question_number).join(", "));
}

main();
