import fs from "fs";
import path from "path";

export function isStatementOptions(options?: Array<{ id: string; text: string } | string>): boolean {
  if (!options || options.length === 0) return false;
  const optTexts = options.map((o) => (typeof o === "string" ? o : o?.text || "").trim());
  return optTexts.some((text) =>
    /(?:सही|गलत|सत्य|असत्य|केवल|तथा|both|only|all\s+of|none\s+of|(?:^|\s)और(?:\s|$)|(?:^|\s)व(?:\s|$))/iu.test(
      text
    ) && !/[-–—:]\s*(?:[1-9]|I{1,3}|[ivxlc]+|[अ-द])/iu.test(text)
  );
}

export function hasCorruptedMatchMeta(meta?: any): boolean {
  if (!meta) return false;
  const left = Array.isArray(meta.left) ? meta.left : [];
  const right = Array.isArray(meta.right) ? meta.right : [];
  if (left.length === 0 && right.length === 0) return false;
  if (left.length < 2 || right.length < 2) return true;

  const validIdRegex = /^(?:[a-fA-F1-8]|[ivxlcIVXLC]{1,4}|[\u0905\u092c\u0938\u0926\u0915-\u0918\u0967-\u096f])$/;
  const hasInvalidLeftId = left.some((item: any) => !item.id || !validIdRegex.test(String(item.id).trim()));
  const hasInvalidRightId = right.some((item: any) => !item.id || !validIdRegex.test(String(item.id).trim()));

  const hasFragmentedText =
    left.some((item: any) => /₹\s*$/.test(item.text) || String(item.text).trim().length < 2) ||
    right.some((item: any) => String(item.text).trim().length < 2);

  return hasInvalidLeftId || hasInvalidRightId || hasFragmentedText;
}

export function cleanStatementQuestionText(raw: string): string {
  if (!raw) return raw;
  let text = raw.trim();

  // Strip trailing standard prompt footer
  let promptFooter = "";
  const footerMatch = text.match(
    /(?:नीचे\s*दिए\s*(?:हुए|गए)?\s*(?:कूटों|विकल्पों)?\s*से|उपर्युक्त\s*(?:कथनों|में\s*से)|निम्न\s*में\s*से\s*(?:सबसे\s*)?उपयुक्त)[\s\S]*$/iu
  );
  if (footerMatch) {
    promptFooter = footerMatch[0].trim();
    text = text.slice(0, footerMatch.index).trim();
  }

  // Ensure prompt header ends with colon or newline
  text = text.replace(/([:।?!])\s*([a-dA-D\u0905\u092c\u0938\u0926])[.)\-:]\s*/gu, "$1\n($2) ");
  text = text.replace(/([:।?!])\s*([1-4])[.)\-:]\s*/gu, "$1\n$2. ");

  // Break next statements onto their own lines
  text = text.replace(/\s+([b-dB-D\u092c\u0938\u0926])[.)\-:]\s*/gu, "\n($1) ");
  text = text.replace(/\s+([2-4])[.)\-:]\s*/gu, "\n$1. ");

  if (promptFooter) {
    text = `${text}\n\n${promptFooter}`;
  } else if (!text.includes("कथन") && !text.includes("विचार")) {
    text = `${text}\n\nउपर्युक्त में से कौन-से कथन सही हैं?`;
  }

  return text.trim();
}

