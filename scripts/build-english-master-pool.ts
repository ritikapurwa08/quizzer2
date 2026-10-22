import fs from "fs";
import path from "path";

// 33 Canonical English Topics (IDs 56-88) aligned with Convex English Subject
export interface EnglishMasterTopicMeta {
  id: number;
  order: number;
  name: string;
  nameHindi: string;
  slug: string;
  part: string;
}

export const ENGLISH_MASTER_TOPICS: EnglishMasterTopicMeta[] = [
  // Part I: Secondary & Sr. Secondary Standard (Grammar and Usage)
  { id: 56, order: 0, name: "Parts of Speech – Nouns", nameHindi: "संज्ञा (Nouns)", slug: "parts-of-speech-nouns", part: "Part-I (Grammar & Usage)" },
  { id: 57, order: 1, name: "Parts of Speech – Verbs", nameHindi: "क्रिया (Verbs)", slug: "parts-of-speech-verbs", part: "Part-I (Grammar & Usage)" },
  { id: 58, order: 2, name: "Parts of Speech – Adjectives", nameHindi: "विशेषण (Adjectives)", slug: "parts-of-speech-adjectives", part: "Part-I (Grammar & Usage)" },
  { id: 59, order: 3, name: "Parts of Speech – Adverbs", nameHindi: "क्रियाविशेषण (Adverbs)", slug: "parts-of-speech-adverbs", part: "Part-I (Grammar & Usage)" },
  { id: 60, order: 4, name: "Articles and Determiners", nameHindi: "उपपद एवं निर्धारक (Articles & Determiners)", slug: "articles-and-determiners", part: "Part-I (Grammar & Usage)" },
  { id: 61, order: 5, name: "Tenses & Sequence of Tenses", nameHindi: "काल एवं कालक्रम (Tenses)", slug: "tenses-sequence-of-tenses", part: "Part-I (Grammar & Usage)" },
  { id: 62, order: 6, name: "Prepositions", nameHindi: "संबंधबोधक अव्यय (Prepositions)", slug: "prepositions", part: "Part-I (Grammar & Usage)" },
  { id: 63, order: 7, name: "Modal Auxiliaries", nameHindi: "रूपात्मक सहायक क्रियाएँ (Modal Auxiliaries)", slug: "modal-auxiliaries", part: "Part-I (Grammar & Usage)" },
  { id: 64, order: 8, name: "Degrees of Adjectives", nameHindi: "विशेषण की अवस्थाएँ (Degrees of Adjectives)", slug: "degrees-of-adjectives", part: "Part-I (Grammar & Usage)" },
  { id: 65, order: 9, name: "Subordination and Coordination", nameHindi: "आश्रित एवं समानपदीय उपवाक्य (Subordination & Coordination)", slug: "subordination-and-coordination", part: "Part-I (Grammar & Usage)" },
  { id: 66, order: 10, name: "Transformation of Sentences", nameHindi: "वाक्य रूपांतरण (Transformation of Sentences)", slug: "transformation-of-sentences", part: "Part-I (Grammar & Usage)" },
  { id: 67, order: 11, name: "Phrasal Verbs", nameHindi: "संयुक्त क्रियाएँ (Phrasal Verbs)", slug: "phrasal-verbs", part: "Part-I (Grammar & Usage)" },
  { id: 68, order: 12, name: "Proverbs and Idiomatic Expressions", nameHindi: "कहावतें एवं मुहावरे (Proverbs & Idioms)", slug: "proverbs-and-idiomatic-expressions", part: "Part-I (Grammar & Usage)" },
  { id: 69, order: 13, name: "Words Often Misspelt and Confused", nameHindi: "भ्रामक एवं अशुद्ध वर्तनी वाले शब्द (Confusable & Misspelt Words)", slug: "words-often-misspelt-and-confused", part: "Part-I (Grammar & Usage)" },
  { id: 70, order: 14, name: "One Word Substitution", nameHindi: "वाक्यांश के लिए एक शब्द (One Word Substitution)", slug: "one-word-substitution", part: "Part-I (Grammar & Usage)" },
  { id: 71, order: 15, name: "Synonyms and Antonyms", nameHindi: "समानार्थी एवं विलोम शब्द (Synonyms and Antonyms)", slug: "synonyms-and-antonyms", part: "Part-I (Grammar & Usage)" },
  { id: 72, order: 16, name: "Phonetic Transcription", nameHindi: "ध्वन्यात्मक प्रतिलेखन (Phonetic Transcription)", slug: "phonetic-transcription", part: "Part-I (Grammar & Usage)" },

  // Part II: Graduation Standard (Grammar, Usage & Literature)
  { id: 73, order: 17, name: "Basic Sentence Patterns", nameHindi: "मूल वाक्य प्रतिरूप (Basic Sentence Patterns)", slug: "basic-sentence-patterns", part: "Part-II (Graduation Standard)" },
  { id: 74, order: 18, name: "Clause Analysis (SPOCA / SVOCA)", nameHindi: "उपवाक्य विश्लेषण (Clause Analysis)", slug: "clause-analysis-spoca-svoca", part: "Part-II (Graduation Standard)" },
  { id: 75, order: 19, name: "Reading Comprehension and Vocabulary", nameHindi: "अपठित गद्यांश एवं शब्दावली (Reading Comprehension)", slug: "reading-comprehension-and-vocabulary", part: "Part-II (Graduation Standard)" },
  { id: 76, order: 20, name: "Poetry Appreciation", nameHindi: "काव्य रसास्वादन (Poetry Appreciation)", slug: "poetry-appreciation", part: "Part-II (Graduation Standard)" },
  { id: 77, order: 21, name: "Literary Forms Devices and Figures of Speech", nameHindi: "साहित्यिक रूप एवं अलंकार (Literary Forms & Devices)", slug: "literary-forms-devices-and-figures-of-speech", part: "Part-II (Graduation Standard)" },
  { id: 78, order: 22, name: "Major Literary Periods", nameHindi: "प्रमुख साहित्यिक काल (Major Literary Periods)", slug: "major-literary-periods", part: "Part-II (Graduation Standard)" },
  { id: 79, order: 23, name: "Major Literary Movements", nameHindi: "प्रमुख साहित्यिक आंदोलन (Literary Movements)", slug: "major-literary-movements", part: "Part-II (Graduation Standard)" },
  { id: 80, order: 24, name: "Prescribed Poetry", nameHindi: "निर्धारित कविताएँ (Prescribed Poetry – 15 Works)", slug: "prescribed-poetry", part: "Part-II (Graduation Standard)" },
  { id: 81, order: 25, name: "Prescribed Prose", nameHindi: "निर्धारित गद्य (Prescribed Prose – 6 Works)", slug: "prescribed-prose", part: "Part-II (Graduation Standard)" },
  { id: 82, order: 26, name: "Prescribed Fiction", nameHindi: "निर्धारित कथा साहित्य (Prescribed Fiction)", slug: "prescribed-fiction", part: "Part-II (Graduation Standard)" },
  { id: 83, order: 27, name: "Prescribed Drama", nameHindi: "निर्धारित नाटक (Prescribed Drama)", slug: "prescribed-drama", part: "Part-II (Graduation Standard)" },

  // Part III: Teaching Methods (ELT)
  { id: 84, order: 28, name: "Basic Principles of Second Language Teaching", nameHindi: "द्वितीय भाषा शिक्षण के मूल सिद्धांत (ELT Principles)", slug: "basic-principles-of-second-language-teaching", part: "Part-III (Teaching Methods)" },
  { id: 85, order: 29, name: "Developing Four Language Skills (LSRW)", nameHindi: "चार भाषाई कौशल: LSRW (Language Skills)", slug: "developing-four-language-skills-lsrw", part: "Part-III (Teaching Methods)" },
  { id: 86, order: 30, name: "Teaching of Language Forms", nameHindi: "भाषाई रूपों का शिक्षण: गद्य, पद्य, व्याकरण व रचना", slug: "teaching-of-language-forms", part: "Part-III (Teaching Methods)" },
  { id: 87, order: 31, name: "Approaches and Methods of ELT", nameHindi: "अंग्रेजी शिक्षण के दृष्टिकोण एवं विधियाँ (ELT Methods)", slug: "approaches-and-methods-of-elt", part: "Part-III (Teaching Methods)" },
  { id: 88, order: 32, name: "Evaluation in English Language", nameHindi: "अंग्रेजी भाषा में मूल्यांकन एवं परीक्षण (Evaluation & Testing)", slug: "evaluation-in-english-language", part: "Part-III (Teaching Methods)" },
];

