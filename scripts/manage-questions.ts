import fs from "fs";
import path from "path";

// 47 Canonical Topics Mapping for Rajasthan GK
const GK_TOPIC_NAMES: Record<number, string> = {
  1: "राजस्थान का सामान्य ज्ञान",
  2: "राजस्थान का भौतिक स्वरूप एवं भूगोल",
  3: "राजस्थान की जलवायु",
  4: "राजस्थान की जनसंख्या एवं जनगणना",
  5: "राजस्थान की मृदा",
  6: "राजस्थान का अपवाह तंत्र, नदियाँ एवं झीलें",
  7: "राजस्थान की सिंचाई परियोजनाएँ, बाँध एवं जल प्रबंधन",
  8: "राजस्थान के वन, वन्यजीव, अभयारण्य एवं राष्ट्रीय उद्यान",
  9: "राजस्थान की कृषि",
  10: "राजस्थान का पशुपालन एवं डेयरी विकास",
  11: "राजस्थान के खनिज संसाधन",
  12: "राजस्थान के ऊर्जा संसाधन",
  13: "राजस्थान के प्रमुख उद्योग",
  14: "राजस्थान का परिवहन",
  15: "राजस्थान का पर्यटन एवं पर्यटन परिपथ",
  16: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल",
  17: "राजस्थान के प्रमुख राजपूत राजवंश एवं प्रशासनिक व्यवस्था (8वीं से 18वीं सदी)",
  18: "राजस्थान में 1857 का विद्रोह एवं ब्रिटिश संधियाँ",
  19: "राजस्थान के किसान एवं जनजातीय आंदोलन",
  20: "राजस्थान के प्रजामंडल आंदोलन",
  21: "राजस्थान का एकीकरण",
  22: "राजस्थान में राजनीतिक जन-जागरण, संगठन एवं समाचार पत्र/पत्रकारिता",
  23: "राजस्थान के प्रमुख व्यक्तित्व (पुरुष एवं महिला)",
  24: "राजस्थान के मेले",
  25: "राजस्थान के त्योहार",
  26: "राजस्थान की रीति-रिवाज एवं परंपराएँ",
  27: "राजस्थान की वेशभूषा एवं आभूषण",
  28: "राजस्थान की स्थापत्य कला एवं वास्तुकला",
  29: "राजस्थान की चित्रकला शैलियाँ",
  30: "राजस्थान के हस्तशिल्प एवं हस्तकलाएँ",
  31: "राजस्थान के लोक देवता एवं लोक देवियाँ",
  32: "राजस्थान के संत, संप्रदाय एवं धार्मिक परंपराएँ",
  33: "राजस्थान का लोक संगीत एवं लोकगीत",
  34: "राजस्थान के लोक नृत्य एवं नाट्य",
  35: "राजस्थानी भाषा एवं बोलियाँ",
  36: "राजस्थानी साहित्य",
  37: "राजस्थानी शब्दावली",
  38: "राजस्थानी मुहावरे एवं लोकोक्तियाँ",
  39: "राजस्थान के राज्यपाल",
  40: "राजस्थान के मुख्यमंत्री एवं मंत्रिपरिषद",
  41: "राजस्थान राज्य विधानमंडल (विधानसभा)",
  42: "राजस्थान उच्च न्यायालय एवं अधीनस्थ न्यायपालिका",
  43: "राज्य सचिवालय, मुख्य सचिव, संभागीय आयुक्त एवं जिला प्रशासन",
  44: "राजस्थान पंचायती राज व्यवस्था एवं प्रशासन",
  45: "राजस्थान नगरीय स्वशासन एवं नगरपालिका",
  46: "राजस्थान के प्रमुख आयोग एवं संवैधानिक संस्थाएँ",
  47: "राजस्थान के प्रमुख अनुसंधान एवं अध्ययन केंद्र",
};

const GK_DIR = path.join(process.cwd(), "data", "questions", "rajasthan-gk");
const SETS_FILE = path.join(process.cwd(), "data", "sets", "published-sets.json");

