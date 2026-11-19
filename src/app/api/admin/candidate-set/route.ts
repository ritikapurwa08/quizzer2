import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";
import { DATA_PATHS } from "@/lib/dataPaths";
import { comparePoolQuestions } from "@/lib/pool/sortQuestions";
import { hasConvexBackup, getBackupExistingQuestionIds } from "@/lib/convex-backup";
import { healOptionText } from "@/lib/optionTextHealer";
import {
  matchesSubTopic,
  matchesSubTopicSetName,
  calculateSubTopicNextPart,
  filterQuestionsBySubTopic,
} from "@/lib/pool/subTopicMatcher";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicIdParam = searchParams.get("masterTopicId") || searchParams.get("topicId");
    const setNumberParam = searchParams.get("setNumber") || searchParams.get("set");
    const batchSizeParam = searchParams.get("batchSize") || searchParams.get("count");
    const subTopicIdParam = searchParams.get("subTopicId") || searchParams.get("subTopic") || "";
    const requestedBatchSize = batchSizeParam ? parseInt(batchSizeParam, 10) : 20;
    // Strict safety clamp: Max 40 questions (2 sets) to completely prevent AI hallucinations
    const batchSize = isNaN(requestedBatchSize) || requestedBatchSize < 20 ? 20 : Math.min(requestedBatchSize, 40);

    if (!topicIdParam) {
      return NextResponse.json(
        { success: false, message: "Missing masterTopicId parameter" },
        { status: 400 }
      );
    }

    const masterTopicId = parseInt(topicIdParam, 10);
    if (isNaN(masterTopicId) || masterTopicId < 1 || masterTopicId > MASTER_TOPICS_LIST.length) {
      return NextResponse.json(
        { success: false, message: `Invalid masterTopicId (must be 1-${MASTER_TOPICS_LIST.length})` },
        { status: 400 }
      );
    }

    const topicInfo = MASTER_TOPICS_LIST.find((mt) => mt.id === masterTopicId);
    const padTopic = String(masterTopicId).padStart(2, "0");

    // 1. Authoritative sync: Read all active published sets & questions from published-sets.json
    const publishedPath = DATA_PATHS.publishedSets;
    const usedSet = new Set<string>();
    let existingTopicSets: any[] = [];

    if (fs.existsSync(publishedPath)) {
      try {
        const pubSets = JSON.parse(fs.readFileSync(publishedPath, "utf-8"));
        const mapPath = DATA_PATHS.topicIdMapping;
        let topicConvexId: string | null = null;
        if (fs.existsSync(mapPath)) {
          try {
            const mapping = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
            topicConvexId = mapping[String(masterTopicId)] || null;
          } catch {}
        }

        for (const s of pubSets) {
          if (s.status === "archived" || s.isArchived) continue;
          if (s.masterTopicId === masterTopicId || (topicConvexId && s.topicId === topicConvexId)) {
            existingTopicSets.push(s);
          }
          if (Array.isArray(s.questionIds)) {
            for (const qid of s.questionIds) {
              usedSet.add(String(qid));
            }
          }
        }
      } catch (err) {
        console.error("Error reading published sets for candidate-set:", err);
      }
    }

    const activeSubTopic =
      subTopicIdParam && subTopicIdParam !== "all"
        ? topicInfo?.subTopics?.find((s) => s.id === subTopicIdParam || s.name === subTopicIdParam) || {
            id: subTopicIdParam,
            name: subTopicIdParam,
          }
        : null;

    const subNextCalculatedSetNumber = activeSubTopic
      ? calculateSubTopicNextPart(existingTopicSets, activeSubTopic.id, activeSubTopic.name)
      : existingTopicSets.length + 1;

    const requestedSetNumber = setNumberParam ? parseInt(setNumberParam, 10) : 0;
    // If setNumberParam is missing or 1 while sets already exist, default to the next sequential part!
    const setNumber = (requestedSetNumber > 1 || existingTopicSets.length === 0)
      ? Math.max(1, requestedSetNumber || 1)
      : subNextCalculatedSetNumber;

    const padSet = String(setNumber).padStart(3, "0");

    const isEnglish = masterTopicId >= 56 && masterTopicId <= 88;
    const projectRoot = process.cwd();

    // Support both topic-01 and topic-1 folder naming conventions
    const candidatesDirPad = isEnglish
      ? path.join(projectRoot, "data", "ddd", "english", "candidates", `topic-${padTopic}`)
      : path.join(projectRoot, "data", "ddd", "candidates", `topic-${padTopic}`);
    const candidatesDirRaw = isEnglish
      ? path.join(projectRoot, "data", "ddd", "english", "candidates", `topic-${masterTopicId}`)
      : path.join(projectRoot, "data", "ddd", "candidates", `topic-${masterTopicId}`);
    const candidateFilePad = path.join(candidatesDirPad, `candidate-set-${padSet}.json`);
    const candidateFileRaw = path.join(candidatesDirRaw, `candidate-set-${padSet}.json`);

    const topicsDir = isEnglish
      ? path.join(DATA_PATHS.englishDir, "topics")
      : DATA_PATHS.gkTopicsDir;

    let candidateQuestions: any[] = [];
    let allTopicQuestions: any[] = [];
    let totalRemainingCount = 0;
    let totalPoolCount = 0;
    let importedCount = 0;

    // Pre-load all topic questions if topic file exists
    if (fs.existsSync(topicsDir)) {
      try {
        const files = fs.readdirSync(topicsDir);
        const prefix = `${padTopic}_`;
        const topicFileName = files.find(
          (f) => (f === `topic_${padTopic}.json` || f.startsWith(prefix)) && f.endsWith(".json")
        );
        if (topicFileName) {
          const topicFilePath = path.join(topicsDir, topicFileName);
          const topicData = JSON.parse(fs.readFileSync(topicFilePath, "utf-8"));
          allTopicQuestions = topicData.questions || [];
        }
      } catch (err) {
        console.error("Error reading all topic questions:", err);
      }
    }

    // If candidate file already exists on disk, load it (only for full topic imports without active subtopic)
    const existingCandidateFile = !activeSubTopic
      ? (fs.existsSync(candidateFilePad)
          ? candidateFilePad
          : fs.existsSync(candidateFileRaw)
            ? candidateFileRaw
            : null)
      : null;

    if (existingCandidateFile) {
      try {
        const fileData = JSON.parse(fs.readFileSync(existingCandidateFile, "utf-8"));
        candidateQuestions = fileData.candidates || fileData.questions || [];
      } catch (err) {
        console.error("Error reading candidate file:", err);
      }
    }

    // Read dynamically from authoritative local questions excluding active published questions
    if (candidateQuestions.length === 0 && allTopicQuestions.length > 0) {
      try {
        const allQuestions: any[] = allTopicQuestions;

        // If disk file had candidateQuestions, filter them against usedSet
        if (candidateQuestions.length > 0) {
          candidateQuestions = candidateQuestions.filter((q) => !usedSet.has(String(q.id)));
        }

        // Filter by subtopic if specified
        const eligibleQuestions = activeSubTopic
          ? filterQuestionsBySubTopic(allQuestions, activeSubTopic.id, activeSubTopic.name)
          : allQuestions;

          // Fresh unassigned questions in pool
          const freshAvailable = eligibleQuestions
            .filter((q) => !usedSet.has(String(q.id)))
            .sort(comparePoolQuestions);

          totalRemainingCount = freshAvailable.length;
          totalPoolCount = eligibleQuestions.length;
          importedCount = Math.max(0, totalPoolCount - totalRemainingCount);

          if (candidateQuestions.length === 0 && freshAvailable.length > 0) {
            const isFinalDraw = freshAvailable.length < batchSize;
            const targetBatch = isFinalDraw ? freshAvailable.length : batchSize;
            const candidateDrawCount = isFinalDraw
              ? freshAvailable.length
              : Math.min(freshAvailable.length, targetBatch === 20 ? 25 : Math.round(targetBatch * 1.25));

            candidateQuestions = freshAvailable.slice(0, candidateDrawCount);
          }

          candidateQuestions.sort(comparePoolQuestions);
      } catch (err) {
        console.error("Error resolving topic questions:", err);
      }
    } else if (candidateQuestions.length > 0) {
      candidateQuestions.sort(comparePoolQuestions);
    }

    const topicHindi = topicInfo?.nameHindi || `Topic ${masterTopicId}`;
    const topicEnglish = topicInfo?.nameEnglish || `Topic ${masterTopicId}`;
    const subjectHindi = topicInfo?.subjectHindi || (isEnglish ? "अंग्रेजी (Paper-II)" : "राजस्थान सामान्य ज्ञान");

    const effectiveTitleHindi = activeSubTopic ? activeSubTopic.name : topicHindi;
    const effectiveTitleEnglish = activeSubTopic ? activeSubTopic.name : topicEnglish;

    // Generate Fresh Generation Prompt with existing questions list to prevent any duplication
    const existingQuestionsForPrompt = allTopicQuestions.map(
      (q, idx) => `[ID: ${q.id || `q_${idx + 1}`}] ${healOptionText(q.question || "")}`
    );

    const freshGenerationPrompt = isEnglish
      ? `You are an elite RPSC Senior Teacher (2nd Grade) English examination paper setter and curriculum expert.

Subject: ${subjectHindi}
Master Topic #${masterTopicId}: ${topicEnglish}
${activeSubTopic ? `Target Sub-Topic: ${activeSubTopic.name}` : ""}

================================================================================
🎯 CORE OBJECTIVE:
================================================================================
Generate EXACTLY 20 fresh, high-yield, exam-worthy MCQs designed for the upcoming RPSC Senior Teacher (2nd Grade) / CET examination.

================================================================================
🚫 ZERO DUPLICATION & REDUNDANCY MANDATE:
================================================================================
Below is the list of ${existingQuestionsForPrompt.length} questions ALREADY in our database.
STRICT RULE: Do NOT duplicate or create near-identical variants of any of these existing questions.
Every new question must target unexplored grammatical structures, idioms, vocabulary nuance, or exam-level edge cases.

================================================================================
EXISTING QUESTIONS TO AVOID (DO NOT REPEAT):
================================================================================
${JSON.stringify(existingQuestionsForPrompt, null, 2)}

================================================================================
STRICT RAW JSON FORMAT (EXACTLY 20 QUESTIONS):
================================================================================
Return ONLY a valid raw JSON array of 20 objects. No markdown code fences:

[
  {
    "question": "Question stem here...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "**Rule**: [English rule]\\n**हिंदी व्याख्या**: [विस्तृत विश्लेषण]",
    "topic": "${topicEnglish}",
    "topicId": ${masterTopicId},
    "type": "mcq"
  }
]`
      : `आप राजस्थान लोक सेवा आयोग (RPSC) के वरिष्ठ अध्यापक (2nd Grade) एवं प्रतियोगी परीक्षाओं (RAS, CET) के मुख्य प्रश्न-पत्र निर्माता (Lead Question Paper Setter) हैं।

विषय: ${subjectHindi}
शीर्षक: टॉपिक #${masterTopicId} - ${topicHindi}
${activeSubTopic ? `विशिष्ट सब-टॉपिक: ${activeSubTopic.name}` : ""}

================================================================================
🎯 आपका मुख्य कार्य (CORE OBJECTIVE):
================================================================================
आपको इस टॉपिक के लिए ठीक और केवल ठीक 20 बिल्कुल नए, उच्च स्तरीय एवं परीक्षा-उपयोगी बहुविकल्पीय प्रश्न (Fresh High-Yield MCQs) तैयार करने हैं, जो आगामी 2026-2027 RPSC वरिष्ठ अध्यापक (2nd Grade) / RAS / CET परीक्षा में पूछे जाने की अत्यधिक संभावना रखते हैं।

================================================================================
🚫 सख्त गैर-दोहराव नियम (CRITICAL ZERO-DUPLICATION MANDATE):
================================================================================
नीचे हमारे प्रश्न-बैंक में पहले से मौजूद ${existingQuestionsForPrompt.length} प्रश्नों की सूची दी जा रही है।
सख्त निर्देश:
- आपको नीचे दी गई सूची के प्रश्नों के समान या इनसे मिलते-जुलते (Similar / Duplicate / Overlapping) प्रश्न कतई नहीं बनाने हैं!
- मौजूदा प्रश्नों के तथ्यों का हूबहू पुनरावर्तन न करें।
- प्रत्येक नया प्रश्न इस टॉपिक के उन महत्वपूर्ण पहलुओं, नवीन प्रशासनिक/भौगोलिक आंकड़ों, या गहरे विश्लेषणात्मक बिंदुओं पर केंद्रित होना चाहिए जो अभी तक इस पूल में कवर नहीं हुए हैं।

================================================================================
📐 प्रश्न-सीमा एवं मानक (EXAM BOUNDARY & QUESTION STANDARDS):
================================================================================
1. पाठ्यक्रम सीमा (Syllabus Boundary): प्रश्न RPSC 2nd Grade GK के प्रामाणिक पाठ्यक्रम की सीमा एवं निकटवर्ती सीमा (Near Boundary) के भीतर ही होने चाहिए।
2. उच्च स्तरीय प्रारूप (High-Order Thinking Formats):
   - कम से कम 5 प्रश्न बहु-कथनी (Multi-Statement: 'कथनों पर विचार कीजिए तथा सत्य/असत्य कथन चुनिए')
   - कम से कम 4 प्रश्न सुमेलित कीजिए (Match the following: सूची-I को सूची-II से सुमेलित कीजिए)
   - कम से कम 3 प्रश्न अभिकथन एवं कारण (Assertion & Reason: अभिकथन (A) और कारण (R))
   - शेष प्रश्न तथ्यात्मक गहराई, कालक्रम, एवं अवधारणात्मक अनुप्रयोग आधारित।
3. विकल्पों की गुणवत्ता: चारों विकल्प अत्यंत संतुलित, तार्किक एवं प्रामाणिक हों। कोई भी विकल्प अस्पष्ट या भ्रामक न हो।
4. 100% प्रामाणिक उत्तर एवं व्याख्या:
   - उत्तर (0, 1, 2, 3) का संतुलित वितरण रखें (~5 प्रश्न A, ~5 प्रश्न B, ~5 प्रश्न C, ~5 प्रश्न D)।
   - व्याख्या (explanation) में केवल सही उत्तर का ठोस कारण, राजस्थान हिंदी ग्रंथ अकादमी (डॉ. हरिमोहन सक्सेना, जयसिंह नीरज, हुकमचंद जैन) का संदर्भ दें।
   - अन्य विकल्पों के बारे में कोई काल्पनिक/मनगढ़ंत विवरण न लिखें (Zero Hallucination)।

================================================================================
मौजूदा प्रश्न (DO NOT REPEAT OR DUPLICATE THESE):
================================================================================
${JSON.stringify(existingQuestionsForPrompt, null, 2)}

================================================================================
आउटपुट प्रारूप (STRICT RAW JSON FORMAT ONLY):
================================================================================
बिना किसी अतिरिक्त कमेंट्री, मार्कडाउन कोड फेंस (\`\`\`json) या चैट वार्तालाप के, केवल ठीक 20 प्रश्नों का शुद्ध JSON array लौटाएँ:

[
  {
    "question": "प्रश्न पाठ यहाँ...",
    "options": [
      "विकल्प A",
      "विकल्प B",
      "विकल्प C",
      "विकल्प D"
    ],
    "answer": 0,
    "explanation": "सही उत्तर की प्रामाणिक व्याख्या...",
    "topic": "${topicHindi}",
    "topicId": ${masterTopicId},
    "type": "mcq"
  }
]`;

    if (candidateQuestions.length === 0) {
      const completeMessage = activeSubTopic
        ? `सब-टॉपिक '${activeSubTopic.name}' के सभी प्रश्न इम्पोर्ट हो चुके हैं! All questions in this subtopic have already been published into live sets.`
        : `Topic #${masterTopicId} (${topicHindi}) is 100% complete! All questions have already been published into live sets. No unassigned questions remain in the pool.`;

      return NextResponse.json({
        success: true,
        isComplete: true,
        masterTopicId,
        masterTopic: isEnglish ? topicEnglish : topicHindi,
        masterTopicHindi: topicHindi,
        masterTopicEnglish: topicEnglish,
        subTopicId: activeSubTopic?.id,
        subTopic: activeSubTopic?.name,
        subjectName: subjectHindi,
        setNumber,
        setName: isEnglish ? `${effectiveTitleEnglish} Part ${setNumber}` : `${effectiveTitleHindi} भाग ${setNumber}`,
        batchSize,
        setCount: 0,
        targetCount: 0,
        candidateCount: 0,
        remainingCount: 0,
        totalPoolCount,
        importedCount: totalPoolCount,
        usedQuestionIds: Array.from(usedSet),
        maxSetsAvailable: 0,
        isFinalTopicSet: false,
        message: completeMessage,
        questions: [],
        geminiPrompt: "",
        freshGenerationPrompt,
      });
    }

    // Format clean questions for prompt, ensuring candidate option text is pre-healed
    const promptQuestions = candidateQuestions.map((q) => ({
      id: q.id,
      topic: topicEnglish,
      topicHindi,
      masterTopicId,
      question: q.question,
      options: Array.isArray(q.options)
        ? q.options.map((opt: any) => healOptionText(typeof opt === "string" ? opt : opt?.text || ""))
        : q.options,
      answer: q.answer,
      explanation: q.explanation || "",
      exam: q.exam || null,
      year: q.year || null,
    }));

    const isFinalTopicSet = candidateQuestions.length > 0 && candidateQuestions.length < batchSize;
    const targetCount = isFinalTopicSet ? candidateQuestions.length : batchSize;
    const setCount = Math.max(1, Math.ceil(targetCount / 20));

    const setName = isEnglish
      ? setCount > 1
        ? `${effectiveTitleEnglish} Part ${setNumber} to Part ${setNumber + setCount - 1} (${setCount} Sets × 20 Questions)`
        : `${effectiveTitleEnglish} Part ${setNumber}`
      : setCount > 1
        ? `${effectiveTitleHindi} भाग ${setNumber} से भाग ${setNumber + setCount - 1} (${setCount} सेट्स × 20 प्रश्न)`
        : `${effectiveTitleHindi} भाग ${setNumber}`;

    const promptTopicTitle = activeSubTopic
      ? `${topicHindi} (विशिष्ट सब-टॉपिक: ${activeSubTopic.name})`
      : topicHindi;

    let geminiPrompt = "";

    if (isEnglish) {
      const taskDescription = isFinalTopicSet
        ? `This is the final set for this topic. Exactly ${targetCount} questions remain in the pool. Your task is to review, repair, and verify all ${targetCount} questions into the final set.`
        : setCount > 1
          ? `Below are ${candidateQuestions.length} candidate questions. Your task is to review, repair, and output EXACTLY ${targetCount} high-yield questions (${setCount} Sets × 20 Questions = ${targetCount} Questions). The remaining ${candidateQuestions.length - targetCount} buffer questions must be discarded.`
          : `Below are ${candidateQuestions.length} candidate questions. Your task is to review, repair, and output EXACTLY 20 high-yield questions. The remaining ${candidateQuestions.length - 20} buffer questions must be discarded.`;

      const countRule = isFinalTopicSet
        ? `1. 🚨 STRICT COUNT: Provide EXACTLY ${targetCount} questions.`
        : `1. 🚨 STRICT EXACT COUNT MANDATE (ZERO TOLERANCE FOR OVER/UNDER GENERATION):
   - Output EXACTLY ${targetCount} questions in the JSON array!
   - Not ${targetCount - 1}, not ${targetCount + 1}, not 73, and NOT all ${candidateQuestions.length}! The JSON array length must be EXACTLY ${targetCount}.
   - NOTE: You have been provided with ${candidateQuestions.length} candidate items to give you a quality selection buffer. You must discard the weakest ${candidateQuestions.length - targetCount} items.
   - Stop generation immediately once exactly ${targetCount} questions are produced. Any extra items will fail validation.`;

      geminiPrompt = `You are the CHIEF EXAMINER & LEAD QUESTION SETTER for the Rajasthan Public Service Commission (RPSC), Ajmer, specializing in the Senior Teacher (2nd Grade) Competitive Examination (Department of Secondary Education, Paper-II: English).

SUBJECT: English (Paper-II)
TOPIC (Master Topic #${masterTopicId}): ${topicEnglish} (${topicHindi})
SET: ${setName}${isFinalTopicSet ? " (Final Set)" : ""}
TARGET QUESTION COUNT REQUIRED: EXACTLY ${targetCount} (Array Length = ${targetCount})
CANDIDATE QUESTIONS PROVIDED IN BUFFER: ${candidateQuestions.length}

${taskDescription}

================================================================================
EXAMINATION STANDARDS & MANDATORY GUIDELINES:
================================================================================
${countRule}
2. STANDARD BRITISH ENGLISH & RPSC EXAM CONVENTIONS:
   - Reflect authentic RPSC question stems ("Fill in the blank with the most appropriate option...", "The correct passive form of...", "Which of the following is grammatically correct?", "Identify the sentence pattern...", etc.).
   - Distractors must represent plausible, intelligent misconceptions or classic exam traps (e.g. subject-verb proximity traps, indirect speech word-order inversion traps, fixed preposition traps, homophone/confusable traps).
3. RIGOROUS 4-OPTION MCQ:
   - Every question must have exactly 4 grammatically parallel options.
   - Never use "None of the above" or "All of the above".
   - DO NOT prefix options with letters or numbers inside the string (e.g. write "She has been waiting", NOT "A. She has been waiting" or "1. She has been waiting").
4. SINGLE DEFINITIVE CORRECT ANSWER & BALANCED DISTRIBUTION (CRITICAL):
   - Provide a single unambiguous correct answer: "answer": 0 | 1 | 2 | 3 (0-indexed integer corresponding to options array: 0=A, 1=B, 2=C, 3=D).
   - ANSWER KEY BALANCE MANDATE: Across the questions in this batch, distribute the correct answers roughly equally among indices 0, 1, 2, and 3 (approx. 25% each, ~4-6 per option). NEVER default all or most answers to 0 (Option A).
   - FOR MATCHING / LIST QUESTIONS (ZERO-TOLERANCE MATCHING ACCURACY):
     * List-I items must use (a, b, c, d) and List-II items must use (I, II, III, IV).
     * Standardize option format strictly: 'a-II, b-IV, c-I, d-III' or '(a)-(iv), (b)-(iii), (c)-(i), (d)-(ii)'.
     * Determine the true grammatical / literary match first.
     * In explanation, explicitly write the arrow pairs: 'Item a → Match II | Item b → Match IV...'.
     * Carefully inspect all 4 options, find which exact index (0, 1, 2, or 3) holds this true combination, and assign that index to "answer".
     * Randomize the position of the correct match combination across 0, 1, 2, and 3. Never default to 0!
5. SEQUENCE & CHRONOLOGICAL QUESTIONS:
   - Provide clear directives in stem ("Arrange in the correct sequence...").
   - Format permutation options cleanly: 'd, b, a, c' or '4, 2, 1, 3'.
6. DUAL-LAYER BILINGUAL EXPLANATIONS ("explanation"):
   Every explanation MUST contain:
   - **Rule**: Formal citation of the English grammatical rule, syntactic formula, or literary source text.
   - **हिंदी व्याख्या**: Lucid explanation in Hindi (नियम, वाक्य का अर्थ, एवं सही विकल्प चुनने का ठोस कारण).
   - **RPSC Exam Alert**: Explicit warning highlighting the exact distractor trap.
7. PROVENANCE ID PRESERVATION:
   ${candidateQuestions.length > 0 ? `- Retain the provided 'id' (e.g. "${candidateQuestions[0]?.id || "rg_eng_000001"}") EXACTLY as provided for provenance tracking.` : `- Assign IDs starting from "rg_eng_top${masterTopicId}_${String(setNumber).padStart(2, "0")}_01".`}
8. JSON QUOTES SAFETY:
   - If quotes appear inside questions, options, or explanations, use single quotes ('...') or escape them properly (\\"). Never leave raw unescaped double quotes.

${candidateQuestions.length > 0 ? `================================================================================
CANDIDATE QUESTIONS:
================================================================================
${JSON.stringify(promptQuestions, null, 2)}
` : ""}
================================================================================
STRICT OUTPUT FORMAT:
================================================================================
Return ONLY a valid, raw JSON array of objects. Do NOT include markdown code fence wrappers or extraneous commentary:

[
  {
    "id": "${candidateQuestions[0]?.id || `rg_eng_top${masterTopicId}_01`}",
    "topic": "${topicEnglish}",
    "masterTopicId": ${masterTopicId},
    "question": "Question text here with **bold** key terms...",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": 0,
    "explanation": "**Rule**: [English rule]\\n**हिंदी व्याख्या**: [विस्तृत हिंदी विश्लेषण]\\n**RPSC Exam Alert**: [परीक्षा अलर्ट व ट्रैप]",
    "exam": "RPSC 2nd Grade English",
    "year": 2024
  }
]`;
    } else {
      const taskDescription = isFinalTopicSet
        ? `यह इस टॉपिक का अंतिम सेट (Final Partial Set) है। पूल में केवल ${targetCount} प्रश्न शेष हैं। आपका कार्य दिए गए सभी ${targetCount} प्रश्नों की गुणवत्ता समीक्षा (Review & Repair) करके ठीक ${targetCount} प्रश्नों का अंतिम सेट तैयार करना है। अपनी ओर से कोई अन्य प्रश्न न जोड़ें।`
        : setCount > 1
          ? `नीचे आपको ${candidateQuestions.length} कैंडिडेट प्रश्न दिए गए हैं। आपका कार्य इनमें से ठीक और केवल ठीक ${targetCount} सर्वश्रेष्ठ प्रश्न चुनना और सुधारना है (${setCount} सेट्स × 20 प्रश्न = ${targetCount} प्रश्न)। शेष ${candidateQuestions.length - targetCount} प्रश्नों को छाँटकर बाहर (discard) कर देना है।`
          : `नीचे आपको ${candidateQuestions.length} कैंडिडेट प्रश्न दिए गए हैं। आपका कार्य इनमें से ठीक और केवल ठीक 20 सर्वश्रेष्ठ प्रश्न चुनना और सुधारना है। शेष ${candidateQuestions.length - 20} प्रश्नों को छाँटकर बाहर (discard) कर देना है।`;

      const countRule = isFinalTopicSet
        ? `1. 🚨 अनिवार्य गणना नियम: ठीक ${targetCount} प्रश्न दें (Select ALL ${targetCount} provided questions)। दिए गए सभी ${targetCount} प्रश्नों को सुधारें। कोई नया प्रश्न न बनाएँ और न ही कोई प्रश्न छोड़ें।`
        : `1. 🚨 सख्त गणना नियम (STRICT EXACT COUNT MANDATE - ZERO TOLERANCE FOR OVER-GENERATION):
   - आउटपुट JSON में ठीक और केवल ठीक ${targetCount} प्रश्न होने चाहिए (EXACTLY ${targetCount} QUESTIONS)!
   - न एक कम (${targetCount - 1}), न एक ज्यादा (${targetCount + 1}), और न ही कैंडिडेट सूची के सभी प्रश्न (जैसे 73 या ${candidateQuestions.length})!
   - ध्यान दें: नीचे दी गई सूची में ${candidateQuestions.length} प्रश्न इसलिए दिए गए हैं ताकि आप उनमें से कमजोर या अशुद्ध प्रश्नों को अस्वीकार (Filter Out) कर सकें। यह केवल एक चयन बफ़र (Selection Buffer) है।
   - आपको दिए गए सभी ${candidateQuestions.length} प्रश्न वापस नहीं करने हैं! केवल सर्वश्रेष्ठ ${targetCount} प्रश्न ही चुनकर लौटाएँ।
   - जैसे ही आपके ठीक ${targetCount} प्रश्न पूरे हों, तुरंत रुक जाएँ! आउटपुट JSON array की कुल लंबाई (Length) अनिवार्य रूप से ठीक ${targetCount} ही होनी चाहिए।`;

      geminiPrompt = `आप राजस्थान प्रतियोगी परीक्षाओं (RPSC, RSMSSB, RAS, REET, पटवार, CET) के मुख्य प्रश्न-पत्र निर्माता एवं वरिष्ठ परीक्षा विशेषज्ञ (Lead Question Setter & Chief Examiner) हैं।

विषय: ${subjectHindi}
शीर्षक (Master Topic #${masterTopicId}): ${promptTopicTitle}
सेट: ${setName}${isFinalTopicSet ? " (अंतिम सेट / Final Set)" : ""}
अनिवार्य प्रश्न संख्या (Target Count Required): ठीक और केवल ठीक ${targetCount} प्रश्न (Array Length = ${targetCount})
कैंडिडेट बफ़र में उपलब्ध प्रश्न: ${candidateQuestions.length} (इनमें से केवल सर्वश्रेष्ठ ${targetCount} चुनें, शेष ${candidateQuestions.length - targetCount} को छोड़ दें)

नीचे हमारे स्थानीय प्रश्न-पूल से ${candidateQuestions.length} उम्मीदवार प्रश्न दिए गए हैं।
${taskDescription}

================================================================================
कड़े नियम एवं अनिवार्य परीक्षा मानक (STRICT EXAMINATION STANDARDS):
================================================================================
${countRule}
2. व्याकरण, वर्तनी एवं देवनागरी लिपि की पूर्ण शुद्धता:
   - सभी प्रश्न एवं विकल्प मानक देवनागरी में शुद्ध व्याकरण एवं वर्तनी युक्त होने चाहिए।
   - OCR या तकनीकी कारणों से टूटे शब्दों को पूर्णतः ठीक करें।

3. विकल्पों के पाठ की अखंडता (CRITICAL ZERO-LETTER-STRIPPING RULE):
   - किसी भी शब्द का पहला अक्षर या मात्रा कभी न काटें!
     * उदाहरण: 'दक्षिणी सिरा' को कभी भी 'क्षिणी सिरा' न लिखें (शुद्ध 'दक्षिणी' लिखें)।
     * 'बीकानेर' को 'ीकानेर' नहीं; 'सिरोही' को 'िरोही' नहीं; 'अनुच्छेद' को 'नुच्छेद' नहीं; 'अधिनियम' को 'धिनियम' नहीं; 'अध्यक्ष' को 'ध्यक्ष' नहीं; 'अक्टूबर' को 'क्टूबर' नहीं।
     * यदि उम्मीदवार प्रश्न में कोई शब्द कटा हुआ दिखे, तो उसे तुरंत शुद्ध व पूर्ण रूप में पुनर्स्थापित करें।
   - विकल्पों के भीतर 'A.', 'B.', 'C.', 'D.' या '1.', '2.', '3.', '4.' या 'अ.', 'ब.', 'स.', 'द.' जैसे उपसर्ग (prefixes) कतई न लिखें। केवल शुद्ध विकल्प पाठ लिखें।

4. 🚨 उत्तर कुंजी का 100% प्रामाणिक सत्यापन एवं सुधार नियम (MANDATORY FACTUAL ANSWER KEY AUDIT & OVERRIDE):
   - दिए गए उम्मीदवार प्रश्न JSON में दिए गए उत्तर ('answer': 0, 1, 2, 3) पर आँख मूँद कर भरोसा न करें!
   - प्रत्येक प्रश्न के उत्तर का राजस्थान हिंदी ग्रंथ अकादमी (डॉ. हरिमोहन सक्सेना, जयसिंह नीरज, हुकमचंद जैन) एवं RPSC/RSMSSB की आधिकारिक उत्तर कुंजियों के अनुसार दोबारा 100% सत्यापन (Fact-Check) करें।
   - 🚨 यदि आप 100% आश्वस्त और निश्चित हैं कि हमारे JSON में दिया गया उत्तर गलत है, तो आपको उत्तर ('answer') को सही विकल्प इंडेक्स (0, 1, 2 या 3) पर बदलने की पूर्ण अनुमति और स्पष्ट निर्देश है!
   - व्याख्या (explanation) में केवल सही उत्तर का प्रामाणिक व स्पष्ट कारण लिखें। किसी अन्य विकल्प के बारे में मनगढ़ंत या काल्पनिक विवरण न लिखें (Zero Hallucination)।
   - सेट के 20 प्रश्नों में उत्तर (0, 1, 2, 3) का वितरण लगभग समान होना चाहिए (प्रति विकल्प लगभग 4 से 6 प्रश्न: ~25% A, ~25% B, ~25% C, ~25% D)। कभी भी अधिकांश या सभी प्रश्नों का उत्तर 0 (विकल्प A) न रखें। ऑप्शन A को डिफ़ॉल्ट बनाने की आलसी प्रवृत्ति सख्त वर्जित है।

5. सुमेलित प्रश्न (MATCH THE FOLLOWING - ZERO-TOLERANCE ACCURACY & FORMAT):
   - सूची-I के मदों को छोटे अंग्रेजी अक्षरों (a, b, c, d) से तथा सूची-II के मदों को रोमन अंकों (I, II, III, IV) से दर्शाएँ।
   - चारों विकल्पों का प्रारूप अनिवार्य रूप से मानक रखें:
     'a-I, b-II, c-III, d-IV' या 'a-II, b-I, c-IV, d-III'
   - किसी विकल्प में से 'a-' छोड़ना सख्त मना है (जैसे 'III, b-I, c-IV, d-II' कभी न लिखें, हमेशा 'a-III, b-I, c-IV, d-II' लिखें)।
   - विकल्पों में हिंदी अक्षरों ('अ-1, ब-2') का प्रयोग न करें; सर्वदा 'a-I, b-II, c-III, d-IV' का ही उपयोग करें।
   - उत्तर निर्धारण का कड़ा नियम (HOW TO ASSIGN 'answer' ACCURATELY):
     * चरण 1: पहले ऐतिहासिक/भौगोलिक तथ्यों के आधार पर सूची-I (a, b, c, d) और सूची-II (I, II, III, IV) का सही मिलान ज्ञात करें।
     * चरण 2: व्याख्या (explanation) में तीर (→) के साथ सभी जोड़ियों को स्पष्ट लिखें, जैसे:
       'सोनियाना सिरामिक → चित्तौड़गढ़ (II) | हैण्डिक्राफ्ट पार्क → जोधपुर (III) | स्टोन पार्क → कोटा (IV) | गजनेर सिरामिक → बीकानेर (I)'
     * चरण 3: इससे वास्तविक कूट बनता है: 'a-II, b-III, c-IV, d-I'।
     * चरण 4: अब अपने चारों विकल्पों (options[0], options[1], options[2], options[3]) को देखें कि यह सही कूट किस इंडेक्स पर स्थित है:
       - यदि यह कूट options[0] में है → 'answer': 0 (विकल्प A)
       - यदि यह कूट options[1] में है → 'answer': 1 (विकल्प B)
       - यदि यह कूट options[2] में है → 'answer': 2 (विकल्प C)
       - यदि यह कूट options[3] में है → 'answer': 3 (विकल्प D)
     * सही कूट को विकल्पों में चारों स्थानों (0, 1, 2, 3) पर यादृच्छिक रूप से (randomly) रखें। कभी भी आँख मूँद कर 'answer': 0 न लिखें!

6. क्रम निर्धारण प्रश्न (SEQUENCE / CHRONOLOGICAL QUESTIONS):
   - प्रश्न में स्पष्ट निर्देश दें (जैसे: 'राजस्थान के निम्नलिखित दुर्गों को निर्माण कालक्रमानुसार प्राचीन से नवीन के सही क्रम में व्यवस्थित कीजिए:' या 'जिलों को क्षेत्रफल के अनुसार अवरोही क्रम में व्यवस्थित कीजिए:')।
   - विकल्पों में स्पष्ट कूट दें (जैसे: 'd, b, a, c' या '4, 2, 1, 3')।
   - व्याख्या में प्रत्येक मद का सही वर्ष / मान स्पष्ट लिखें जिससे क्रम का सत्यापन हो सके।

7. अभिकथन एवं कारण प्रश्न (ASSERTION & REASON QUESTIONS):
   - प्रश्न पाठ (question text) को स्पष्ट डबल लाइन ब्रेक (\\n\\n) के साथ प्रारूपित करें:
     "नीचे दो कथन दिए गए हैं, एक को अभिकथन (A) और दूसरे को कारण (R) कहा गया है:\\n\\nअभिकथन (A): [कथन]\\n\\nकारण (R): [कारण]\\n\\nउपर्युक्त कथनों के आलोक में निम्नलिखित में से सबसे उपयुक्त उत्तर चुनें:"
   - मानक 4 विकल्प होने चाहिए:
     [
       "A और R दोनों सही हैं और R, A की सही व्याख्या है।",
       "A और R दोनों सही हैं लेकिन R, A की सही व्याख्या नहीं है।",
       "A सही है लेकिन R गलत है।",
       "A गलत है लेकिन R सही है।"
     ]
   - यदि A सही है और R गलत है → 'answer': 2 (विकल्प C)
   - यदि A गलत है और R सही है → 'answer': 3 (विकल्प D)
   - वास्तविक सत्यता के अनुसार ही सही इंडेक्स असाइन करें; आँख मूँद कर 0 न लिखें।

8. बहु-कथनी प्रश्न (MULTI-STATEMENT MCQs):
   - कथनों पर विचार कीजिए वाले प्रश्नों में कथनों को प्रश्न पाठ में ही \\n\\n से स्पष्ट रखें (1. [कथन 1]\\n2. [कथन 2])।
   - विकल्पों में केवल कूट रखें ('केवल 1 और 2', 'केवल 2 और 3', '1, 2 और 3')। ऐसे प्रश्नों को कभी भी सूची मिलान (Match Question) के रूप में न तोड़ें।

9. विस्तृत एवं प्रामाणिक व्याख्या (DETAILED EXPLANATION):
   - प्रत्येक प्रश्न की 2-4 पंक्तियों की प्रामाणिक व्याख्या लिखें, जिसमें तथ्य, संदर्भ, एवं अन्य विकल्पों के असत्य होने का कारण स्पष्ट हो।

10. सेट के भीतर कोई दोहराव (INTRA-SET REPETITION) न हो:
    - यदि दो प्रश्न एक ही तथ्य पर आधारित हों, तो उनमें से केवल एक सर्वश्रेष्ठ प्रश्न रखें।

11. मूल पहचान (ID) की अखंडता:
    - 'id' (जैसे "${candidateQuestions[0]?.id || "rg_000001"}") को मूल प्रश्न से अक्षुण्ण रखें। इसे बदलें नहीं।

12. उद्धरण चिह्नों की JSON सुरक्षा (CRITICAL QUOTES ESCAPING RULE):
    - यदि किसी प्रश्न (question), विकल्प (options) या व्याख्या (explanation) में कोई कथन, नारा, पुस्तक या उपाधि उद्धृत हो (जैसे 'मैं अपने डेथ वारंट पर हस्ताक्षर कर रहा हूँ'), तो JSON स्ट्रिंग के भीतर कभी भी कच्चा अनएस्केप्ड डबल कोट (") न छोड़ें। उद्धरण के लिए या तो एकल उद्धरण चिन्ह ('...') या स्मार्ट उद्धरण (‘...’ / “...”) का प्रयोग करें अथवा \\" से उचित रूप से एस्केप करें। कच्चा डबल कोट JSON पार्सिंग को पूरी तरह क्रैश कर देता है।

13. 'topic' ("${topicHindi}") एवं 'masterTopicId' (${masterTopicId}) शामिल रखें।

==================================================
उम्मीदवार प्रश्न (Candidate Questions):
==================================================
${JSON.stringify(promptQuestions, null, 2)}

==================================================
अपेक्षित आउटपुट प्रारूप (Strict Output Format):
==================================================
केवल और केवल शुद्ध JSON Array वापस करें जिसमें ठीक और केवल ठीक ${targetCount} प्रश्न ऑब्जेक्ट्स हों (Array Length = ${targetCount})।
न ${targetCount - 1}, न 73, न ${candidateQuestions.length}! ठीक ${targetCount} प्रश्नों के बाद तुरंत रुक जाएँ। कोई अतिरिक्त वाक्य, मार्कडाउन या चैट वार्तालाप न जोड़ें:

[
  {
    "id": "${candidateQuestions[0]?.id || "rg_000001"}",
    "topic": "${topicHindi}",
    "masterTopicId": ${masterTopicId},
    "question": "शुद्ध प्रामाणिक प्रश्न पाठ (कथन हेतु '...' या \\\"...\\\" का प्रयोग करें)...",
    "options": [
      "विकल्प 1",
      "विकल्प 2",
      "विकल्प 3",
      "विकल्प 4"
    ],
    "answer": 0,
    "explanation": "विस्तृत प्रमाणिक व्याख्या...",
    "exam": "REET",
    "year": 2021
  }
]`;
    }

    return NextResponse.json({
      success: true,
      masterTopicId,
      masterTopic: isEnglish ? topicEnglish : topicHindi,
      masterTopicHindi: topicHindi,
      masterTopicEnglish: topicEnglish,
      subTopicId: activeSubTopic?.id,
      subTopic: activeSubTopic?.name,
      subjectName: subjectHindi,
      setNumber,
      setName,
      batchSize,
      setCount,
      targetCount,
      candidateCount: candidateQuestions.length,
      remainingCount: totalRemainingCount,
      totalPoolCount,
      importedCount,
      usedQuestionIds: Array.from(usedSet),
      maxSetsAvailable: Math.max(1, Math.min(2, Math.ceil(totalRemainingCount / 20))),
      isFinalTopicSet,
      isComplete: false,
      questions: promptQuestions,
      geminiPrompt,
      freshGenerationPrompt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load candidate set" },
      { status: 500 }
    );
  }
}