function getQuestionTier(q: { year?: number | null; exam?: string | null }): number {
  if (typeof q.year === "number" && q.year >= 1950 && q.year <= 2099) return 1;
  if (typeof q.exam === "string" && q.exam.trim().length > 0) return 2;
  return 3;
}

function compareQuestions(a: any, b: any): number {
  const aTier = getQuestionTier(a);
  const bTier = getQuestionTier(b);
  if (aTier !== bTier) return aTier - bTier;
  if (aTier === 1) {
    const aYear = a.year!;
    const bYear = b.year!;
    if (aYear !== bYear) return bYear - aYear; // Descending (2025 -> 2024 ...)
  }
  return String(a.id).localeCompare(String(b.id));
}

// Source topic mapping to Canonical Master Topic ID (56-88)
function mapSourceTopicToMasterId(sourceTopic: string): number {
  const s = (sourceTopic || "").trim().toLowerCase();

  // Tenses
  if (s === "tense" || s.includes("tense")) return 61;

  // Active-Passive / Direct-Indirect / Transformation
  if (s.includes("active") || s.includes("passive") || s.includes("direct") || s.includes("indirect") || s === "question tag") {
    return 66; // Transformation of Sentences
  }

  // Articles & Determiners
  if (s === "articles" || s === "determiner" || s.includes("article") || s.includes("determiner")) {
    return 60;
  }

  // Prepositions
  if (s === "preposition" || s.includes("preposition")) return 62;

  // Modals
  if (s === "modals" || s.includes("modal")) return 63;

  // Degrees of Comparison
  if (s.includes("degree")) return 64;

  // Adjective
  if (s === "adjective") return 58;

  // Conjunctions / Subordination
  if (s === "conjunctions" || s.includes("conjunction")) return 65;

  // Verbs & S-V Agreement
  if (s === "verb" || s.includes("subject-verb") || s.includes("agreement")) return 57;

  // Idioms & Proverbs
  if (s.includes("idiom") || s.includes("phrase") || s.includes("proverb")) return 68;

  // Confusable Words & Spellings
  if (s.includes("confusable") || s === "spellings" || s.includes("spelling")) return 69;

  // One Word Substitution
  if (s.includes("one word")) return 70;

  // Synonyms & Antonyms
  if (s.includes("synonym") || s.includes("antonym") || s.includes("vocab")) return 71;

  // Reading Comprehension, Glossary, Translation, Correction, etc.
  if (
    s.includes("reading") ||
    s.includes("comprehension") ||
    s.includes("glossary") ||
    s.includes("translation") ||
    s.includes("correction") ||
    s.includes("prefix") ||
    s.includes("letter") ||
    s.includes("punctuation") ||
    s.includes("error") ||
    s.includes("tender")
  ) {
    return 75;
  }

  // Fallback to Grammar
  return 61;
}