async function run() {
  console.log("=== REPAIRING CORRUPTED MATCH / STATEMENT QUESTIONS ===");
  const cwd = process.cwd();

  // 1. Process published-sets.json
  const setsPath = path.join(cwd, "data", "master-pool", "published-sets.json");
  const sets = JSON.parse(fs.readFileSync(setsPath, "utf-8"));
  let setsFixedCount = 0;
  const repairedQuestions: any[] = [];

  for (const s of sets) {
    if (!Array.isArray(s.questions)) continue;
    for (const q of s.questions) {
      if (q.type === "match_following") {
        const raw = q.meta?.rawQuestionText || "";
        const isFake =
          isStatementOptions(q.options) ||
          hasCorruptedMatchMeta(q.meta) ||
          (/कथनों\s*पर\s*विचार|निम्नलिखित\s*पर\s*विचार|सही\s*कथनों\s*का\s*चयन/iu.test(raw) &&
            !/सूची\s*[-–—:]*\s*(?:1|I|A)|तालिका/iu.test(raw));

        if (isFake) {
          setsFixedCount++;
          const cleanText = raw ? cleanStatementQuestionText(raw) : q.questionText;

          q.type = "mcq";
          q.questionText = cleanText;
          q.question = cleanText;

          if (q.meta) {
            delete q.meta.left;
            delete q.meta.right;
            delete q.meta.leftTitle;
            delete q.meta.rightTitle;
          }

          repairedQuestions.push({
            id: q.canonicalId || q.id,
            setName: s.name,
            questionText: cleanText,
            options: q.options,
            answer: q.correctAnswer || q.answer,
            explanation: q.explanation,
            exam: q.meta?.exam || q.reference,
            year: q.meta?.year,
          });
        }
      }
    }
  }

  fs.writeFileSync(setsPath, JSON.stringify(sets, null, 2), "utf-8");
  console.log(`✓ published-sets.json: Fixed ${setsFixedCount} fake match questions.`);

  // 2. Process master-pool.json
  const poolPath = path.join(cwd, "data", "master-pool", "master-pool.json");
  if (fs.existsSync(poolPath)) {
    const pool = JSON.parse(fs.readFileSync(poolPath, "utf-8"));
    let poolFixedCount = 0;

    for (const q of pool) {
      if (q.type === "match_following") {
        const raw = q.meta?.rawQuestionText || "";
        const isFake =
          isStatementOptions(q.options) ||
          hasCorruptedMatchMeta(q.meta) ||
          (/कथनों\s*पर\s*विचार|निम्नलिखित\s*पर\s*विचार|सही\s*कथनों\s*का\s*चयन/iu.test(raw) &&
            !/सूची\s*[-–—:]*\s*(?:1|I|A)|तालिका/iu.test(raw));

        if (isFake) {
          poolFixedCount++;
          const cleanText = raw ? cleanStatementQuestionText(raw) : q.questionText || q.question;

          q.type = "mcq";
          q.questionText = cleanText;
          q.question = cleanText;

          if (q.meta) {
            delete q.meta.left;
            delete q.meta.right;
            delete q.meta.leftTitle;
            delete q.meta.rightTitle;
          }
        }
      }
    }

    fs.writeFileSync(poolPath, JSON.stringify(pool, null, 2), "utf-8");
    console.log(`✓ master-pool.json: Fixed ${poolFixedCount} questions.`);
  }

  // 3. Process data/ddd/topics/*.json
  const topicsDir = path.join(cwd, "data", "ddd", "topics");
  if (fs.existsSync(topicsDir)) {
    const topicFiles = fs.readdirSync(topicsDir).filter((f) => f.endsWith(".json"));
    let topicFixedTotal = 0;

    for (const tf of topicFiles) {
      const tp = path.join(topicsDir, tf);
      const data = JSON.parse(fs.readFileSync(tp, "utf-8"));
      let topicFixed = 0;

      if (Array.isArray(data.questions)) {
        for (const q of data.questions) {
          if (q.type === "match_following") {
            const raw = q.meta?.rawQuestionText || "";
            const isFake =
              isStatementOptions(q.options) ||
              hasCorruptedMatchMeta(q.meta) ||
              (/कथनों\s*पर\s*विचार|निम्नलिखित\s*पर\s*विचार|सही\s*कथनों\s*का\s*चयन/iu.test(raw) &&
                !/सूची\s*[-–—:]*\s*(?:1|I|A)|तालिका/iu.test(raw));

            if (isFake) {
              topicFixed++;
              const cleanText = raw ? cleanStatementQuestionText(raw) : q.questionText || q.question;
              q.type = "mcq";
              q.questionText = cleanText;
              q.question = cleanText;
              if (q.meta) {
                delete q.meta.left;
                delete q.meta.right;
                delete q.meta.leftTitle;
                delete q.meta.rightTitle;
              }
            }
          }
        }

        if (topicFixed > 0) {
          fs.writeFileSync(tp, JSON.stringify(data, null, 2), "utf-8");
          topicFixedTotal += topicFixed;
        }
      }
    }
    console.log(`✓ data/ddd/topics: Fixed ${topicFixedTotal} questions.`);
  }

  // 4. Save export file of all repaired questions
  const exportPath = path.join(cwd, "data", "repaired_statement_mcqs.json");
  fs.writeFileSync(exportPath, JSON.stringify(repairedQuestions, null, 2), "utf-8");
  console.log(`✓ Saved ${repairedQuestions.length} repaired questions to: ${exportPath}`);

  // Summary
  console.log("\n--- REPAIR COMPLETED SUCCESSFULLY ---");
  console.log(`Total questions reverted to clean MCQ: ${repairedQuestions.length}`);
}

run().catch(console.error);