const CANONICAL_47_TO_FILE: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
  11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20,
  21: 23, // Integration -> topic_23.json
  22: 21, // Awakening & Journalism -> topic_21.json
  23: 24, // Personalities -> topic_24.json
  24: 26, 25: 27, 26: 28, 27: 29, 28: 30, 29: 31, 30: 32,
  31: 33, 32: 34, 33: 35, 34: 36, 35: 37, 36: 38, 37: 39, 38: 40,
  39: 41, 40: 42, 41: 43, 42: 44, 43: 45, 44: 46, 45: 47,
  46: 48, // Commissions -> topic_48.json
  47: 55, // Research Centers -> topic_55.json
};

function getTopicFilePath(topicNum: number): string {
  // Support both 47 canonical numbers and direct 55 file numbers
  const fileNum = CANONICAL_47_TO_FILE[topicNum] !== undefined ? CANONICAL_47_TO_FILE[topicNum] : topicNum;
  const pad = String(fileNum).padStart(2, "0");
  return path.join(GK_DIR, `topic_${pad}.json`);
}

function normalizeStem(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\u0900-\u097F\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSortSimilarity(s1: string, s2: string): number {
  const t1 = normalizeStem(s1).split(" ").sort().join(" ");
  const t2 = normalizeStem(s2).split(" ").sort().join(" ");
  if (t1 === t2) return 1.0;
  if (!t1 || !t2) return 0.0;
  
  const set1 = new Set(t1.split(" "));
  const set2 = new Set(t2.split(" "));
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

function getNextAvailableId(): string {
  let maxId = 0;
  if (!fs.existsSync(GK_DIR)) return "rg_000001";
  const files = fs.readdirSync(GK_DIR).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(GK_DIR, f), "utf-8"));
      for (const q of data.questions || []) {
        const idStr = String(q.id || "");
        if (idStr.startsWith("rg_")) {
          const num = parseInt(idStr.replace("rg_", ""), 10);
          if (!isNaN(num) && num > maxId) {
            maxId = num;
          }
        }
      }
    } catch {}
  }
  return `rg_${String(maxId + 1).padStart(6, "0")}`;
}

interface QuestionLoc {
  question: any;
  topicNum: number;
  index: number;
  topicData: any;
  filePath: string;
}

function findQuestion(qid: string): QuestionLoc | null {
  if (!fs.existsSync(GK_DIR)) return null;
  const files = fs.readdirSync(GK_DIR).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const p = path.join(GK_DIR, f);
    try {
      const data = JSON.parse(fs.readFileSync(p, "utf-8"));
      const questions: any[] = data.questions || [];
      const idx = questions.findIndex((q) => q.id === qid || q.canonicalId === qid);
      if (idx !== -1) {
        const m = f.match(/topic_(\d+)\.json/);
        const tnum = m ? parseInt(m[1], 10) : data.masterTopicId || 1;
        return {
          question: questions[idx],
          topicNum: tnum,
          index: idx,
          topicData: data,
          filePath: p,
        };
      }
    } catch {}
  }
  return null;
}

function isQuestionInPublishedSets(qid: string): { inSets: boolean; setNames: string[] } {
  if (!fs.existsSync(SETS_FILE)) return { inSets: false, setNames: [] };
  try {
    const sets = JSON.parse(fs.readFileSync(SETS_FILE, "utf-8"));
    const matched = sets.filter((s: any) => (s.questionIds || []).includes(qid));
    return {
      inSets: matched.length > 0,
      setNames: matched.map((s: any) => s.name),
    };
  } catch {
    return { inSets: false, setNames: [] };
  }
}

// ----------------------------------------------------------------------------
// COMMAND: stats
// ----------------------------------------------------------------------------
function cmdStats() {
  console.log("==================================================================");
  console.log("QUIZZER2 QUESTION POOL & TOPIC OVERVIEW (47 CONSOLIDATED TOPICS)");
  console.log("==================================================================");
  let totalQs = 0;
  let totalArchived = 0;
  for (let t = 1; t <= 47; t++) {
    const p = getTopicFilePath(t);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    const count = (data.questions || []).length;
    const archCount = (data.archivedVariants || []).length;
    totalQs += count;
    totalArchived += archCount;
    const name = GK_TOPIC_NAMES[t] || data.masterTopic || "Unknown";
    console.log(
      `Topic ${String(t).padStart(2, "0")} | ${name.slice(0, 40).padEnd(42, " ")} | ${String(count).padStart(5, " ")} Qs | ${String(archCount).padStart(3, " ")} Variants`
    );
  }
  console.log("------------------------------------------------------------------");
  console.log(`TOTAL ACTIVE QUESTIONS: ${totalQs} | ARCHIVED VARIANTS: ${totalArchived}`);
  console.log("==================================================================");
}

