import fs from "fs";
import path from "path";
import { RAJASTHAN_MASTER_TOPICS } from "./master_topic_definitions";

const ROOT_DIR = path.resolve(__dirname, "../../..");
const NEW20_DIR = path.join(ROOT_DIR, "src/xdata/new20batches");
const OUTPUT_DIR = path.join(ROOT_DIR, "src/xdata/master_audit");

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface RawQuestion {
  id: number;
  subject?: string;
  topic?: string;
  originalTopic?: string;
  question: string;
  options: string[];
  answer: string;
  exam?: string;
  explanation?: string;
  year?: number | string;
}

export interface ConvexOption {
  id: "opt1" | "opt2" | "opt3" | "opt4";
  text: string;
}

export interface FinalMasterQuestion {
  id: string; // e.g. "QZ-RAJ-00001"
  type: "mcq";
  questionText: string;
  options: ConvexOption[];
  correctAnswer: "opt1" | "opt2" | "opt3" | "opt4";
  explanation?: string;
  reference?: string;
  difficulty: "easy" | "medium" | "hard";
  order: number;
  meta: {
    sourceType: "PYQ";
    sourceQuestionId: number;
    exam?: string;
    year?: number | null;
    originalTopic?: string;
    factClusterId: string;
  };
  masterTopicId: number;
  masterTopic: string;
  section: string;
}

export type AuditDecision = "KEEP" | "REPAIR" | "REMOVE" | "UNCERTAIN";

export interface QuestionAuditRecord {
  originalId: number;
  sourceIndex: number;
  sourceType: "PYQ";
  sourceTopic: string;
  masterTopicId: number;
  masterTopic: string;
  exam?: string;
  year?: number | null;
  questionText: string;
  decision: AuditDecision;
  reason: string;
  duplicateOf?: number;
  factClusterId: string;
  questionStatus: "VALID" | "REPAIRED" | "CORRUPTED" | "CANCELLED" | "OUT_OF_SCOPE";
  optionsStatus: "VALID" | "REPAIRED" | "MALFORMED" | "DUPLICATE";
  answerStatus: "MATCHED" | "REPAIRED_MATCH" | "UNMATCHED" | "CANCELLED";
  explanationStatus: "PRESENT" | "SHORT" | "MISSING";
  languageStatus: "CLEAN" | "REPAIRED";
  pyqStatus: "AUTHENTIC" | "PYQ_AUTHENTICITY_UNCERTAIN";
  repairStatus: "NONE" | "REPAIRED";
  currentnessStatus: "STATIC_RELEVANT" | "REMOVAL_CANDIDATE";
}

export interface RepairedQuestionRecord {
  originalId: number;
  originalQuestion: string;
  repairedQuestion: string;
  originalOptions: string[];
  repairedOptions: string[];
  originalAnswer: string;
  repairedAnswer: string;
  repairNotes: string[];
}

export interface RemovedQuestionRecord {
  originalId: number;
  sourceTopic: string;
  questionText: string;
  exam?: string;
  year?: number | null;
  reason: string;
  removedBecause:
    | "EXCLUDED_TOPIC"
    | "OUT_OF_SCOPE"
    | "CANCELLED_OR_BONUS"
    | "CORRUPTED_OR_SHORT"
    | "INVALID_OPTIONS"
    | "UNMATCHED_ANSWER"
    | "DUPLICATE_OPTIONS"
    | "EXACT_DUPLICATE"
    | "SEMANTIC_DUPLICATE";
  duplicateOf?: number;
  factClusterId?: string;
}

export interface CheckpointState {
  totalQuestions: number;
  completed: number;
  pending: number;
  lastCompletedIndex: number;
  lastCompletedId: number;
  status: "IN_PROGRESS" | "COMPLETED" | "PAUSED";
  timestamp: string;
}

// ─── Fast Lookups ────────────────────────────────────────────────────────────

const masterById = new Map<number, { id: number; section: string; title: string }>();
const masterByTitle = new Map<string, { id: number; section: string; title: string }>();

RAJASTHAN_MASTER_TOPICS.forEach((m) => {
  masterById.set(m.id, m);
  masterByTitle.set(m.title, m);
  masterByTitle.set(m.title.replace("/", "_"), m);
  masterByTitle.set(m.title.replace("_", "/"), m);
});

// ─── Text Normalization & Semantic Similarity Utilities ──────────────────────

export function cleanStem(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\u0900-\u097Fa-z0-9]/g, "")
    .trim();
}

