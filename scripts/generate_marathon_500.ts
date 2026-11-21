import fs from "fs";
import path from "path";

// 1. Read keys
const env = fs.readFileSync(".env.local", "utf8");
let groqKeys: string[] = [];
for (const line of env.split("\n")) {
  if (line.startsWith("GROQ_API_KEYS=")) {
    groqKeys = line
      .split("=")[1]
      .trim()
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }
}

let keyIdx = 0;
function getNextKey(): string {
  const key = groqKeys[keyIdx % groqKeys.length];
  keyIdx++;
  return key;
}

// 2. Parse Raw text into 25 batches, each with exactly 20 question blocks
const rawContent = fs.readFileSync("scripts/raw_500_questions.txt", "utf8");
const rawLines = rawContent
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);

interface RawBatch {
  batchNum: number;
  header: string;
  topic: string;
  questionBlocks: string[][];
}

function extractTopic(header: string, num: number): string {
  const match = header.match(/\((.*?)\)/);
  if (match) return match[1].replace(/—.*$/, "").trim();
  const topicMap: Record<number, string> = {
    1: "Tenses",
    2: "Past Tenses & Conditionals",
    3: "Voice & Sentence Types",
    4: "Passive Voice & Narration",
    5: "Direct & Indirect Speech",
    6: "Indirect Speech & Modals",
    7: "Indirect Speech Rules",
    8: "Indirect Speech & Error Correction",
    9: "Sentence Correction",
    10: "Articles",
    11: "Articles & Determiners",
    12: "Determiners",
    13: "Prepositions",
    14: "Prepositions & Translation",
    15: "Hindi-English Translation",
    16: "Translation & Official Letters",
    17: "Official Letters & Layout Rules",
    18: "Correspondence, Reading Comprehension & Glossary",
    19: "Administrative Glossary",
    20: "Administrative & Legal Glossary",
    21: "Glossary, Reading Comprehension & One-Word Substitution",
    22: "One-Word Substitution",
    23: "One-Word Substitution & Synonyms",
    24: "Synonyms & Reading Comprehension",
    25: "Antonyms",
  };
  return topicMap[num] || `Batch ${num}`;
}

const batches: RawBatch[] = [];
let curBatchHeader = "";
let curBatchLines: string[] = [];
let batchCounter = 0;

function splitIntoBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const l of lines) {
    const isSubLine =
      l.startsWith("Answer:") ||
      /^[A-D]\.\s/.test(l) ||
      l.startsWith("Rule applied:") ||
      l.startsWith("(Plus Q.");

    if (!isSubLine && currentBlock.length > 0) {
      blocks.push(currentBlock);
      currentBlock = [l];
    } else {
      currentBlock.push(l);
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);
  return blocks;
}

for (let i = 0; i < rawLines.length; i++) {
  const line = rawLines[i];
  if (line.startsWith("Batch ") || (line.includes("Batch") && line.includes("Questions "))) {
    if (curBatchLines.length > 0 && curBatchHeader) {
      batchCounter++;
      batches.push({
        batchNum: batchCounter,
        header: curBatchHeader,
        topic: extractTopic(curBatchHeader, batchCounter),
        questionBlocks: splitIntoBlocks(curBatchLines),
      });
    }
    curBatchHeader = line;
    curBatchLines = [];
    continue;
  }
  if (line.startsWith("All 500 questions")) continue;
  curBatchLines.push(line);
}

if (curBatchLines.length > 0 && curBatchHeader) {
  batchCounter++;
  batches.push({
    batchNum: batchCounter,
    header: curBatchHeader,
    topic: extractTopic(curBatchHeader, batchCounter),
    questionBlocks: splitIntoBlocks(curBatchLines),
  });
}

console.log(`Parsed ${batches.length} batches from raw file.`);
batches.forEach((b) => {
  if (b.questionBlocks.length !== 20) {
    console.warn(`Warning: Batch ${b.batchNum} has ${b.questionBlocks.length} blocks!`);
  }
});

// Output setup
const outputDir = path.join(process.cwd(), "data", "questions", "english", "marathon_sets");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

interface QuestionOutput {
  id: string;
  setNumber: number;
  questionNumber: number;
  topic: string;
  question: string;
  options: string[];
  answer: string;
  answerIndex: number;
}

interface SetOutput {
  setId: string;
  setNumber: number;
  title: string;
  topic: string;
  questionCount: number;
  questions: QuestionOutput[];
}