// ----------------------------------------------------------------------------
// COMMAND: add <file.json> <topicId> [--subtopic <name>]
// ----------------------------------------------------------------------------
function cmdAdd(filePath: string, topicNumStr: string, subTopicName?: string) {
  const topicNum = parseInt(topicNumStr, 10);
  if (isNaN(topicNum) || topicNum < 1 || topicNum > 47) {
    console.error(`Error: Invalid topic number ${topicNumStr}. Must be 1-47.`);
    process.exit(1);
  }

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`Error: File not found at ${absPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(absPath, "utf-8");
  let incomingList: any[] = [];
  try {
    const parsed = JSON.parse(raw);
    incomingList = Array.isArray(parsed) ? parsed : parsed.questions || [parsed];
  } catch (err) {
    console.error("Error: Invalid JSON format:", err);
    process.exit(1);
  }

  const targetFile = getTopicFilePath(topicNum);
  const targetData = JSON.parse(fs.readFileSync(targetFile, "utf-8"));
  const existingQuestions: any[] = targetData.questions || [];

  console.log(`\nImporting ${incomingList.length} questions into Topic ${topicNum} (${GK_TOPIC_NAMES[topicNum]})...`);

  let added = 0;
  let skippedDuplicates = 0;

  for (const item of incomingList) {
    const qText = item.question || item.questionText;
    if (!qText || !item.options || !item.answer) {
      console.warn("  [Skipped] Question missing text, options, or answer:", item);
      continue;
    }

    // Check for duplicate in existing pool
    let isDup = false;
    for (const ex of existingQuestions) {
      const sim = tokenSortSimilarity(qText, ex.question || ex.questionText || "");
      if (sim >= 0.88) {
        console.warn(`  [Duplicate Skipped] (${Math.round(sim * 100)}% match): "${qText.slice(0, 50)}..."`);
        isDup = true;
        skippedDuplicates++;
        break;
      }
    }
    if (isDup) continue;

    const newId = item.id || getNextAvailableId();
    const formatted: any = {
      id: newId,
      source: item.source || "ManualImport",
      masterTopicId: topicNum,
      masterTopic: GK_TOPIC_NAMES[topicNum],
      question: qText,
      options: item.options,
      answer: String(item.answer).toUpperCase(),
      explanation: item.explanation || "",
      topic: GK_TOPIC_NAMES[topicNum],
      topicId: topicNum,
      type: item.type || "mcq",
      meta: {
        ...(item.meta || {}),
        subTopic: subTopicName || item.meta?.subTopic || undefined,
        importedAt: new Date().toISOString(),
      },
    };

    existingQuestions.push(formatted);
    added++;
  }

  targetData.questions = existingQuestions;
  fs.writeFileSync(targetFile, JSON.stringify(targetData, null, 2), "utf-8");

  console.log(`\nSuccessfully added ${added} questions to Topic ${topicNum}!`);
  if (skippedDuplicates > 0) {
    console.log(`Skipped ${skippedDuplicates} duplicate questions.`);
  }
}

// ----------------------------------------------------------------------------
// COMMAND: reassign <qid> <fromTopic> <toTopic> [--subtopic <name>]
// ----------------------------------------------------------------------------
function cmdReassign(questionId: string, fromTopicStr: string, toTopicStr: string, subTopicName?: string) {
  const fromTopic = parseInt(fromTopicStr, 10);
  const toTopic = parseInt(toTopicStr, 10);

  const fromFile = getTopicFilePath(fromTopic);
  const toFile = getTopicFilePath(toTopic);

  if (!fs.existsSync(fromFile) || !fs.existsSync(toFile)) {
    console.error("Error: One or both topic files not found.");
    process.exit(1);
  }

  const fromData = JSON.parse(fs.readFileSync(fromFile, "utf-8"));
  const toData = JSON.parse(fs.readFileSync(toFile, "utf-8"));

  const qIdx = (fromData.questions || []).findIndex((q: any) => q.id === questionId);
  if (qIdx === -1) {
    console.error(`Error: Question ${questionId} not found in Topic ${fromTopic}!`);
    process.exit(1);
  }

  const [question] = fromData.questions.splice(qIdx, 1);
  question.masterTopicId = toTopic;
  question.masterTopic = GK_TOPIC_NAMES[toTopic];
  question.topicId = toTopic;
  question.topic = GK_TOPIC_NAMES[toTopic];
  if (subTopicName) {
    question.meta = question.meta || {};
    question.meta.subTopic = subTopicName;
  }

  toData.questions = toData.questions || [];
  toData.questions.push(question);

  fs.writeFileSync(fromFile, JSON.stringify(fromData, null, 2), "utf-8");
  fs.writeFileSync(toFile, JSON.stringify(toData, null, 2), "utf-8");

  console.log(`Successfully moved Question ${questionId} from Topic ${fromTopic} (${GK_TOPIC_NAMES[fromTopic]}) to Topic ${toTopic} (${GK_TOPIC_NAMES[toTopic]})!`);
}

// ----------------------------------------------------------------------------
// COMMAND: answer <qid> <newAnswer> [--note <reason>]
// ----------------------------------------------------------------------------
function cmdAnswer(questionId: string, newAns: string, note?: string) {
  const loc = findQuestion(questionId);
  if (!loc) {
    console.error(`Error: Question ${questionId} not found in any topic file!`);
    process.exit(1);
  }

  const cleanAns = newAns.trim().toUpperCase();
  if (!["A", "B", "C", "D"].includes(cleanAns)) {
    console.error(`Error: Answer must be A, B, C, or D. Got "${newAns}"`);
    process.exit(1);
  }

  const oldAns = loc.question.answer;
  loc.question.answer = cleanAns;
  if (!loc.question.meta) loc.question.meta = {};
  loc.question.meta.auditNote = `Answer key updated from ${oldAns} to ${cleanAns} on ${new Date().toISOString()}${note ? " — " + note : ""}`;

  fs.writeFileSync(loc.filePath, JSON.stringify(loc.topicData, null, 2), "utf-8");
  console.log(`Successfully updated Question ${questionId} answer key:`);
  console.log(`  Old Answer: ${oldAns} ➔ New Answer: ${cleanAns}`);
  if (note) console.log(`  Audit Note: ${note}`);
}

// ----------------------------------------------------------------------------
// COMMAND: delete <qid> [--archive]
// ----------------------------------------------------------------------------
function cmdDelete(questionId: string, archiveMode = true) {
  const loc = findQuestion(questionId);
  if (!loc) {
    console.error(`Error: Question ${questionId} not found in any topic file!`);
    process.exit(1);
  }

  const pubCheck = isQuestionInPublishedSets(questionId);
  if (pubCheck.inSets) {
    console.warn(`[WARNING] Question ${questionId} is currently used in ${pubCheck.setNames.length} published set(s):`);
    pubCheck.setNames.forEach((n) => console.warn(`  - ${n}`));
    console.warn("UI fallback card will be displayed for this question in past student attempts.");
  }

  const [removed] = loc.topicData.questions.splice(loc.index, 1);
  if (archiveMode) {
    if (!loc.topicData.archivedVariants) loc.topicData.archivedVariants = [];
    removed.meta = removed.meta || {};
    removed.meta.archivedAt = new Date().toISOString();
    removed.meta.archivedReason = "User manual removal / variant deduplication";
    loc.topicData.archivedVariants.push(removed);
    loc.topicData.totalArchivedVariants = loc.topicData.archivedVariants.length;
    console.log(`Archived Question ${questionId} into Topic ${loc.topicNum} archivedVariants.`);
  } else {
    console.log(`Permanently removed Question ${questionId} from Topic ${loc.topicNum}.`);
  }

  fs.writeFileSync(loc.filePath, JSON.stringify(loc.topicData, null, 2), "utf-8");
}

// ----------------------------------------------------------------------------
// COMMAND: dedup [topicId] [--auto-archive]
// ----------------------------------------------------------------------------
function cmdDedup(topicNumStr?: string, autoArchive = false) {
  const topicsToScan: number[] = topicNumStr
    ? [parseInt(topicNumStr, 10)]
    : Array.from({ length: 47 }, (_, i) => i + 1);

  console.log(`Scanning for duplicates across ${topicsToScan.length} topic(s) (Similarity threshold >= 88%)...\n`);

  let totalDups = 0;
  for (const t of topicsToScan) {
    const p = getTopicFilePath(t);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    const questions: any[] = data.questions || [];

    const dupsInTopic: Array<{ q1: any; q2: any; sim: number }> = [];
    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const sim = tokenSortSimilarity(questions[i].question || "", questions[j].question || "");
        if (sim >= 0.88) {
          dupsInTopic.push({ q1: questions[i], q2: questions[j], sim });
        }
      }
    }

    if (dupsInTopic.length > 0) {
      console.log(`Topic ${t} (${GK_TOPIC_NAMES[t]}): Found ${dupsInTopic.length} duplicate pair(s):`);
      for (const d of dupsInTopic) {
        console.log(`  - Match (${Math.round(d.sim * 100)}%): [${d.q1.id}] vs [${d.q2.id}]`);
        console.log(`    Q1: "${(d.q1.question || '').slice(0, 60)}..."`);
        console.log(`    Q2: "${(d.q2.question || '').slice(0, 60)}..."`);

        if (autoArchive) {
          // Archive the second question
          cmdDelete(d.q2.id, true);
        }
      }
      totalDups += dupsInTopic.length;
    }
  }

  console.log(`\nScan complete. Total duplicate pairs found: ${totalDups}`);
  if (!autoArchive && totalDups > 0) {
    console.log("Tip: Run `bun scripts/manage-questions.ts dedup <topicId> --auto-archive` to safely archive duplicate variants.");
  }
}

// ----------------------------------------------------------------------------
// CLI DISPATCHER
// ----------------------------------------------------------------------------
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "help") {
  console.log(`
Usage: bun scripts/manage-questions.ts <command> [arguments]

Commands:
  stats                                            Show complete pool statistics (47 topics)
  add <file.json> <topicId> [--subtopic <name>]    Add batch questions with duplicate check & auto-ID
  answer <qid> <newAnswer> [--note <reason>]       Correct answer key with official audit trail
  delete <qid> [--permanent]                       Safely archive (or delete) question from pool
  dedup [topicId] [--auto-archive]                 Detect duplicate questions (token similarity >= 88%)
  reassign <qid> <fromTopic> <toTopic> [--subtopic] Move a question to a different topic
`);
  process.exit(0);
}

if (command === "stats") {
  cmdStats();
} else if (command === "add") {
  const filePath = args[1];
  const topicId = args[2];
  const subIdx = args.indexOf("--subtopic");
  const subName = subIdx !== -1 && args[subIdx + 1] ? args[subIdx + 1] : undefined;
  if (!filePath || !topicId) {
    console.error("Error: Path and TopicId required. Example: bun scripts/manage-questions.ts add new_qs.json 16");
    process.exit(1);
  }
  cmdAdd(filePath, topicId, subName);
} else if (command === "answer") {
  const qid = args[1];
  const newAns = args[2];
  const noteIdx = args.indexOf("--note");
  const note = noteIdx !== -1 && args[noteIdx + 1] ? args[noteIdx + 1] : undefined;
  if (!qid || !newAns) {
    console.error("Error: Question ID and new answer required. Example: bun scripts/manage-questions.ts answer rg_009040 A --note \"Verified from Granth Academy\"");
    process.exit(1);
  }
  cmdAnswer(qid, newAns, note);
} else if (command === "delete") {
  const qid = args[1];
  const isPermanent = args.includes("--permanent");
  if (!qid) {
    console.error("Error: Question ID required. Example: bun scripts/manage-questions.ts delete rg_001025");
    process.exit(1);
  }
  cmdDelete(qid, !isPermanent);
} else if (command === "dedup") {
  const topicId = args[1] && !args[1].startsWith("--") ? args[1] : undefined;
  const autoArchive = args.includes("--auto-archive");
  cmdDedup(topicId, autoArchive);
} else if (command === "reassign") {
  const qid = args[1];
  const fromT = args[2];
  const toT = args[3];
  const subIdx = args.indexOf("--subtopic");
  const subName = subIdx !== -1 && args[subIdx + 1] ? args[subIdx + 1] : undefined;
  if (!qid || !fromT || !toT) {
    console.error("Error: Missing arguments. Example: bun scripts/manage-questions.ts reassign rg_001025 2 1");
    process.exit(1);
  }
  cmdReassign(qid, fromT, toT, subName);
} else {
  console.error(`Unknown command: ${command}. Run with 'help' for usage.`);
  process.exit(1);
}