/** Strips generic competitive-exam boilerplate stop-phrases for high-precision semantic matching */
export function stripStopPhrases(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(
      /निम्नलिखित में से|निम्नांकित में से|इनमें से कौन-सा|इनमें से कौन सा|इनमें से कौनसा|सुमेलित कीजिए|सही सुमेलित नहीं है|सही कथन चुनिए|कहाँ स्थित है|कहाँ पर स्थित है|किस स्थान पर स्थित है|किस जिले में स्थित है|किस जिले में है|का संबंध किससे है|की स्थापना कब हुई|के संस्थापक कौन थे|के संस्थापक कौन था/g,
      " "
    )
    .replace(/[^\u0900-\u097Fa-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract substantive tokens (length >= 3) for content token overlap calculation */
export function extractContentTokens(text: string): Set<string> {
  const stripped = stripStopPhrases(text);
  const words = stripped.split(" ").filter((w) => w.length >= 3);
  return new Set(words);
}

/** Token Jaccard overlap */
export function tokenOverlap(s1: string, s2: string): number {
  const t1 = extractContentTokens(s1);
  const t2 = extractContentTokens(s2);
  if (t1.size === 0 || t2.size === 0) return 0;
  let inter = 0;
  t1.forEach((tok) => {
    if (t2.has(tok)) inter++;
  });
  return (2 * inter) / (t1.size + t2.size);
}

/** Bigram-based Dice similarity on stripped stems */
export function similarity(s1: string, s2: string): number {
  const a = stripStopPhrases(s1).replace(/\s+/g, "");
  const b = stripStopPhrases(s2).replace(/\s+/g, "");
  if (a === b && a.length > 0) return 1.0;
  if (a.length < 3 || b.length < 3) return 0;
  const setA = new Set<string>();
  const setB = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) setA.add(a.slice(i, i + 2));
  for (let i = 0; i < b.length - 1; i++) setB.add(b.slice(i, i + 2));
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  setA.forEach((x) => {
    if (setB.has(x)) inter++;
  });
  return (2 * inter) / (setA.size + setB.size);
}

function isFakeExam(str?: string | null): boolean {
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

export function extractYear(exam?: string): number | null {
  if (!exam) return null;
  const m = exam.match(/20(1[5-9]|2[0-6])/);
  return m ? parseInt("20" + m[1]) : null;
}

export function scoreQuestion(q: RawQuestion): number {
  let score = 0;
  const year = extractYear(q.exam);
  if (year) score += (year - 2014) * 10; // Recency priority (2026=120, 2025=110, ...)
  if (!isFakeExam(q.exam)) score += 50; // Authentic provenance
  if (q.explanation && q.explanation.trim().length > 25) score += 25;
  if (q.explanation) score += Math.min(q.explanation.trim().length / 40, 15);
  const qText = q.question || "";
  if (/\s/.test(qText)) score += 5;
  if (/rpsc|कर्मचारी चयन|अधीनस्थ सेवा|पटवार|कांस्टेबल|व्याख्याता|ras|reet|cet|vdo/i.test(q.exam || "")) score += 20;
  return score;
}

export function cleanQuestionText(text: string): { cleaned: string; repaired: boolean; notes: string[] } {
  let s = text || "";
  const notes: string[] = [];
  let repaired = false;

  if (/[\u200B-\u200D\uFEFF]/.test(s)) {
    s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
    notes.push("Removed zero-width characters");
    repaired = true;
  }

  // Remove leading numbers like "14. " or "प्र.3:"
  const strippedNum = s.replace(/^(प्र\.\s*\d+[:.]?|\d+[\.:\)]\s*|Q\.\s*\d+[:.]?\s*)/i, "");
  if (strippedNum !== s) {
    notes.push("Stripped leading question number/label");
    s = strippedNum;
    repaired = true;
  }

  // Fix merged words between digits and Hindi
  const fixedMerged = s.replace(/([\u0900-\u097F])(\d)/g, "$1 $2").replace(/(\d)([\u0900-\u097F])/g, "$1 $2");
  if (fixedMerged !== s) {
    notes.push("Fixed merged digit-Hindi spacing");
    s = fixedMerged;
    repaired = true;
  }

  // Collapse multiple whitespace
  const fixedWs = s.replace(/\s{2,}/g, " ").trim();
  if (fixedWs !== s) {
    notes.push("Collapsed multiple whitespace");
    s = fixedWs;
    repaired = true;
  }

  return { cleaned: s, repaired, notes };
}

export function cleanOptionText(opt: string): string {
  if (!opt) return "";
  let s = opt;
  s = s
    .replace(/^[\s]*\([\s]*[अबसदa-dA-D1-4][\s]*\)[\s]+/, "")
    .replace(/^[\s]*\[[\s]*[अबसदa-dA-D1-4][\s]*\][\s]+/, "")
    .replace(/^[\s]*[a-dA-D1-4][\s]*[.):][\s]+/, "")
    .replace(/^[\s]*[अबसद][\s]*[.):][\s]+/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
  return s;
}

// ─── Semantic Master Topic & Removal Classifier ──────────────────────────────

export function classifyQuestion(raw: RawQuestion): {
  masterTopicId: number;
  masterTopic: string;
  section: string;
  isRemovalCandidate: boolean;
  removalReason?: string;
} {
  const t = (raw.topic || "").trim();
  const qText = (raw.question || "").trim();
  const exp = (raw.explanation || "").trim();
  const full = (t + " " + qText + " " + exp).toLowerCase();

  // 1. Part 4: Removal Candidate Topics
  if (/सरकारी योजना|कल्याणकारी योजना|चिरंजीवी|पेंशन योजना|इंदिरा रसोई|योजनाएँ एवं बजट|योजनाएं/i.test(t) && !/सिंचाई परियोजना/.test(t)) {
    return { masterTopicId: -1, masterTopic: "राजस्थान की सरकारी योजनाएँ", section: "EXCLUDED", isRemovalCandidate: true, removalReason: "Part 4: सरकारी योजनाएँ (Excluded Topic)" };
  }
  if (/लोक सेवा गारंटी/i.test(t) || /लोक सेवा गारंटी अधिनियम/i.test(qText)) {
    return { masterTopicId: -2, masterTopic: "राजस्थान लोक सेवा गारंटी अधिनियम 2011", section: "EXCLUDED", isRemovalCandidate: true, removalReason: "Part 4: लोक सेवा गारंटी अधिनियम 2011" };
  }
  if (/एक जिला एक उत्पाद|odop/i.test(t) || /एक जिला एक उत्पाद/i.test(qText)) {
    return { masterTopicId: -3, masterTopic: "One District One Product (ODOP)", section: "EXCLUDED", isRemovalCandidate: true, removalReason: "Part 4: One District One Product (ODOP)" };
  }
  if (/प्रतीक चिन्ह|राज्य प्रतीक/i.test(t)) {
    return { masterTopicId: -4, masterTopic: "राजस्थान के प्रतीक चिन्ह", section: "EXCLUDED", isRemovalCandidate: true, removalReason: "Part 4: प्रतीक चिन्ह" };
  }
  if (/^शिक्षा$|राजस्थान में शिक्षा/i.test(t) && !/ व्यक्तित्व|आंदोलन/.test(full)) {
    return { masterTopicId: -5, masterTopic: "राजस्थान में शिक्षा", section: "EXCLUDED", isRemovalCandidate: true, removalReason: "Part 4: शिक्षा" };
  }
  if (/बजट 2025-26|बजट 2026-27/i.test(qText) || /बजट 2025-26/i.test(t)) {
    return { masterTopicId: -6, masterTopic: "राजस्थान बजट 2025-26", section: "EXCLUDED", isRemovalCandidate: true, removalReason: "Part 4: बजट 2025-26 / 2026-27 (Volatile annual budget)" };
  }
  if (/आर्थिक सर्वेक्षण 2024-25|आर्थिक समीक्षा 2024-25|आर्थिक समीक्षा 2025-26/i.test(full)) {
    return { masterTopicId: -8, masterTopic: "राजस्थान आर्थिक सर्वेक्षण", section: "EXCLUDED", isRemovalCandidate: true, removalReason: "Part 4: आर्थिक सर्वेक्षण (Volatile annual review)" };
  }
  if (/सांस्कृतिक कार्यक्रम स्थल/i.test(t)) {
    return { masterTopicId: -11, masterTopic: "Cultural Program Venues", section: "EXCLUDED", isRemovalCandidate: true, removalReason: "Part 4: सांस्कृतिक कार्यक्रम स्थल" };
  }
  if (/क्षेत्रीय कार्यक्रम/i.test(t)) {
    return { masterTopicId: -12, masterTopic: "Regional Programs", section: "EXCLUDED", isRemovalCandidate: true, removalReason: "Part 4: क्षेत्रीय कार्यक्रम" };
  }

  // Pure Federal Polity without Rajasthan context (Central Executive)
  if (
    !/राजस्थान|राज्यपाल|उच्च न्यायालय|राष्ट्रपति शासन|एनजीटी|74 वें|स्थानीय स्वशासन/i.test(qText) &&
    (/भारत का राष्ट्रपति|भारत के राष्ट्रपति|राष्ट्रपति के निर्वाचन|राष्ट्रपति अपना त्याग-पत्र|राष्ट्रपति अपना त्यागपत्र|राष्ट्रपति पर महाभियोग|उप-राष्ट्रपति|प्रधानमंत्री का चयन|अनुच्छेद 123 में राष्ट्रपति|अनुच्छेद 87 के अन्तर्गत भारत का राष्ट्रपति|अनुच्छेद 103 के तहत, राष्ट्रपति|अनुच्छेद 56|अनुच्छेद 61|कार्यवाहक राष्ट्रपति|निर्विरोध उपराष्ट्रपति/i.test(
      qText
    ) ||
      /राष्ट्रपति की शक्ति 'नहीं है'|राष्ट्रपति के निर्वाचन सम्बन्धी विवाद/i.test(qText) ||
      (/उपराष्ट्रपति/i.test(qText) && /निर्वाचित|नियुक्त/i.test(qText)))
  ) {
    return { masterTopicId: -99, masterTopic: "संघीय कार्यपालिका (भारतीय राजव्यवस्था)", section: "EXCLUDED", isRemovalCandidate: true, removalReason: "Scope Violation: Pure Federal Polity (Union Executive), not Rajasthan State Administration" };
  }

  // 2. Authoritative 73 Rajasthan Master Topics Semantic Routing

  // B. Section B: Idioms & Sobriquets (35 & 36)
  if (/मुहावरा|कहावत|लोकोक्ति|मुहावरे का अर्थ/i.test(qText)) {
    const m = masterById.get(35)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/गुलाबी नगरी|सूर्य नगरी|स्वर्ण नगरी|झीलों की नगरी|सौ द्वीपों का शहर|थार का घड़ा|राजस्थान का सिंहद्वार|राजस्थान का हृदय|का उपनाम|के नाम से भी जाना जाता है/i.test(qText)) {
    const m = masterById.get(36)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }

  // A. Section A: Desertification (12)
  if (/मरुस्थलीकरण|मरु प्रसार|काजरी|afri|सूखा एवं अकाल|डेजर्टिफिकेशन/i.test(qText)) {
    const m = masterById.get(12)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }

  // A. Section A: Districts & Divisions (4)
  if (/संभाग पुनर्गठन|जिले एवं संभाग|संभाग में कितने जिले|नवीनतम संभाग|नवीन जिला|नवीनतम जिला|क्षेत्रफल की दृष्टि से सबसे बड़ा जिला|क्षेत्रफल में सबसे छोटा जिला/i.test(qText)) {
    const m = masterById.get(4)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }

  // E. Section E: Governor (59) vs Chief Minister (60) vs Council (61) vs Legislature (62)
  if (/मुख्यमंत्री|chief minister/i.test(qText) && !/राज्यपाल/.test(qText) && !/मंत्रिपरिषद/.test(qText)) {
    const m = masterById.get(60)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/राज्यपाल|governor/i.test(qText) && !/एकीकरण|1857|राष्ट्रपति शासन लागू/i.test(qText) && /अनुच्छेद 15|अनुच्छेद 16|राज्यपाल की|राज्यपाल को|राज्यपाल का|राज्यपाल द्वारा|राज्यपाल पद|कार्यकाल|शपथ|स्वविवेक|अध्यादेश/i.test(full)) {
    const m = masterById.get(59)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/उच्च न्यायालय|चीफ जस्टिस|मुख्य न्यायाधीश|न्यायाधीश|अधीनस्थ न्यायालय|जोधपुर पीठ|जयपुर खंडपीठ/i.test(qText)) {
    const m = masterById.get(63)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/जिला कलेक्टर|जिलाधीश|जिला मजिस्ट्रेट|उपखंड अधिकारी|एसडीएम|तहसीलदार|पटवारी|जिला प्रशासन/i.test(qText) && !/पंचायती/.test(qText)) {
    const m = masterById.get(64)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/पंचायती राज|ग्राम सभा|73 वां|74 वें|स्थानीय स्वशासन|नगर पालिका|नगर निगम|सरपंच|वार्ड पंच/i.test(full)) {
    const m = masterById.get(65)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/rpsc|लोक सेवा आयोग/i.test(full)) {
    const m = masterById.get(66)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/राज्य निर्वाचन आयोग/i.test(full)) {
    const m = masterById.get(67)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/मानवाधिकार आयोग/i.test(full)) {
    const m = masterById.get(68)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/महिला आयोग/i.test(full)) {
    const m = masterById.get(69)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/लोकायुक्त/i.test(full)) {
    const m = masterById.get(70)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/राजस्व मंडल|वित्त आयोग|संवैधानिक आयोग/i.test(full)) {
    const m = masterById.get(71)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/विधानसभा|विधानमंडल|विधान परिषद/i.test(full)) {
    const m = masterById.get(62)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/मंत्रिपरिषद|मंत्रिमंडल/i.test(full)) {
    const m = masterById.get(61)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }

  // B. Section B: Folk Deities vs Saints (28 vs 29)
  if (
    /रामदेव|तेजाजी|पाबूजी|गोगाजी|करणी माता|शीतला माता|जीण माता|हड़बूजी|मेहाजी|मल्लीनाथ|देवनारायण|कैला देवी|शीला देवी|लोक देवता|लोक देवी|पंचपीर|बाणमाता|आवड़ माता|तनोट|भूरिया बाबा/i.test(
      full
    ) &&
    !/प्रजामंडल|1857|एकीकरण/.test(full)
  ) {
    const m = masterById.get(28)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/दादू दयाल|जांभोजी|जसनाथ|चरणदासी|लालदासी|रामस्नेही|मीराबाई|वल्लभ संप्रदाय|विश्नोई संप्रदाय|निम्बार्क|नाथ संप्रदाय|ख्वाजा मोईनुद्दीन/i.test(full)) {
    const m = masterById.get(29)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }

  // A. Section A: Water resources (Lakes 8, Irrigation 9, Traditional 20, Rivers 7)
  if (/झील|सांभर|जयसमंद|राजसमंद|पिछोला|आनासागर|नक्की|सिलीसेढ़|डीडवाना|पचपदरा/i.test(qText) && !/सिंचाई|बाँध|बांध/.test(qText)) {
    const m = masterById.get(8)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/सिंचाई परियोजना|नहर|आईजीएनपी|ignp|बीसलपुर परियोजना|बाँध|बांध|कमांड एरिया|मेजा बाँध/i.test(qText)) {
    const m = masterById.get(9)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/पारंपरिक जल|बावड़ी|झालरा|नाडी|टांका|टोबा|खड़ीन|जल संरक्षण तकनीक/i.test(qText) && !/दुर्ग|किला/.test(qText)) {
    const m = masterById.get(20)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/नदी|अपवाह|सहायक नदी|उद्गम|चंबल|बनास|लूनी|माही|साबरमती|कांतली|घग्घर|त्रिवेणी संगम/i.test(qText) || /नदियाँ एवं जल/.test(t)) {
    const m = masterById.get(7)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }

  // A. Section A: Forests (10) vs Sanctuaries (11)
  if (/अभयारण्य|राष्ट्रीय उद्यान|टाइगर रिजर्व|बायोलॉजिकल पार्क|रामगढ़ विषधारी|रणथंभौर राष्ट्रीय|सरिस्का अभयारण्य|केवलादेव राष्ट्रीय|मुकुंदरा हिल्स|ताल छापर/i.test(qText)) {
    const m = masterById.get(11)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/वन रिपोर्ट|आरक्षित वन|संरक्षित वन|खेजड़ी|रोहिड़ा|वनस्पति|धौकड़ा/i.test(full) || /वन एवं वन्यजीव/.test(t)) {
    const m = masterById.get(10)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }

  // C. Section C: Dynasties & Medieval History
  if (/बप्पा रावल|खुमाण|हम्मीर देव सिसोदिया|राणा कुंभा|राणा सांगा|महाराणा प्रताप|अमर सिंह|राणा राज सिंह|गुहिल वंश|सिसोदिया/i.test(qText) && !/प्रजामंडल|एकीकरण/.test(qText)) {
    const m = masterById.get(41)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/दूल्हा राय|भारमल|भगवंत दास|मानसिंह|मिर्जा राजा जयसिंह|सवाई जयसिंह|ईश्वरी सिंह|माधव सिंह|कछवाहा/i.test(qText) && !/प्रजामंडल|एकीकरण/.test(qText)) {
    const m = masterById.get(42)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/अजयराज|अर्णोराज|विग्रहराज|पृथ्वीराज चौहान|कान्हड़देव|हम्मीर देव चौहान|नाडोल|रणथंभौर के चौहान|जालौर के चौहान/i.test(qText) && !/प्रजामंडल|एकीकरण/.test(qText)) {
    const m = masterById.get(43)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/हरिश्चंद्र|नागभट्ट|वत्सराज|मिहिर भोज|महेंद्रपाल|गुर्जर प्रतिहार|मंडोर के प्रतिहार/i.test(qText)) {
    const m = masterById.get(44)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/राव सीहा|राव जोधा|राव बीका|राव मालदेव|राव चंद्रसेन|रायसिंह|जसवंत सिंह|दुर्गादास राठौड़|राठौड़ वंश/i.test(qText) && !/प्रजामंडल|एकीकरण/.test(qText)) {
    const m = masterById.get(45)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/भाटी राजवंश|जैसलमेर के भाटी|यादव राजवंश|करौली के यादव|जाट राजवंश|भरतपुर के जाट|सूरजमल|बदन सिंह|हाड़ा चौहान|झाला राजवंश/i.test(qText)) {
    const m = masterById.get(46)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/जागीरदारी|सामंती व्यवस्था|पट्टा रेख|रेख|भरत कर|दीवान|बख्शी|हाकिम|मध्यकालीन शासन प्रणाली/i.test(qText)) {
    const m = masterById.get(48)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }

  // B. Section B: Architecture Rule (Forts, palaces, havelis, stepwells, temples -> 25)
  if (/किला|दुर्ग|महल|हवेली|छतरी|बावड़ी|मंदिर स्थापत्य|वास्तुकला|चित्रशाला/i.test(qText) && !/चित्रकला शैलियाँ/.test(t)) {
    const m = masterById.get(25)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }

  // D. Section D: Modern & Freedom Movement
  if (/1857/i.test(full)) {
    const m = masterById.get(49)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/किसान आंदोलन|बिजौलिया|बेगूं|बूंदी किसान|नीमूचाणा|जनजातीय आंदोलन|भगत आंदोलन|गोविंद गिरि|मोतीलाल तेजावत|एकी आंदोलन|मीणा आंदोलन/i.test(full)) {
    const m = masterById.get(50)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/प्रजामंडल/i.test(full)) {
    const m = masterById.get(51)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/सेवा संघ|वीर भारत सभा|हितकारिणी सभा|स्वतंत्रता आंदोलन के संगठन/i.test(full)) {
    const m = masterById.get(52)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/एकीकरण/i.test(full)) {
    const m = masterById.get(54)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/जानकी देवी बजाज|रतन शास्त्री|कालीबाई|नारायणी देवी|रमा देवी|किशोरी देवी|अंजना देवी/i.test(qText) || /महिला व्यक्तित्व/.test(t)) {
    const m = masterById.get(56)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }
  if (/प्रेस|पत्रकारिता|समाचार पत्र/i.test(full)) {
    const m = masterById.get(57)!;
    return { masterTopicId: m.id, masterTopic: m.title, section: m.section, isRemovalCandidate: false };
  }

  // Direct Match by Folder / Topic Name fallback
  const matched = masterByTitle.get(t);
  if (matched) {
    return { masterTopicId: matched.id, masterTopic: matched.title, section: matched.section, isRemovalCandidate: false };
  }

  // Fallback to Topic 1 (General GK)
  const def = masterById.get(1)!;
  return { masterTopicId: def.id, masterTopic: def.title, section: def.section, isRemovalCandidate: false };
}

// ─── Substantive Candidate & Cluster Types ────────────────────────────────────

interface CandidateQuestion {
  raw: RawQuestion;
  audit: QuestionAuditRecord;
  cleanText: string;
  cleanOptions: ConvexOption[];
  correctAnswer: "opt1" | "opt2" | "opt3" | "opt4";
  score: number;
  year: number | null;
  masterTopicId: number;
  answerNormalized: string;
}

interface FactCluster {
  clusterId: string;
  representative: CandidateQuestion;
  duplicates: { candidate: CandidateQuestion; sim: number; isExact: boolean }[];
}

// ─── Main Pipeline Execution ──────────────────────────────────────────────────

async function runMasterCleaningPipeline() {
  console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║  QUIZZER — FINAL RAJASTHAN PYQ MASTER CLEANING & AUDIT PIPELINE      ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ── Step 1: Load All Raw Questions from new20batches ──
  console.log("📦 Loading raw questions from src/xdata/new20batches/...");
  const topicDirs = fs
    .readdirSync(NEW20_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, "hi"));

  const allRawQuestions: RawQuestion[] = [];
  const seenIds = new Set<number>();

  for (const tDir of topicDirs) {
    const tPath = path.join(NEW20_DIR, tDir.name);
    const files = fs.readdirSync(tPath).filter((f) => f.endsWith(".json")).sort();
    for (const f of files) {
      const items: RawQuestion[] = JSON.parse(fs.readFileSync(path.join(tPath, f), "utf8"));
      if (Array.isArray(items)) {
        for (const item of items) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allRawQuestions.push(item);
          }
        }
      }
    }
  }

  const totalInputQuestions = allRawQuestions.length;
  console.log(`✅ Total unique raw questions loaded: ${totalInputQuestions}`);

  // ── Step 2: Individual Question QA, Repair, and Classification ──
  console.log("\n🔍 Running deep individual QA, repair, and semantic classification...");

  const auditRecords: QuestionAuditRecord[] = [];
  const repairedRecords: RepairedQuestionRecord[] = [];
  const removedRecords: RemovedQuestionRecord[] = [];
  const validCandidates: CandidateQuestion[] = [];

  for (let idx = 0; idx < allRawQuestions.length; idx++) {
    const raw = allRawQuestions[idx];
    const sourceTopic = (raw.topic || "").trim();

    // Classification
    const cls = classifyQuestion(raw);
    const year = extractYear(raw.exam);

    // Initial audit stub
    const audit: QuestionAuditRecord = {
      originalId: raw.id,
      sourceIndex: idx + 1,
      sourceType: "PYQ",
      sourceTopic,
      masterTopicId: cls.masterTopicId,
      masterTopic: cls.masterTopic,
      exam: raw.exam?.trim() || undefined,
      year,
      questionText: raw.question || "",
      decision: "KEEP",
      reason: "Initial check passed",
      factClusterId: "",
      questionStatus: "VALID",
      optionsStatus: "VALID",
      answerStatus: "MATCHED",
      explanationStatus: raw.explanation && raw.explanation.trim().length > 10 ? "PRESENT" : "SHORT",
      languageStatus: "CLEAN",
      pyqStatus: !isFakeExam(raw.exam) ? "AUTHENTIC" : "PYQ_AUTHENTICITY_UNCERTAIN",
      repairStatus: "NONE",
      currentnessStatus: cls.isRemovalCandidate ? "REMOVAL_CANDIDATE" : "STATIC_RELEVANT",
    };

    // Check 1: Excluded topic / Removal candidate
    if (cls.isRemovalCandidate) {
      audit.decision = "REMOVE";
      audit.reason = cls.removalReason || "Excluded topic candidate";
      audit.questionStatus = "OUT_OF_SCOPE";
      auditRecords.push(audit);
      removedRecords.push({
        originalId: raw.id,
        sourceTopic,
        questionText: raw.question,
        exam: raw.exam,
        year,
        reason: audit.reason,
        removedBecause: "EXCLUDED_TOPIC",
      });
      continue;
    }

    // Check 2: Question text validity
    if (!raw.question || raw.question.trim().length < 10) {
      audit.decision = "REMOVE";
      audit.reason = "Question stem too short or corrupted (< 10 chars)";
      audit.questionStatus = "CORRUPTED";
      auditRecords.push(audit);
      removedRecords.push({
        originalId: raw.id,
        sourceTopic,
        questionText: raw.question,
        exam: raw.exam,
        year,
        reason: audit.reason,
        removedBecause: "CORRUPTED_OR_SHORT",
      });
      continue;
    }

    // Check 3: Cancelled / Bonus check
    if (
      /विलोपित|रद्द|बोनस|\bbonus\b|\bcancelled\b/i.test(raw.question) ||
      (raw.answer && /^\s*[*X]\s*$/i.test(raw.answer))
    ) {
      audit.decision = "REMOVE";
      audit.reason = "Cancelled, bonus, or officially withdrawn question (*, X, विलोपित)";
      audit.questionStatus = "CANCELLED";
      audit.answerStatus = "CANCELLED";
      auditRecords.push(audit);
      removedRecords.push({
        originalId: raw.id,
        sourceTopic,
        questionText: raw.question,
        exam: raw.exam,
        year,
        reason: audit.reason,
        removedBecause: "CANCELLED_OR_BONUS",
      });
      continue;
    }

    // Check 4: Options array check (must have exactly 4 options)
    if (!Array.isArray(raw.options) || raw.options.length !== 4) {
      audit.decision = "REMOVE";
      audit.reason = `Invalid options array count: ${Array.isArray(raw.options) ? raw.options.length : "not array"}`;
      audit.optionsStatus = "MALFORMED";
      auditRecords.push(audit);
      removedRecords.push({
        originalId: raw.id,
        sourceTopic,
        questionText: raw.question,
        exam: raw.exam,
        year,
        reason: audit.reason,
        removedBecause: "INVALID_OPTIONS",
      });
      continue;
    }

    // Check 5: Duplicate options check
    const optSet = new Set(raw.options.map((o) => cleanStem(o || "")));
    if (optSet.size < 4) {
      audit.decision = "REMOVE";
      audit.reason = "Duplicate or identical options detected within question";
      audit.optionsStatus = "DUPLICATE";
      auditRecords.push(audit);
      removedRecords.push({
        originalId: raw.id,
        sourceTopic,
        questionText: raw.question,
        exam: raw.exam,
        year,
        reason: audit.reason,
        removedBecause: "DUPLICATE_OPTIONS",
      });
      continue;
    }

    // Check 6: Answer matching
    const answerRaw = (raw.answer || "").trim();
    if (!answerRaw) {
      audit.decision = "REMOVE";
      audit.reason = "Missing or empty correct answer";
      audit.answerStatus = "UNMATCHED";
      auditRecords.push(audit);
      removedRecords.push({
        originalId: raw.id,
        sourceTopic,
        questionText: raw.question,
        exam: raw.exam,
        year,
        reason: audit.reason,
        removedBecause: "UNMATCHED_ANSWER",
      });
      continue;
    }

    // Repair Question Text & Options
    const { cleaned: cleanedQ, repaired: textRepaired, notes: qNotes } = cleanQuestionText(raw.question);
    const repairNotes: string[] = [...qNotes];

    const finalOptions: ConvexOption[] = raw.options.map((o, optIdx) => {
      const cleanedOpt = cleanOptionText(o);
      if (cleanedOpt !== o.trim()) {
        repairNotes.push(`Option ${optIdx + 1} label prefix cleaned`);
      }
      return {
        id: `opt${optIdx + 1}` as ConvexOption["id"],
        text: cleanedOpt || o.trim(),
      };
    });

    // Match answer to option
    let correctAnswerId: "opt1" | "opt2" | "opt3" | "opt4" | null = null;
    const directIdx = raw.options.findIndex((o) => (o || "").trim() === answerRaw);
    if (directIdx !== -1) {
      correctAnswerId = `opt${directIdx + 1}` as ConvexOption["id"];
    } else {
      const cleanedAns = cleanOptionText(answerRaw).toLowerCase();
      const cleanedMatchIdx = finalOptions.findIndex((fo) => fo.text.toLowerCase() === cleanedAns);
      if (cleanedMatchIdx !== -1) {
        correctAnswerId = `opt${cleanedMatchIdx + 1}` as ConvexOption["id"];
        repairNotes.push(`Answer mapped via cleaned match: "${answerRaw}" -> opt${cleanedMatchIdx + 1}`);
        audit.answerStatus = "REPAIRED_MATCH";
      } else {
        // Unmatched answer
        audit.decision = "REMOVE";
        audit.reason = `Correct answer "${answerRaw}" does not match any of the 4 options: [${raw.options.join(", ")}]`;
        audit.answerStatus = "UNMATCHED";
        auditRecords.push(audit);
        removedRecords.push({
          originalId: raw.id,
          sourceTopic,
          questionText: raw.question,
          exam: raw.exam,
          year,
          reason: audit.reason,
          removedBecause: "UNMATCHED_ANSWER",
        });
        continue;
      }
    }

    // Record Repair if any changes made
    if (repairNotes.length > 0) {
      audit.decision = "REPAIR";
      audit.repairStatus = "REPAIRED";
      audit.languageStatus = "REPAIRED";
      audit.reason = `Repaired: ${repairNotes.join("; ")}`;
      repairedRecords.push({
        originalId: raw.id,
        originalQuestion: raw.question,
        repairedQuestion: cleanedQ,
        originalOptions: raw.options,
        repairedOptions: finalOptions.map((fo) => fo.text),
        originalAnswer: raw.answer,
        repairedAnswer: finalOptions[parseInt(correctAnswerId.replace("opt", "")) - 1].text,
        repairNotes,
      });
    }

    const answerText = finalOptions[parseInt(correctAnswerId.replace("opt", "")) - 1].text;

    validCandidates.push({
      raw,
      audit,
      cleanText: cleanedQ,
      cleanOptions: finalOptions,
      correctAnswer: correctAnswerId,
      score: scoreQuestion(raw),
      year,
      masterTopicId: cls.masterTopicId,
      answerNormalized: cleanStem(answerText),
    });
  }

  console.log(`✅ Individual QA & Repair done. Candidates passed: ${validCandidates.length}`);

  // ── Step 3: Substantive Semantic Fact Clustering & Deduplication ──
  console.log("\n👥 Running high-fidelity Substantive Fact Clustering & Semantic Deduplication...");

  // Group candidates by masterTopicId to keep topic isolation strict
  const candidatesByTopic = new Map<number, CandidateQuestion[]>();
  validCandidates.forEach((c) => {
    if (!candidatesByTopic.has(c.masterTopicId)) {
      candidatesByTopic.set(c.masterTopicId, []);
    }
    candidatesByTopic.get(c.masterTopicId)!.push(c);
  });

  const factClusters: FactCluster[] = [];
  let exactDuplicateCount = 0;
  let semanticDuplicateCount = 0;
  let clusterCounter = 1;

  for (const [topicId, topicCandidates] of candidatesByTopic.entries()) {
    // Sort topic candidates by score descending so the highest quality question becomes the representative
    topicCandidates.sort((a, b) => b.score - a.score);

    const topicClusters: FactCluster[] = [];

    for (const cand of topicCandidates) {
      let matchedCluster: FactCluster | null = null;
      let highestSim = 0;
      let isExact = false;

      // Check against existing clusters in this topic
      for (const cluster of topicClusters) {
        // Condition 1: Must share same or matching answer concept
        const ansMatch =
          cand.answerNormalized === cluster.representative.answerNormalized ||
          cand.answerNormalized.includes(cluster.representative.answerNormalized) ||
          cluster.representative.answerNormalized.includes(cand.answerNormalized);

        if (!ansMatch) continue;

        // Condition 2: High question stem similarity or substantive token overlap
        const sim = similarity(cand.cleanText, cluster.representative.cleanText);
        const overlap = tokenOverlap(cand.cleanText, cluster.representative.cleanText);

        // Exact match: sim >= 0.88 or identical stripped stem
        if (sim >= 0.88) {
          matchedCluster = cluster;
          highestSim = sim;
          isExact = true;
          break;
        }

        // Semantic duplicate: sim >= 0.65 or token overlap >= 0.70 with strong answer match
        if (sim >= 0.65 || overlap >= 0.70) {
          if (sim > highestSim) {
            matchedCluster = cluster;
            highestSim = sim;
            isExact = false;
          }
        }
      }

      if (matchedCluster) {
        // cand is a duplicate of the cluster representative
        matchedCluster.duplicates.push({ candidate: cand, sim: highestSim, isExact });
      } else {
        // cand represents a distinct fact cluster
        const ansShort = cand.answerNormalized.slice(0, 10);
        const clusterId = `FC_${topicId}_${String(clusterCounter++).padStart(5, "0")}_${ansShort}`;
        topicClusters.push({
          clusterId,
          representative: cand,
          duplicates: [],
        });
      }
    }

    factClusters.push(...topicClusters);
  }

  // ── Step 4: Resolve Cluster Decisions & Audit Records ──
  const finalQuestions: FinalMasterQuestion[] = [];

  for (const cluster of factClusters) {
    const rep = cluster.representative;
    rep.audit.factClusterId = cluster.clusterId;

    // Representative is KEPT (or REPAIR if it had formatting fixes)
    auditRecords.push(rep.audit);

    const clsKeeper = classifyQuestion(rep.raw);
    finalQuestions.push({
      id: "", // Assigned after final sorting
      type: "mcq",
      questionText: rep.cleanText,
      options: rep.cleanOptions,
      correctAnswer: rep.correctAnswer,
      explanation: rep.raw.explanation?.trim() || undefined,
      reference: !isFakeExam(rep.raw.exam) ? `📌 PYQ — ${rep.raw.exam!.trim()}` : "📌 PYQ",
      difficulty: "medium",
      order: 0,
      meta: {
        sourceType: "PYQ",
        sourceQuestionId: rep.raw.id,
        exam: !isFakeExam(rep.raw.exam) ? rep.raw.exam!.trim() : undefined,
        year: rep.year,
        originalTopic: rep.raw.topic,
        factClusterId: cluster.clusterId,
      },
      masterTopicId: clsKeeper.masterTopicId,
      masterTopic: clsKeeper.masterTopic,
      section: clsKeeper.section,
    });

    // Mark all cluster duplicates as REMOVE
    for (const dupInfo of cluster.duplicates) {
      const dup = dupInfo.candidate;
      dup.audit.factClusterId = cluster.clusterId;
      dup.audit.decision = "REMOVE";
      dup.audit.duplicateOf = rep.raw.id;

      if (dupInfo.isExact) {
        exactDuplicateCount++;
        dup.audit.reason = `Exact duplicate of Q#${rep.raw.id} in Fact Cluster ${cluster.clusterId} (similarity: ${(dupInfo.sim * 100).toFixed(1)}%)`;
        removedRecords.push({
          originalId: dup.raw.id,
          sourceTopic: dup.raw.topic || "",
          questionText: dup.raw.question,
          exam: dup.raw.exam,
          year: dup.year,
          reason: dup.audit.reason,
          removedBecause: "EXACT_DUPLICATE",
          duplicateOf: rep.raw.id,
          factClusterId: cluster.clusterId,
        });
      } else {
        semanticDuplicateCount++;
        dup.audit.reason = `Semantic duplicate of higher-quality Q#${rep.raw.id} in Fact Cluster ${cluster.clusterId} (similarity: ${(dupInfo.sim * 100).toFixed(1)}%)`;
        removedRecords.push({
          originalId: dup.raw.id,
          sourceTopic: dup.raw.topic || "",
          questionText: dup.raw.question,
          exam: dup.raw.exam,
          year: dup.year,
          reason: dup.audit.reason,
          removedBecause: "SEMANTIC_DUPLICATE",
          duplicateOf: rep.raw.id,
          factClusterId: cluster.clusterId,
        });
      }

      auditRecords.push(dup.audit);
    }
  }

  console.log(`✅ Deduplication complete:`);
  console.log(`  - Total Substantive Fact Clusters : ${factClusters.length}`);
  console.log(`  - Exact Duplicates Removed        : ${exactDuplicateCount}`);
  console.log(`  - Semantic Duplicates Removed     : ${semanticDuplicateCount}`);
  console.log(`  - Total Retained in Question Bank : ${finalQuestions.length}`);

  // ── Step 5: Final Sorting by Master Topic & Year Descending ──
  console.log("\n🗂️ Sorting final master question bank by Master Topic & Year descending...");

  finalQuestions.sort((a, b) => {
    // 1. Master Topic ID
    if (a.masterTopicId !== b.masterTopicId) return a.masterTopicId - b.masterTopicId;
    // 2. Year descending (2026 -> 2025 -> older -> null)
    const yA = a.meta.year || 0;
    const yB = b.meta.year || 0;
    if (yA !== yB) return yB - yA;
    // 3. Source ID
    return a.meta.sourceQuestionId - b.meta.sourceQuestionId;
  });

  // Assign clean sequential IDs: QZ-RAJ-00001, etc.
  finalQuestions.forEach((q, idx) => {
    q.id = `QZ-RAJ-${String(idx + 1).padStart(5, "0")}`;
    q.order = idx + 1;
  });

  // Ensure audit records are sorted by original sourceIndex
  auditRecords.sort((a, b) => a.sourceIndex - b.sourceIndex);

  // ── Step 6: Master Topic Coverage & Summary Statistics ──
  const topicCoverageMap: Record<number, { id: number; section: string; title: string; count: number }> = {};
  RAJASTHAN_MASTER_TOPICS.forEach((m) => {
    topicCoverageMap[m.id] = { id: m.id, section: m.section, title: m.title, count: 0 };
  });

  finalQuestions.forEach((q) => {
    if (topicCoverageMap[q.masterTopicId]) {
      topicCoverageMap[q.masterTopicId].count++;
    }
  });

  // Year Distribution
  const yearDist: Record<string, number> = {};
  finalQuestions.forEach((q) => {
    const y = q.meta.year ? String(q.meta.year) : "Older / Undated";
    yearDist[y] = (yearDist[y] || 0) + 1;
  });

  // Mathematical Reconciliation Counts
  const totalAudited = auditRecords.length;
  const keptCount = auditRecords.filter((a) => a.decision === "KEEP").length;
  const repairedCount = auditRecords.filter((a) => a.decision === "REPAIR").length;
  const removedCount = auditRecords.filter((a) => a.decision === "REMOVE").length;
  const uncertainCount = auditRecords.filter((a) => a.decision === "UNCERTAIN").length;
  const totalFinalKept = finalQuestions.length; // kept + repaired after deduplication

  const auditReport = {
    pipelineName: "Quizzer Final Rajasthan PYQ Master Cleaning & Audit Pipeline",
    generatedAt: new Date().toISOString(),
    reconciliation: {
      totalOriginalQuestions: totalInputQuestions,
      totalAuditedRecords: totalAudited,
      decisionBreakdown: {
        keptDirectly: keptCount,
        repairedAndRetained: repairedCount,
        removedTotal: removedCount,
        uncertain: uncertainCount,
      },
      finalRetainedQuestionBank: totalFinalKept,
      mathematicalReconciliationFormula: "Original == Kept + Repaired + Removed + Uncertain",
      isReconciled: totalInputQuestions === keptCount + repairedCount + removedCount + uncertainCount,
    },
    deduplicationStats: {
      totalFactClusters: factClusters.length,
      exactDuplicatesRemoved: exactDuplicateCount,
      semanticDuplicatesRemoved: semanticDuplicateCount,
      totalDuplicatesRemoved: exactDuplicateCount + semanticDuplicateCount,
    },
    removalBreakdown: {
      excludedTopics: removedRecords.filter((r) => r.removedBecause === "EXCLUDED_TOPIC").length,
      cancelledOrBonus: removedRecords.filter((r) => r.removedBecause === "CANCELLED_OR_BONUS").length,
      corruptedOrShort: removedRecords.filter((r) => r.removedBecause === "CORRUPTED_OR_SHORT").length,
      invalidOptions: removedRecords.filter((r) => r.removedBecause === "INVALID_OPTIONS").length,
      duplicateOptions: removedRecords.filter((r) => r.removedBecause === "DUPLICATE_OPTIONS").length,
      unmatchedAnswer: removedRecords.filter((r) => r.removedBecause === "UNMATCHED_ANSWER").length,
      exactDuplicates: exactDuplicateCount,
      semanticDuplicates: semanticDuplicateCount,
    },
    yearDistribution: yearDist,
    masterTopicCoverage: Object.values(topicCoverageMap),
    emptyMasterTopics: Object.values(topicCoverageMap).filter((t) => t.count === 0),
  };

  // Helper for safe atomic file writes
  function atomicWriteJson(filePath: string, data: any) {
    const tmpPath = `${filePath}.tmp_${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tmpPath, filePath);
  }

  // ── Step 7: Atomic File Exports (All 7 required output files) ──
  console.log("\n💾 Writing all 7 required output files atomically to src/xdata/master_audit/...");

  // 1. final_rajasthan_pyq_master.json
  const finalMasterPath = path.join(OUTPUT_DIR, "final_rajasthan_pyq_master.json");
  atomicWriteJson(finalMasterPath, finalQuestions);
  console.log(`  1. final_rajasthan_pyq_master.json (${finalQuestions.length} retained questions)`);

  // 2. rajasthan_pyq_audit.json
  const auditPath = path.join(OUTPUT_DIR, "rajasthan_pyq_audit.json");
  atomicWriteJson(auditPath, auditRecords);
  console.log(`  2. rajasthan_pyq_audit.json (${auditRecords.length} audit records)`);

  // 3. removed_questions.json
  const removedPath = path.join(OUTPUT_DIR, "removed_questions.json");
  atomicWriteJson(removedPath, removedRecords);
  console.log(`  3. removed_questions.json (${removedRecords.length} removed records)`);

  // 4. repaired_questions.json
  const repairedPath = path.join(OUTPUT_DIR, "repaired_questions.json");
  atomicWriteJson(repairedPath, repairedRecords);
  console.log(`  4. repaired_questions.json (${repairedRecords.length} repaired records)`);

  // 5. topic_mapping.json
  const topicMappingPath = path.join(OUTPUT_DIR, "topic_mapping.json");
  const topicMappingSummary: Record<string, { masterTopicId: number; masterTopic: string; count: number }> = {};
  finalQuestions.forEach((q) => {
    const orig = q.meta.originalTopic || "Unknown";
    if (!topicMappingSummary[orig]) {
      topicMappingSummary[orig] = { masterTopicId: q.masterTopicId, masterTopic: q.masterTopic, count: 0 };
    }
    topicMappingSummary[orig].count++;
  });
  atomicWriteJson(topicMappingPath, topicMappingSummary);
  console.log(`  5. topic_mapping.json (${Object.keys(topicMappingSummary).length} source topics mapped)`);

  // 6. checkpoint.json
  const checkpointPath = path.join(OUTPUT_DIR, "checkpoint.json");
  const checkpoint: CheckpointState = {
    totalQuestions: totalInputQuestions,
    completed: totalInputQuestions,
    pending: 0,
    lastCompletedIndex: totalInputQuestions - 1,
    lastCompletedId: allRawQuestions[totalInputQuestions - 1].id,
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
  };
  atomicWriteJson(checkpointPath, checkpoint);
  console.log(`  6. checkpoint.json (Status: COMPLETED)`);

  // 7. audit_report.json
  const auditReportPath = path.join(OUTPUT_DIR, "audit_report.json");
  atomicWriteJson(auditReportPath, auditReport);
  console.log(`  7. audit_report.json (Mathematical Reconciliation & Coverage Summary)`);

  // ── Step 8: Console Summary Report ──
  console.log("\n══════════════════════════════════════════════════════════════════════");
  console.log("  PIPELINE COMPLETION & MATHEMATICAL RECONCILIATION");
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log(`Total Original Questions Loaded : ${totalInputQuestions}`);
  console.log(`  - Kept Directly               : ${keptCount}`);
  console.log(`  - Repaired & Retained         : ${repairedCount}`);
  console.log(`  - Removed Total               : ${removedCount}`);
  console.log(`  - Uncertain                   : ${uncertainCount}`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`Sum Check: ${keptCount} + ${repairedCount} + ${removedCount} + ${uncertainCount} == ${totalInputQuestions} -> ${auditReport.reconciliation.isReconciled}`);
  console.log(`Final Master Retained Questions : ${finalQuestions.length}`);
  console.log(`Exact Duplicates Removed        : ${exactDuplicateCount}`);
  console.log(`Semantic Duplicates Removed     : ${semanticDuplicateCount}`);
  console.log(`Total Fact Clusters             : ${factClusters.length}`);
  console.log(`Empty Master Topics (0 Qs)      : ${auditReport.emptyMasterTopics.length}`);
  console.log("══════════════════════════════════════════════════════════════════════\n");
}

runMasterCleaningPipeline().catch((err) => {
  console.error("❌ Pipeline Error:", err);
  process.exit(1);
});