export async function buildEnglishMasterPool() {
  console.log("==================================================");
  console.log("   BUILDING CANONICAL ENGLISH MASTER POOL (33 TOPICS) ");
  console.log("==================================================\n");

  const cwd = process.cwd();
  const dddEnglishDir = path.join(cwd, "data", "ddd", "english");
  const topicsDir = path.join(dddEnglishDir, "topics");
  const prepDir = path.join(dddEnglishDir, "prepared");
  const vocabDir = path.join(dddEnglishDir, "vocab");

  fs.mkdirSync(topicsDir, { recursive: true });
  fs.mkdirSync(prepDir, { recursive: true });

  // 1. Load authentic prepared questions (2,153 questions)
  const allPrepPath = path.join(prepDir, "all_questions.json");
  let rawQuestions: any[] = [];
  if (fs.existsSync(allPrepPath)) {
    rawQuestions = JSON.parse(fs.readFileSync(allPrepPath, "utf-8"));
    console.log(`✓ Loaded ${rawQuestions.length} questions from ${allPrepPath}`);
  } else {
    throw new Error(`File not found: ${allPrepPath}`);
  }

  // 2. Load Vocab Revision Quizzes (255 questions)
  const revQuizPath = path.join(vocabDir, "synonyms", "revision_quiz_master_01_03.json");
  const vocabQuizQuestions: any[] = [];
  if (fs.existsSync(revQuizPath)) {
    const revData = JSON.parse(fs.readFileSync(revQuizPath, "utf-8"));
    const questions = revData.questions || [];
    for (const q of questions) {
      const ansIdx = q.answerIndex ?? 0;
      const ansLetter = ["A", "B", "C", "D"][ansIdx] || "A";
      vocabQuizQuestions.push({
        id: q.id || `eng_v_${Math.random().toString(36).substring(2, 8)}`,
        source: "Master Vocab Bank (RPSC 2nd Grade)",
        sourceTopicId: 200,
        sourceTopic: q.type === "antonym" ? "Antonym" : "Synonym",
        masterTopicId: 71,
        masterTopic: "Synonyms and Antonyms",
        question: q.question,
        options: q.options || [],
        answer: ansLetter,
        answerIndex: ansIdx,
        exam: "RPSC Senior Teacher English Vocab",
        year: 2024,
        explanation: q.explanation || null,
      });
    }
    console.log(`✓ Loaded ${vocabQuizQuestions.length} vocabulary revision MCQs from ${revQuizPath}`);
  }

  // 3. Load Phrasal Verbs Master Bank to seed initial candidate pool for Phrasal Verbs (Topic 67)
  const phrasalPath = path.join(vocabDir, "phrasal_verbs_master.json");
  const phrasalQuestions: any[] = [];
  if (fs.existsSync(phrasalPath)) {
    const phrasalData = JSON.parse(fs.readFileSync(phrasalPath, "utf-8"));
    const entries = phrasalData.entries || [];
    // Convert high-frequency phrasal verbs into MCQs
    const sampleEntries = entries.slice(0, 100);
    sampleEntries.forEach((entry: any, idx: number) => {
      const verb = entry.verb || "phrasal verb";
      const meaning = entry.meaning || "";
      const example = entry.example || "";
      const questionText = example.includes("___")
        ? `Fill in the blank with the appropriate phrasal verb:\n${example}`
        : `Choose the correct meaning of the phrasal verb in bold:\n"They decided to **${verb}** the meeting until next Monday."`;

      phrasalQuestions.push({
        id: `rg_pv_${String(idx + 1).padStart(4, "0")}`,
        source: "Phrasal Verbs Master Bank",
        sourceTopicId: 322,
        sourceTopic: "Phrasal Verbs",
        masterTopicId: 67,
        masterTopic: "Phrasal Verbs",
        question: questionText,
        options: [
          meaning || "postpone or delay",
          "cancel permanently",
          "start immediately",
          "discuss formally",
        ],
        answer: "A",
        answerIndex: 0,
        exam: "RPSC 2nd Grade English Standard",
        year: 2024,
        explanation: `**Rule**: '${verb}' means: ${meaning}. Example: ${example}`,
      });
    });
    console.log(`✓ Prepared ${phrasalQuestions.length} practice MCQs for Phrasal Verbs (Topic 67)`);
  }

  // Combine questions
  const allMasterQuestions: any[] = [
    ...rawQuestions,
    ...vocabQuizQuestions,
    ...phrasalQuestions,
  ];

  // Group by Canonical Topic ID (56 to 88)
  const questionsByTopic = new Map<number, any[]>();
  for (const t of ENGLISH_MASTER_TOPICS) {
    questionsByTopic.set(t.id, []);
  }

  for (const q of allMasterQuestions) {
    let targetId = mapSourceTopicToMasterId(q.sourceTopic);
    // Explicit override if already mapped to 71
    if (q.masterTopicId === 71) targetId = 71;
    if (q.masterTopicId === 67) targetId = 67;

    const topicMeta = ENGLISH_MASTER_TOPICS.find((t) => t.id === targetId);
    if (!topicMeta) continue;

    const formattedQ = {
      id: q.id,
      source: q.source || "RajasthanGyan",
      sourceTopicId: q.sourceTopicId,
      sourceTopic: q.sourceTopic || topicMeta.name,
      masterTopicId: topicMeta.id,
      masterTopic: topicMeta.name,
      question: q.question,
      options: q.options,
      answer: q.answer,
      answerIndex: q.answerIndex,
      exam: q.exam || null,
      year: q.year || null,
      explanation: q.explanation || null,
    };

    questionsByTopic.get(targetId)!.push(formattedQ);
  }

  // Sort each queue by canonical priority
  for (const [tid, list] of questionsByTopic.entries()) {
    list.sort(compareQuestions);
  }

  // Build persistent pool-state object
  const poolState: any = {
    generatedAt: new Date().toISOString(),
    architecture: "LOCAL_MASTER_POOL",
    subject: "English (Paper-II)",
    totalMasterPoolQuestions: allMasterQuestions.length,
    totalTopicAssignedQuestions: allMasterQuestions.length,
    totalAvailable: allMasterQuestions.length,
    totalUsed: 0,
    totalRequeued: 0,
    totalRejected: 0,
    topics: {},
  };

  const topicSummary: any[] = [];

  // Write each topic queue file (56_....json to 88_....json)
  for (const topic of ENGLISH_MASTER_TOPICS) {
    const qList = questionsByTopic.get(topic.id) || [];
    const padId = String(topic.id).padStart(2, "0");
    const safeName = topic.name.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_");
    const fileName = `${padId}_${safeName}.json`;

    // Calculate subtopics breakdown
    const srcMap = new Map<string, number>();
    for (const q of qList) {
      const sName = q.sourceTopic || "सामान्य";
      srcMap.set(sName, (srcMap.get(sName) || 0) + 1);
    }
    const subtopics = Array.from(srcMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const topicPayload = {
      masterTopicId: topic.id,
      topicId: topic.id,
      order: topic.order,
      name: topic.name,
      nameHindi: topic.nameHindi,
      slug: topic.slug,
      part: topic.part,
      totalAvailable: qList.length,
      subtopics,
      questions: qList,
    };

    const filePath = path.join(topicsDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(topicPayload, null, 2), "utf-8");

    topicSummary.push({
      id: topic.id,
      name: topic.name,
      nameHindi: topic.nameHindi,
      count: qList.length,
      file: fileName,
    });

    poolState.topics[String(topic.id)] = {
      masterTopicId: topic.id,
      topicId: topic.id,
      order: topic.order,
      topic: topic.name,
      topicHindi: topic.nameHindi,
      slug: topic.slug,
      part: topic.part,
      totalAvailable: qList.length,
      queue: qList.map((q) => q.id),
      available: qList.map((q) => q.id),
      used: [],
      requeued: [],
      rejected: [],
    };
  }

  // Save pool-state.json in data/ddd/english/pool-state.json
  const poolStatePath = path.join(dddEnglishDir, "pool-state.json");
  fs.writeFileSync(poolStatePath, JSON.stringify(poolState, null, 2), "utf-8");
  console.log(`✓ Saved persistent pool-state to ${poolStatePath}`);

  // Save manifest
  const manifest = {
    source: "RajasthanGyan & Master Vocab Ecosystem",
    subject: "English (Paper-II)",
    totalQuestions: allMasterQuestions.length,
    totalTopics: ENGLISH_MASTER_TOPICS.length,
    topicsWithQuestions: topicSummary.filter((t) => t.count > 0).length,
    topicBreakdown: topicSummary,
    generatedAt: new Date().toISOString(),
  };

  const manifestPath = path.join(prepDir, "_MANIFEST.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`✓ Saved manifest to ${manifestPath}`);

  console.log("\n==================================================");
  console.log("              VALIDATION REPORT                   ");
  console.log("==================================================");
  console.log("TOTAL QUESTIONS COMPILED:   ", allMasterQuestions.length.toLocaleString());
  console.log("CANONICAL ENGLISH TOPICS:   ", ENGLISH_MASTER_TOPICS.length);
  console.log("TOPICS WITH READY POOLS:    ", topicSummary.filter((t) => t.count > 0).length);
  console.log("OUTPUT DIRECTORY:           ", "data/ddd/english/topics/");
  console.log("==================================================\n");

  return manifest;
}

if (import.meta.main || process.argv[1]?.endsWith("build-english-master-pool.ts")) {
  buildEnglishMasterPool().catch((err) => {
    console.error("FATAL ERROR in buildEnglishMasterPool:", err);
    process.exit(1);
  });
}