async function convertChunk(
  blocks: string[][],
  batchNum: number,
  startIndex: number,
  topic: string,
  attempt = 1
): Promise<QuestionOutput[]> {
  const chunkText = blocks.map((b, i) => `[Item ${startIndex + i + 1}]\n${b.join("\n")}`).join("\n\n");

  const prompt = `You are an expert English examiner for Rajasthan CET / RPSC examinations.
Convert each of the following ${blocks.length} items into a high quality Multiple Choice Question with 4 options (A, B, C, D).

CRITICAL RULES:
1. You MUST return EXACTLY ${blocks.length} questions in the array.
2. Clean the question text: remove timestamps like [03:37], remove inline answers.
3. For each question, provide 4 options. ONE option MUST be the exact correct answer specified in the input text.
4. The other 3 options MUST be plausible, grammatical, exam-standard distractors. If the input contains notes listing alternatives (e.g. "Note: Approval = अनुमोदन; Assent = सहमति"), use those.
5. For "Match the following", options should be matching combinations like "A-1, B-2, C-3, D-4" or clear matching strings.
6. Distribute the correct answer naturally across positions A (0), B (1), C (2), D (3). Do NOT always make A the answer.
7. Set "answer" to "A", "B", "C", or "D" and "answerIndex" to 0, 1, 2, or 3 corresponding to which option holds the correct answer.
8. NO explanation field.
9. Return a JSON object with:
{
  "questions": [
    {
      "questionNumber": ${startIndex + 1},
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "B",
      "answerIndex": 1
    }
  ]
}

ITEMS TO CONVERT:
${chunkText}`;

  const key = getNextKey();

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 850,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Groq error on batch ${batchNum} chunk ${startIndex} (status ${res.status}): ${errText}`);
      if (attempt <= 5) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        return convertChunk(blocks, batchNum, startIndex, topic, attempt + 1);
      }
      throw new Error(`Failed batch ${batchNum} chunk ${startIndex}`);
    }

    const data = await res.json();
    const rawJson = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawJson);
    const questions: any[] = parsed.questions || parsed.data || (Array.isArray(parsed) ? parsed : []);

    if (!Array.isArray(questions) || questions.length !== blocks.length) {
      console.warn(`Batch ${batchNum} chunk ${startIndex}: expected ${blocks.length} but got ${questions?.length}. Retrying...`);
      if (attempt <= 3) {
        await new Promise((r) => setTimeout(r, 2000));
        return convertChunk(blocks, batchNum, startIndex, topic, attempt + 1);
      }
    }

    return questions.slice(0, blocks.length).map((q, idx) => {
      const localQNum = startIndex + idx + 1;
      const globalQNum = (batchNum - 1) * 20 + localQNum;
      const id = `eng_m500_${String(globalQNum).padStart(3, "0")}`;
      const options = Array.isArray(q.options) ? q.options.map((o: any) => String(o).trim()) : [];
      while (options.length < 4) options.push(`Option ${options.length + 1}`);
      const validOptions = options.slice(0, 4);

      let answer = (q.answer || "A").toUpperCase().trim();
      if (!["A", "B", "C", "D"].includes(answer)) answer = "A";
      const answerIndex = ["A", "B", "C", "D"].indexOf(answer);

      return {
        id,
        setNumber: batchNum,
        questionNumber: localQNum,
        topic,
        question: String(q.question || "").trim(),
        options: validOptions,
        answer,
        answerIndex,
      };
    });
  } catch (err: any) {
    console.error(`Error in batch ${batchNum} chunk ${startIndex}:`, err.message);
    if (attempt <= 3) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      return convertChunk(blocks, batchNum, startIndex, topic, attempt + 1);
    }
    throw err;
  }
}

async function run() {
  const allSets: SetOutput[] = [];
  const masterQuestions: QuestionOutput[] = [];

  for (const batch of batches) {
    const setFileName = `set_${String(batch.batchNum).padStart(2, "0")}.json`;
    const setFilePath = path.join(outputDir, setFileName);

    // If already generated and valid, load it
    if (fs.existsSync(setFilePath)) {
      try {
        const existing: SetOutput = JSON.parse(fs.readFileSync(setFilePath, "utf8"));
        if (existing.questions && existing.questions.length === 20) {
          console.log(`Set ${batch.batchNum} already exists with 20 questions. Skipping...`);
          allSets.push(existing);
          masterQuestions.push(...existing.questions);
          continue;
        }
      } catch {}
    }

    console.log(`Generating Set ${batch.batchNum} / 25 (${batch.topic})...`);

    // Chunk into 4 slices of 5 questions each
    const fullQuestions: QuestionOutput[] = [];
    const chunkSize = 5;
    for (let c = 0; c < batch.questionBlocks.length; c += chunkSize) {
      const slice = batch.questionBlocks.slice(c, c + chunkSize);
      const res = await convertChunk(slice, batch.batchNum, c, batch.topic);
      fullQuestions.push(...res);
      await new Promise((r) => setTimeout(r, 500));
    }

    const setObj: SetOutput = {
      setId: `marathon-set-${String(batch.batchNum).padStart(2, "0")}`,
      setNumber: batch.batchNum,
      title: `Set ${String(batch.batchNum).padStart(2, "0")} — ${batch.topic}`,
      topic: batch.topic,
      questionCount: fullQuestions.length,
      questions: fullQuestions,
    };

    fs.writeFileSync(setFilePath, JSON.stringify(setObj, null, 2), "utf8");
    console.log(`  -> Saved ${setFileName} with ${fullQuestions.length} questions.`);

    allSets.push(setObj);
    masterQuestions.push(...fullQuestions);

    await new Promise((r) => setTimeout(r, 800));
  }

  // Save the master combined file
  const masterFile = path.join(
    process.cwd(),
    "data",
    "questions",
    "english",
    "marathon_500_questions.json"
  );
  const masterObj = {
    title: "CET 2026 English Marathon 500 Questions",
    totalSets: allSets.length,
    totalQuestions: masterQuestions.length,
    createdAt: new Date().toISOString(),
    sets: allSets,
  };

  fs.writeFileSync(masterFile, JSON.stringify(masterObj, null, 2), "utf8");
  console.log(`\n========================================`);
  console.log(`ALL 25 SETS SUCCESSFULLY GENERATED!`);
  console.log(`- 25 Set JSON files in: ${outputDir}`);
  console.log(`- Master combined JSON in: ${masterFile}`);
  console.log(`Total questions: ${masterQuestions.length}`);
  console.log(`========================================\n`);
}

run();
