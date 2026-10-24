import fs from "fs";
import path from "path";

// Normalizer for question deduplication
function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/["'“”‘’]/g, "")
    .replace(/[._\-–—,;:?!/\\()[\]{}*#~`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCoreBlanks(text: string): string {
  // Replace multiple dots, underscores, or dashes with ___
  return text
    .replace(/[._\-–—]{2,}/g, "___")
    .replace(/\s+/g, " ")
    .trim();
}

interface IncomingQuestion {
  question_number: number;
  question: string;
  exam_tag?: string;
  options: Record<string, string>;
  answer: string;
}

async function analyze() {
  const incomingPath = path.join(process.cwd(), "scripts", "incoming-tenses-raw.json");
  const incoming: IncomingQuestion[] = JSON.parse(fs.readFileSync(incomingPath, "utf-8"));

  const convexPath = path.join(process.cwd(), "scripts", "convex-tenses-questions.json");
  const convexQs: any[] = fs.existsSync(convexPath) ? JSON.parse(fs.readFileSync(convexPath, "utf-8")) : [];

  const local61Path = path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json");
  const local61: any = fs.existsSync(local61Path) ? JSON.parse(fs.readFileSync(local61Path, "utf-8")) : { questions: [] };
  const local61Qs: any[] = local61.questions || [];

  console.log(`=======================================================`);
  console.log(`ANALYSIS OF INCOMING TENSES QUESTIONS`);
  console.log(`=======================================================`);
  console.log(`Incoming Questions Count:          ${incoming.length}`);
  console.log(`Existing Convex PROD Questions:   ${convexQs.length}`);
  console.log(`Existing Local Pool 61 Questions:  ${local61Qs.length}`);

  // Combine existing questions for matching
  // Map normalized string -> existing question info
  const existingMap = new Map<string, { source: string; id: string; text: string }>();

  for (const q of convexQs) {
    const norm = normalizeText(q.questionText);
    if (!existingMap.has(norm)) {
      existingMap.set(norm, {
        source: `Convex (${q.setName})`,
        id: q._id,
        text: q.questionText,
      });
    }
  }

  for (const q of local61Qs) {
    const norm = normalizeText(q.question);
    if (!existingMap.has(norm)) {
      existingMap.set(norm, {
        source: "Local 61_Tenses.json",
        id: q.id,
        text: q.question,
      });
    }
  }

  const duplicatesWithExisting: { incomingNum: number; incomingText: string; matchedWith: any }[] = [];
  const internalDuplicates: { incomingNum: number; duplicateOf: number; text: string }[] = [];
  const uniqueIncoming: IncomingQuestion[] = [];

  const seenIncomingNorm = new Map<string, number>();

  for (const inc of incoming) {
    const norm = normalizeText(inc.question);

    // 1. Check internal duplicate within incoming set
    if (seenIncomingNorm.has(norm)) {
      const origNum = seenIncomingNorm.get(norm)!;
      internalDuplicates.push({
        incomingNum: inc.question_number,
        duplicateOf: origNum,
        text: inc.question,
      });
      continue;
    }

    // 2. Check duplicate with existing database / local pool
    // Exact normalized match
    let match = existingMap.get(norm);

    // If no direct match, check if question without instruction matches
    if (!match) {
      // E.g., question text like "Fill in the blank with appropriate option:\nThe chief Guest..." -> try matching the line after newline
      const lines = inc.question.split("\n").map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.length > 15) {
          const lineNorm = normalizeText(line);
          if (existingMap.has(lineNorm)) {
            match = existingMap.get(lineNorm);
            break;
          }
        }
      }
    }

    // Also check vice versa for existing questions containing instructions
    if (!match) {
      for (const [existNorm, existInfo] of existingMap.entries()) {
        if (norm.length > 25 && existNorm.length > 25) {
          // Check substring inclusion
          if (existNorm.includes(norm) || norm.includes(existNorm)) {
            match = existInfo;
            break;
          }
        }
      }
    }

    if (match) {
      duplicatesWithExisting.push({
        incomingNum: inc.question_number,
        incomingText: inc.question.replace(/\n/g, " "),
        matchedWith: match,
      });
    } else {
      seenIncomingNorm.set(norm, inc.question_number);
      uniqueIncoming.push(inc);
    }
  }

  console.log(`\n-------------------------------------------------------`);
  console.log(`RESULTS:`);
  console.log(`-------------------------------------------------------`);
  console.log(`Duplicates matching existing pool: ${duplicatesWithExisting.length}`);
  console.log(`Internal duplicates within batch:   ${internalDuplicates.length}`);
  console.log(`Unique New Questions to Add:        ${uniqueIncoming.length}`);
  console.log(`Total accounted for:                ${duplicatesWithExisting.length + internalDuplicates.length + uniqueIncoming.length} / ${incoming.length}`);

  console.log(`\n--- SAMPLE DUPLICATES MATCHED WITH EXISTING POOL ---`);
  duplicatesWithExisting.slice(0, 15).forEach((d) => {
    console.log(`Q#${d.incomingNum}: "${d.incomingText.slice(0, 70)}..."`);
    console.log(`   -> Matches [${d.matchedWith.source}]: "${d.matchedWith.text.slice(0, 70)}..."\n`);
  });

  if (internalDuplicates.length > 0) {
    console.log(`\n--- INTERNAL DUPLICATES IN INCOMING BATCH ---`);
    internalDuplicates.forEach((d) => {
      console.log(`Q#${d.incomingNum} is duplicate of Q#${d.duplicateOf}: "${d.text.replace(/\n/g, " ").slice(0, 70)}..."`);
    });
  }

  // Save unique questions to file for processing
  const uniquePath = path.join(process.cwd(), "scripts", "incoming-tenses-unique.json");
  fs.writeFileSync(uniquePath, JSON.stringify(uniqueIncoming, null, 2), "utf-8");
  console.log(`\nSaved ${uniqueIncoming.length} unique questions to ${uniquePath}`);

  const dupPath = path.join(process.cwd(), "scripts", "incoming-tenses-duplicates.json");
  fs.writeFileSync(dupPath, JSON.stringify(duplicatesWithExisting, null, 2), "utf-8");
  console.log(`Saved duplicate audit to ${dupPath}`);
}

analyze().catch(console.error);
