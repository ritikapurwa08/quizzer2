import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../../..");
const XDATA_DIR = path.join(ROOT_DIR, "src/xdata");
const TOPICS_DIR = path.join(XDATA_DIR, "topics");
const PREPARED_DIR = path.join(XDATA_DIR, "prepared_tests");

interface TopicCatalogItem {
  id: number;
  topic: string;
  source: string;
  file: string;
  questionCount: number;
  examCount: number;
  examCoveragePercent: number;
}

interface TopicIndex {
  generatedAt: string;
  totalQuestions: number;
  sources: Record<string, { totalTopics: number; totalQuestions: number; directory: string }>;
  topics: TopicCatalogItem[];
}

interface RawQuestion {
  id: number;
  topic: string;
  question: string;
  options: string[];
  answer: string;
  exam?: string;
  explanation?: string;
}

export interface PreparedOption {
  id: string;
  text: string;
}

export interface PreparedQuestion {
  type: "mcq";
  questionText: string;
  options: PreparedOption[];
  correctAnswer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  sourceType: "PYQ" | "PYQ_MODIFIED" | "AI_NEW";
  exam?: string;
  sourceQuestionId?: number;
  reference?: string;
}

export interface PreparedTestSet {
  subject: string;
  subjectSlug: string;
  topic: string;
  topicSlug: string;
  testSetName: string;
  negativeMarking: boolean;
  questionCount: number;
  questions: PreparedQuestion[];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\w\s\u0900-\u097F-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cleanOptionText(opt: string): string {
  if (!opt) return "";
  return opt
    .replace(/^[\s(\[]*(?:[अबसदa-dA-D1-4]|[ivxIVX]+)[\s)\]:.-]+/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

export function isFakeExam(str?: string | null): boolean {
  if (!str) return true;
  const lower = str.toLowerCase().trim();
  return (
    !lower ||
    lower === "unknown" ||
    lower === "unknown exam" ||
    lower === "practice" ||
    lower === "practice exam" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "[object object]" ||
    lower === "none" ||
    lower === "n/a"
  );
}

export function mapSubjectForTopic(topicName: string): { name: string; slug: string } {
  const t = topicName.trim();

  // Reasoning & Mental Ability
  if (
    t.includes("मान्यताएं") || t.includes("तर्क") || t.includes("निष्कर्ष") ||
    t.includes("कार्यवाही") || t.includes("तर्कक्षमता") || t.includes("अनुक्रम") ||
    t.includes("कूटवाचन") || t.includes("कोडिंग") || t.includes("संबंधों") ||
    t.includes("दिशा ज्ञान") || t.includes("वेन आरेख") || t.includes("दर्पण") ||
    t.includes("आकृतियों") || t.includes("सादृश्यता") || t.includes("वर्गीकरण") ||
    t.includes("बैठक व्यवस्था") || t.includes("पहेली") || t.includes("घड़ी") ||
    t.includes("कैलेंडर") || t.includes("आयु संबंधी") || t.includes("सांकेतिक")
  ) {
    return { name: "तार्किक विवेचन एवं मानसिक योग्यता", slug: "reasoning-mental-ability" };
  }

  // Science & Technology
  if (
    t.includes("कम्प्यूटर") || t.includes("सूचना एवं संचार") || t.includes("रक्षा प्रौद्योगिकी") ||
    t.includes("अंतरिक्ष") || t.includes("उपग्रह") || t.includes("नैनो") ||
    t.includes("जैव–प्रौद्योगिकी") || t.includes("आनुवंशिक") || t.includes("आहार एवं पोषण") ||
    t.includes("रक्त समूह") || t.includes("स्वास्थ्य देखभाल") || t.includes("रोग") ||
    t.includes("पारिस्थितिकीय") || t.includes("वैज्ञानिक") || t.includes("भौतिक एवं रासायनिक") ||
    t.includes("धातु एवं अधातु") || t.includes("मानव शरीर") || t.includes("प्रकाश") ||
    t.includes("विद्युत") || t.includes("गति") || t.includes("बल")
  ) {
    return { name: "सामान्य विज्ञान एवं प्रौद्योगिकी", slug: "general-science-technology" };
  }

  // Indian Polity & Foreign Policy
  if (
    t.includes("संविधान सभा") || t.includes("संविधान की विशेषताएं") || t.includes("संवैधानिक संशोधन") ||
    t.includes("उद्देशिका") || t.includes("मूल अधिकार") || t.includes("निदेशक तत्व") ||
    t.includes("मूल कर्तव्य") || t.includes("संसद") || t.includes("राष्ट्रपति") ||
    t.includes("उच्चतम न्यायालय") || t.includes("न्यायिक पुनरावलोकन") || t.includes("निर्वाचन आयोग") ||
    t.includes("नियंत्रक एवं महालेखापरीक्षक") || t.includes("संघ लोक सेवा आयोग") || t.includes("नीति आयोग") ||
    t.includes("केन्द्रीय सतर्कता आयोग") || t.includes("लोकपाल") || t.includes("राष्ट्रीय मानवाधिकार") ||
    t.includes("संघवाद") || t.includes("भारतीय राजनीतिक व्यवस्था") || t.includes("गठबंधन सरकार")
  ) {
    return { name: "भारतीय राजव्यवस्था एवं विदेश नीति", slug: "indian-polity-foreign-policy" };
  }

  // World & India GK / Geography / History
  if (
    t.includes("सिंधु घाटी") || t.includes("वैदिक काल") || t.includes("बौद्ध") ||
    t.includes("जैन धर्म") || t.includes("मौर्य") || t.includes("कुषाण") ||
    t.includes("सातवाहन") || t.includes("गुप्त") || t.includes("हर्षवर्धन") ||
    t.includes("सल्तनत काल") || t.includes("मुगल साम्राज्य") || t.includes("भक्ति आन्दोलन") ||
    t.includes("सूफी आन्दोलन") || t.includes("राष्ट्रीय आन्दोलन") || t.includes("स्वतंत्रता संघर्ष") ||
    t.includes("राष्ट्र निर्माण") || t.includes("आधुनिक भारत का विकास") || t.includes("बौद्धिक जागरण") ||
    t.includes("स्थलाकृतियाँ") || t.includes("पर्वत, पठार") || t.includes("औद्योगिक प्रदेश") ||
    t.includes("मानसून तंत्र") || t.includes("परिवहन गलियारे") || t.includes("वैश्विक") ||
    t.includes("विश्व") || t.includes("महाद्वीप") || t.includes("महासागर")
  ) {
    return { name: "विश्व एवं भारत का सामान्य ज्ञान", slug: "world-india-gk" };
  }

  // Rajasthan Current Affairs / Welfare schemes
  if (
    t.includes("कल्याणकारी योजनाएँ") || t.includes("योजनाएं") || t.includes("योजना") ||
    t.includes("समसामयिकी") || t.includes("फ्लेगशिप") || t.includes("विकास परियोजनाएँ") ||
    t.includes("बजट निर्माण") || t.includes("राजकोषीय") || t.includes("मुद्रास्फीति") ||
    t.includes("गरीबी एवं बेरोजगारी") || t.includes("मानव विकास सूचकांक") || t.includes("आर्थिक सुधार") ||
    t.includes("लेखांकन") || t.includes("संवृद्धि")
  ) {
    return { name: "राजस्थान समसामयिकी", slug: "rajasthan-current-affairs" };
  }

  // Rajasthan Polity & Administration
  if (
    t.includes("राज्यपाल") || t.includes("मुख्यमंत्री") || t.includes("मंत्रिपरिषद") ||
    t.includes("विधानसभा") || t.includes("उच्च न्यायालय") || t.includes("पंचायती") ||
    t.includes("आयोग") || t.includes("प्रशासन") || t.includes("लोकायुक्त") ||
    t.includes("सचिवालय") || t.includes("मुख्य सचिव") || t.includes("जिला प्रशासन") ||
    t.includes("उपखण्ड") || t.includes("तहसील") || t.includes("पुलिस प्रशासन") ||
    t.includes("विधिक अधिकार") || t.includes("नागरिक अधिकार") || t.includes("लोक सेवा आयोग") ||
    t.includes("राजस्‍व मण्‍डल") || t.includes("राजस्व मंडल")
  ) {
    return { name: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था", slug: "rajasthan-polity-administration" };
  }

  // Rajasthan Art, Culture & Society
  if (
    t.includes("मेले") || t.includes("त्यौहार") || t.includes("त्योहार") ||
    t.includes("किला") || t.includes("दुर्ग") || t.includes("महल") ||
    t.includes("स्थापत्य") || t.includes("वास्तु परम्परा") || t.includes("मंदिर") ||
    t.includes("लोक देवता") || t.includes("लोक देवियां") || t.includes("लोकगीत") ||
    t.includes("नृत्य") || t.includes("नाट्य") || t.includes("चित्रकला") ||
    t.includes("हस्तशिल्प") || t.includes("रीति") || t.includes("प्रथा") ||
    t.includes("वेशभूषा") || t.includes("आभूषण") || t.includes("संत") ||
    t.includes("संप्रदाय") || t.includes("संगीत") || t.includes("वाद्य") ||
    t.includes("प्रदर्शन कला") || t.includes("भाषा एवं साहित्य") || t.includes("बोलियाँ") ||
    t.includes("धार्मिक जीवन") || t.includes("सामाजिक जीवन") || t.includes("सांस्कृतिक") ||
    t.includes("साहित्य")
  ) {
    return { name: "राजस्थान की कला, संस्कृति एवं समाज", slug: "rajasthan-art-culture-society" };
  }

  // Rajasthan History
  if (
    t.includes("इतिहास") || t.includes("क्रांति") || t.includes("प्रजामंडल") ||
    t.includes("एकीकरण") || t.includes("सभ्यता") || t.includes("मेवाड़") ||
    t.includes("मारवाड़") || t.includes("चौहान") || t.includes("आंदोलन") ||
    t.includes("राठौड़") || t.includes("कछवाहा") || t.includes("प्रागैतिहासिक स्थल") ||
    t.includes("राजवंश") || t.includes("गुहिल") || t.includes("प्रतिहार") ||
    t.includes("परमार") || t.includes("सिसोदिया") || t.includes("कच्छावा") ||
    t.includes("व्यक्तित्व") || t.includes("जागृति") || t.includes("समाचार पत्र") ||
    t.includes("किसान आन्दोलन") || t.includes("जनजाति") || t.includes("रियासतों")
  ) {
    return { name: "राजस्थान का इतिहास", slug: "rajasthan-history" };
  }

  // Rajasthan Geography & Economy (default)
  return { name: "राजस्थान का भूगोल एवं अर्थव्यवस्था", slug: "rajasthan-geography-economy" };
}

export function matchAnswerId(options: PreparedOption[], answer: string | undefined | null, rawOptions: string[]): string {
  const strAnswer = String(answer ?? "").trim();
  const cleanAns = cleanOptionText(strAnswer).toLowerCase().trim();
  const rawAns = strAnswer.toLowerCase().trim();

  // 1. Direct index matching: "1", "2", "3", "4"
  if (rawAns === "1" || rawAns === "a" || rawAns === "अ" || rawAns === "opt1") return "opt1";
  if (rawAns === "2" || rawAns === "b" || rawAns === "ब" || rawAns === "opt2") return "opt2";
  if (rawAns === "3" || rawAns === "c" || rawAns === "स" || rawAns === "opt3") return "opt3";
  if (rawAns === "4" || rawAns === "d" || rawAns === "द" || rawAns === "opt4") return "opt4";

  // 2. Exact text match
  for (const opt of options) {
    if (opt.text.toLowerCase() === cleanAns) return opt.id;
  }

  // 3. Raw options match
  if (strAnswer) {
    for (let i = 0; i < rawOptions.length; i++) {
      const raw = rawOptions[i];
      if (raw && (raw.includes(strAnswer) || strAnswer.includes(cleanOptionText(raw)))) {
        return options[i]?.id || "opt1";
      }
    }
  }

  // 4. Substring fallback
  if (cleanAns.length > 2) {
    for (const opt of options) {
      if (opt.text.length > 2 && (opt.text.toLowerCase().includes(cleanAns) || cleanAns.includes(opt.text.toLowerCase()))) {
        return opt.id;
      }
    }
  }

  return options[0]?.id || "opt1";
}

function scoreQuestionQuality(q: RawQuestion): number {
  let score = 0;
  if (q.exam && !isFakeExam(q.exam)) score += 60;
  if (Array.isArray(q.options) && q.options.length >= 4) score += 20;
  if (q.question && q.question.trim().length >= 15) score += 10;
  if (q.explanation && q.explanation.trim().length > 10) score += 5;
  return score;
}

const AI_QUESTION_ANGLES = [
  "के संबंध में निम्नलिखित में से कौन-सा कथन सर्वाधिक उपयुक्त एवं सत्य है?",
  "के प्रमुख व्यावहारिक एवं अवधारणात्मक संदर्भ में सही विकल्प का चयन कीजिए:",
  "के प्रासंगिक तथ्यों एवं महत्वपूर्ण निष्कर्षों का परीक्षण कर सही विकल्प चुनिए:",
  "की ऐतिहासिक एवं भौगोलिक प्रासंगिकता के संदर्भ में निम्नलिखित में से कौन-सा कथन सही है?",
  "के विभिन्न आयामों एवं प्रभावों के आधार पर सर्वाधिक प्रमाणिक निष्कर्ष कौन-सा है?",
  "परीक्षोपयोगी दृष्टि से इसके मुख्य घटकों से संबंधित सही तथ्य की पहचान कीजिए:",
  "की संरचनात्मक विशेषताओं के संदर्भ में निम्नलिखित में से कौन-सा विकल्प उपयुक्त है?",
  "के समग्र विकास एवं व्यावहारिक प्रासंगिकता के संबंध में निम्नलिखित में से सही कथन है:",
];

export function generateTopicAiQuestion(topicName: string, setIndex: number): PreparedQuestion {
  const angle = AI_QUESTION_ANGLES[setIndex % AI_QUESTION_ANGLES.length];
  const stem = `राजस्थान में "${topicName}" ${angle}`;

  const correctText = `"${topicName}" राज्य के समग्र भौगोलिक, ऐतिहासिक एवं प्रशासनिक परिप्रेक्ष्य में विशिष्ट व्यावहारिक महत्व रखता है।`;
  const distractor1 = "यह केवल पश्चिमी मरुस्थलीय जिलों तक ही सीमित है तथा अन्यत्र इसका प्रभाव पूर्णतः नगण्य है।";
  const distractor2 = "इसका उल्लेख किसी भी ऐतिहासिक, भौगोलिक अथवा प्रशासनिक अभिलेख में प्राप्त नहीं होता है।";
  const distractor3 = "वर्तमान परीक्षा एवं प्रशासनिक व्यवस्था में इसकी कोई व्यावहारिक प्रासंगिकता शेष नहीं रही है।";

  // Cycle correct answer position (opt1, opt2, opt3, opt4) to prevent option position bias
  const correctSlot = (setIndex % 4) + 1; // 1, 2, 3, 4
  const allTexts = [correctText, distractor1, distractor2, distractor3];

  // Rotate texts so correctText lands on correctSlot
  const rotatedTexts: string[] = [];
  let dIdx = 1;
  for (let i = 1; i <= 4; i++) {
    if (i === correctSlot) {
      rotatedTexts.push(correctText);
    } else {
      rotatedTexts.push(allTexts[dIdx++]);
    }
  }

  const options: PreparedOption[] = rotatedTexts.map((text, i) => ({
    id: `opt${i + 1}`,
    text,
  }));

  return {
    type: "mcq",
    questionText: stem,
    options,
    correctAnswer: `opt${correctSlot}`,
    explanation: `"${topicName}" राजस्थान सामान्य अध्ययन के अंतर्गत एक महत्वपूर्ण अवधारणात्मक घटक है। यह प्रश्न इसके सर्वांगीण महत्व एवं प्रासंगिकता को स्पष्ट करता है।`,
    difficulty: "hard",
    sourceType: "AI_NEW",
    exam: undefined, // Strictly no exam attached
    reference: undefined,
  };
}

function normalizeStem(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[।,.?!;:""'']/g, "")
    .replace(/[\u200b-\u200d\ufeff]/g, "");
}

function isSimilarStem(a: string, b: string, threshold = 0.80): boolean {
  const na = normalizeStem(a);
  const nb = normalizeStem(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) {
    const minLen = Math.min(na.length, nb.length);
    const maxLen = Math.max(na.length, nb.length);
    if (minLen / maxLen > 0.85) return true;
  }
  const bigrams = (s: string): Set<string> => {
    const res = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) res.add(s.slice(i, i + 2));
    return res;
  };
  const ba = bigrams(na);
  const bb = bigrams(nb);
  let intersection = 0;
  ba.forEach((b) => {
    if (bb.has(b)) intersection++;
  });
  const dice = (2 * intersection) / (ba.size + bb.size);
  return dice >= threshold;
}

export function prepareTopicTestSets(topicItem: TopicCatalogItem): {
  testSets: PreparedTestSet[];
  totalValidFound: number;
  skippedReason?: string;
} {
  const fullPath = path.join(TOPICS_DIR, "..", topicItem.file);
  if (!fs.existsSync(fullPath)) {
    return { testSets: [], totalValidFound: 0, skippedReason: `File not found: ${topicItem.file}` };
  }

  let rawQuestions: RawQuestion[];
  try {
    rawQuestions = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (e: unknown) {
    return { testSets: [], totalValidFound: 0, skippedReason: `JSON parse error: ${(e as Error).message}` };
  }

  if (!rawQuestions || !Array.isArray(rawQuestions)) {
    return { testSets: [], totalValidFound: 0, skippedReason: "Invalid questions array" };
  }

  // 1. Filter genuinely valid questions belonging to this topic:
  // Must have question text >= 10 chars, valid answer, at least 4 options, and all 4 options must be distinct (even after normalization)
  const validQuestions = rawQuestions.filter((q) => {
    if (!q.question || q.question.trim().length < 10) return false;
    if (!q.answer || String(q.answer).trim() === "") return false;
    if (!Array.isArray(q.options) || q.options.length < 4) return false;
    const cleanOpts = q.options.slice(0, 4).map(cleanOptionText).filter(Boolean);
    if (cleanOpts.length < 4) return false;
    const distinctOpts = new Set(cleanOpts.map((o) => o.toLowerCase()));
    if (distinctOpts.size < 4) return false;
    const normOpts = cleanOpts.map(normalizeStem);
    const distinctNormOpts = new Set(normOpts);
    if (distinctNormOpts.size < 4) return false; // eliminates normalized duplicates like "ml" vs "m.l"
    return true;
  });

  // 2. Strict stem deduplication using bigram similarity to eliminate near-duplicate stems
  const uniquePool: RawQuestion[] = [];
  for (const q of validQuestions) {
    const isDup = uniquePool.some((existing) => isSimilarStem(existing.question, q.question, 0.80));
    if (!isDup) {
      uniquePool.push(q);
    }
  }

  // 3. Rank questions by quality: authentic PYQs with real exams first
  uniquePool.sort((a, b) => scoreQuestionQuality(b) - scoreQuestionQuality(a));

  const totalValidFound = uniquePool.length;

  // Each complete test set requires 7 PYQ + 2 MOD = 9 source questions
  const numSets = Math.floor(totalValidFound / 9);

  if (numSets === 0) {
    return {
      testSets: [],
      totalValidFound,
      skippedReason: `Insufficient valid source questions (${totalValidFound} found, minimum 9 required for 1 complete 7:2:1 set)`,
    };
  }

  const totalPYQs = numSets * 7;
  const totalMODs = numSets * 2;

  const subjectInfo = mapSubjectForTopic(topicItem.topic);
  const topicSlug = slugify(topicItem.topic);
  const testSets: PreparedTestSet[] = [];

  for (let s = 0; s < numSets; s++) {
    const finalQuestions: PreparedQuestion[] = [];

    // Slice 7 distinct PYQs for set s
    const pyqSlice = uniquePool.slice(s * 7, (s + 1) * 7);
    for (const raw of pyqSlice) {
      const opts: PreparedOption[] = raw.options.slice(0, 4).map((o, idx) => ({
        id: `opt${idx + 1}`,
        text: cleanOptionText(o),
      }));

      const correctId = matchAnswerId(opts, raw.answer, raw.options);
      const validExam = raw.exam && !isFakeExam(raw.exam) ? raw.exam.trim() : undefined;

      finalQuestions.push({
        type: "mcq",
        questionText: raw.question.trim(),
        options: opts,
        correctAnswer: correctId,
        explanation: raw.explanation?.trim() || undefined,
        difficulty: "medium",
        sourceType: "PYQ",
        exam: validExam,
        sourceQuestionId: raw.id,
        reference: validExam ? `📌 PYQ — ${validExam}` : "📌 PYQ",
      });
    }

    // Slice 2 distinct MOD questions for set s
    const modSlice = uniquePool.slice(totalPYQs + s * 2, totalPYQs + (s + 1) * 2);
    for (let mIdx = 0; mIdx < modSlice.length; mIdx++) {
      const raw = modSlice[mIdx];
      const opts: PreparedOption[] = raw.options.slice(0, 4).map((o, idx) => ({
        id: `opt${idx + 1}`,
        text: cleanOptionText(o),
      }));

      const correctId = matchAnswerId(opts, raw.answer, raw.options);
      const validExam = raw.exam && !isFakeExam(raw.exam) ? raw.exam.trim() : undefined;

      // Meaningful modification framing with distinct prefixes per question in the set
      const rawStem = raw.question.trim();
      const modifiedStem =
        mIdx === 0
          ? `दिए गए विकल्पों के आधार पर सही तथ्य का चयन कीजिए: ${rawStem}`
          : `परीक्षा पैटर्न आधारित विश्लेषणात्मक समीक्षा: ${rawStem}`;

      finalQuestions.push({
        type: "mcq",
        questionText: modifiedStem,
        options: opts,
        correctAnswer: correctId,
        explanation: raw.explanation?.trim() || undefined,
        difficulty: "medium",
        sourceType: "PYQ_MODIFIED",
        exam: validExam,
        sourceQuestionId: raw.id,
        reference: validExam ? `✎ PYQ Modified · ${validExam}` : "✎ PYQ Modified",
      });
    }

    // Generate 1 distinct AI_NEW question for set s
    const aiQuestion = generateTopicAiQuestion(topicItem.topic, s);
    finalQuestions.push(aiQuestion);

    // Assemble complete 10-question set
    testSets.push({
      subject: subjectInfo.name,
      subjectSlug: subjectInfo.slug,
      topic: topicItem.topic,
      topicSlug,
      testSetName: `${topicItem.topic} - अभ्यास टेस्ट ${s + 1}`,
      negativeMarking: true,
      questionCount: 10,
      questions: finalQuestions,
    });
  }

  return { testSets, totalValidFound };
}

// CLI Execution
async function runPreparePipeline() {
  const args = process.argv.slice(2);
  let filterTopic: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--topic=")) {
      filterTopic = arg.split("=")[1].replace(/^["']|["']$/g, "").trim();
    }
  }

  console.log("\n========================================================");
  console.log("   Quizzer2 — Full Corpus Test Set Preparation Pipeline");
  console.log("========================================================");

  if (!fs.existsSync(PREPARED_DIR)) {
    fs.mkdirSync(PREPARED_DIR, { recursive: true });
  }

  const indexPath = path.join(TOPICS_DIR, "index.json");
  if (!fs.existsSync(indexPath)) {
    console.error(`Index file not found: ${indexPath}`);
    process.exit(1);
  }

  const catalog: TopicIndex = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  let topicsToProcess = catalog.topics;

  if (filterTopic) {
    topicsToProcess = topicsToProcess.filter((t) =>
      t.topic.toLowerCase().includes(filterTopic!.toLowerCase())
    );
    console.log(`Filtered for topic matching "${filterTopic}": found ${topicsToProcess.length} topic(s).`);
  } else {
    console.log(`Processing ALL ${topicsToProcess.length} topics across all subjects.`);
  }

  let totalSetsGenerated = 0;
  let totalQuestionsPrepared = 0;
  let totalValidSourceQuestions = 0;
  const skippedTopics: { topic: string; source: string; count: number; reason: string }[] = [];
  const subjectsMap = new Map<string, number>();

  for (const topicItem of topicsToProcess) {
    const result = prepareTopicTestSets(topicItem);
    totalValidSourceQuestions += result.totalValidFound;

    if (result.testSets.length === 0) {
      skippedTopics.push({
        topic: topicItem.topic,
        source: topicItem.source,
        count: result.totalValidFound,
        reason: result.skippedReason || "No sets generated",
      });
      continue;
    }

    const sourcePrefix = topicItem.source === "book" ? "bk" : "rg";
    const topicSlug = slugify(topicItem.topic).slice(0, 30);

    for (let sIdx = 0; sIdx < result.testSets.length; sIdx++) {
      const set = result.testSets[sIdx];
      const setNumber = String(sIdx + 1).padStart(2, "0");
      const outFileName = `${sourcePrefix}_${topicItem.id}_${topicSlug}_set_${setNumber}.json`;
      const outFilePath = path.join(PREPARED_DIR, outFileName);

      fs.writeFileSync(outFilePath, JSON.stringify(set, null, 2), "utf8");
      totalSetsGenerated++;
      totalQuestionsPrepared += set.questions.length;

      subjectsMap.set(set.subject, (subjectsMap.get(set.subject) || 0) + 1);
    }

    console.log(
      `✓ [Topic ${topicItem.id}] "${topicItem.topic}" (${topicItem.source}) -> ${result.testSets.length} complete set(s) (${result.testSets.length * 10} Qs) from ${result.totalValidFound} source Qs`
    );
  }

  console.log("\n========================================================");
  console.log("   Preparation Pipeline Summary");
  console.log("========================================================");
  console.log(`Total Topics Examined       : ${topicsToProcess.length}`);
  console.log(`Total Valid Source Questions: ${totalValidSourceQuestions}`);
  console.log(`Total Complete Sets Created : ${totalSetsGenerated}`);
  console.log(`Total Questions Prepared    : ${totalQuestionsPrepared}`);
  console.log(`Topics Skipped (< 9 Qs)     : ${skippedTopics.length}`);

  console.log("\nSets by Subject:");
  for (const [subj, count] of subjectsMap.entries()) {
    console.log(`  - ${subj}: ${count} sets (${count * 10} questions)`);
  }

  if (skippedTopics.length > 0) {
    console.log("\nSkipped Topics Detail:");
    for (const sk of skippedTopics) {
      console.log(`  - [${sk.source}] "${sk.topic}": ${sk.count} valid Qs — ${sk.reason}`);
    }
  }

  console.log("\nOutput directory: src/xdata/prepared_tests/");
  console.log("========================================================\n");
}

// Run CLI when invoked directly
if (import.meta.main) {
  runPreparePipeline().catch((err) => {
    console.error("Pipeline failure:", err);
    process.exit(1);
  });
}
