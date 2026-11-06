/**
 * Quality Gate Validators for Match the Following and Multi-Statement Questions
 */

export const SEQUENCE_KEYWORDS_REGEX =
  /(?:arrangement|arrange|rearrange|meaningful sentence|chronological|order of the following|कालक्रमानुसार|कालानुक्रम|कालक्रम|व्यवस्थित\s*(?:कीजिए|कीजिये|किजीए|करें)|अवरोही\s*क्रम|आरोही\s*क्रम|सही\s*(?:भौगोलिक\s*)?क्रम|बढ़ते\s*क्रम|घटते\s*क्रम)/i;

export const STATEMENT_EVALUATION_REGEX =
  /(?:निम्नलिखित\s*(?:कथनों|पर)\s*विचार|कथनों\s*पर\s*विचार|कथन\s*[1-4a-dA-D]|सही\s*कथनों?\s*का\s*चयन|सत्य\s*कथनों?\s*का\s*चयन|गलत\s*कथन|कथनों\s*में\s*से|उपर्युक्त\s*में\s*से\s*कौन|इनमें\s*से\s*कौन\s*से\s*कथन)/iu;

/**
 * Checks whether an array of options represents statement evaluation combinations
 * (e.g. '1 तथा 2 सही हैं', 'a और d', 'केवल 1', 'उपर्युक्त सभी') rather than
 * match pairing codes (e.g. 'A-(ii), B-(iv)' or '2 4 1 3').
 */
export function isStatementOptions(options?: Array<{ id: string; text: string } | string>): boolean {
  if (!options || options.length === 0) return false;
  const optTexts = options.map((o) => (typeof o === "string" ? o : o?.text || "").trim());

  // 1. Explicit statement evaluation words: सही, गलत, सत्य, केवल, और, etc. (without pairing markers)
  const hasStatementKeyword = optTexts.some((text) =>
    /(?:सही|गलत|सत्य|असत्य|केवल|तथा|both|only|all\s+of|none\s+of|(?:^|\s)और(?:\s|$)|(?:^|\s)व(?:\s|$))/iu.test(
      text
    ) && !/[-–—:]\s*(?:[1-9]|I{1,3}|[ivxlc]+|[अ-द])/iu.test(text)
  );
  if (hasStatementKeyword) return true;

  // 2. Four-digit / 4-item permutation matching codes (e.g. '2 3 4 1', '4 1 2 3', '2, 3, 4, 1')
  // These represent classic matching answer codes for A, B, C, D — NOT statement selections!
  const isPermutationCode = optTexts.every((text) =>
    /^\s*[1-5ivxlcIVXLC]\s*[, ]\s*[1-5ivxlcIVXLC]\s*[, ]\s*[1-5ivxlcIVXLC]\s*[, ]\s*[1-5ivxlcIVXLC]\s*$/i.test(text)
  );
  if (isPermutationCode) return false;

  // 3. Comma/space-separated subset of statement identifiers without pairing dashes:
  // e.g. 'a, b, c', '(a), (b)', 'A, B, D', '1, 2, 3'
  const isSubsetList = optTexts.every((text) => {
    if (/[-–—:]\s*(?:[1-9]|I{1,3}|[ivxlc]+|[अ-द])/iu.test(text)) return false;
    return /^[(\s]*[a-eA-E1-5\u0905-\u0914\u0967-\u096b][)\s]*(?:[,،\s]+[(\s]*[a-eA-E1-5\u0905-\u0914\u0967-\u096b][)\s]*)+$/iu.test(text);
  });

  return isSubsetList;
}

/**
 * Validates match metadata to ensure columns are clean, non-fragmented lists.
 * Flags broken parsing artifacts (e.g. numeric IDs '921', fragments ending in '₹').
 */
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

/**
 * Checks for AI collapse where questions in a batch disproportionately default to Option A (index 0).
 */
export function checkAnswerDistribution(questions: any[]): {
  hasSkew: boolean;
  aCount: number;
  total: number;
  percentage: number;
  message?: string;
} {
  if (!Array.isArray(questions) || questions.length < 8) {
    return { hasSkew: false, aCount: 0, total: questions?.length || 0, percentage: 0 };
  }

  let aCount = 0;
  for (const q of questions) {
    const raw = q.correctAnswer !== undefined ? q.correctAnswer : q.a !== undefined ? q.a : q.answer;
    if (raw === 0 || raw === "0" || raw === "A" || raw === "opt1") {
      aCount++;
    }
  }

  const percentage = Math.round((aCount / questions.length) * 100);
  const hasSkew = percentage > 40; // In authentic 20-question tests, Option A should be ~25% (threshold: max 40%)

  return {
    hasSkew,
    aCount,
    total: questions.length,
    percentage,
    message: hasSkew
      ? `AI Answer Key Skew Detected: ${aCount}/${questions.length} (${percentage}%) questions have Option A as the answer. In authentic exams, answers are distributed roughly equally (~25% each) across A, B, C, D. Please verify that answers were not defaulted to Option A.`
      : undefined,
  };
}

const ROMAN_MAP: Record<string, number> = {
  i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5,
  "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5,
};

const ALPHA_MAP: Record<string, number> = {
  a: 0, b: 1, c: 2, d: 3, e: 4,
  "अ": 0, "ब": 1, "स": 2, "द": 3,
};

function normalizeDevanagari(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFC")
    .replace(/\u095c/g, "\u0921\u093c")
    .replace(/\u095d/g, "\u0922\u093c")
    .replace(/\u0921\u093c/g, "ड")
    .replace(/\u0922\u093c/g, "ढ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Parses match pairing strings from an option.
 * Supports:
 * - 'a-II, b-IV, c-I, d-III'
 * - '(a)-(iv), (b)-(iii), (c)-(i), (d)-(ii)'
 * - 'a-(2), b-(4), c-(1), d-(3)'
 * - '2, 4, 1, 3' or '2 4 1 3' or 'ii, iv, i, iii'
 */
export function parseOptionPairings(optStr: string): Record<number, number> {
  const pairings: Record<number, number> = {};
  if (!optStr || typeof optStr !== "string") return pairings;

  // 1. Explicit pairing markers: a-II, (a)-(iv), a-(2), a-2, (A)-I
  const pairRegex = /(?:[\(\[]?([a-eA-E\u0905\u092c\u0938\u0926])[\)\]]?\s*[-–—:]\s*[\(\[]?([iIvVxX\d]+)[\)\]]?)/g;
  let match;
  let count = 0;
  while ((match = pairRegex.exec(optStr)) !== null) {
    const lKey = match[1].toLowerCase();
    const rKey = match[2].toLowerCase();
    const lIdx = ALPHA_MAP[lKey];
    const rIdx = ROMAN_MAP[rKey];
    if (lIdx !== undefined && rIdx !== undefined) {
      pairings[lIdx] = rIdx;
      count++;
    }
  }
  if (count >= 2) return pairings;

  // 2. Permutation format: e.g. '2 4 1 3' or '2, 4, 1, 3' or 'ii, iv, i, iii'
  const tokens = optStr.split(/[\s,–—\-]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tokens.length >= 3 && tokens.every((t) => ROMAN_MAP[t] !== undefined)) {
    tokens.forEach((t, i) => {
      pairings[i] = ROMAN_MAP[t];
    });
    return pairings;
  }

  return pairings;
}

/**
 * Robustly extracts left-to-right factual pairings from question explanation text.
 */
function extractPairsFromExplanation(
  expl: string,
  left: any[],
  right: any[]
): Record<number, number> {
  const pairs: Record<number, number> = {};
  if (!expl || !left || !right || !Array.isArray(left) || !Array.isArray(right)) return pairs;

  const cleanLeft = left.map((item, idx) => {
    const raw = typeof item === "string" ? item : item?.text || "";
    const clean = normalizeDevanagari(raw);
    return { idx, raw, clean, words: clean.split(/\s+/).filter((w) => w.length >= 2) };
  });

  const cleanRight = right.map((item, idx) => {
    const raw = typeof item === "string" ? item : item?.text || "";
    const clean = normalizeDevanagari(raw);
    return { idx, raw, clean, words: clean.split(/\s+/).filter((w) => w.length >= 2) };
  });

  // Strategy 1: Segment explanation by sentences, lines, bullets, pipes, or closing paren before word
  const segments = expl
    .replace(/\)\s*(?=[\u0900-\u097F\w])/gu, ")\n")
    .split(/[।\n\r;•|]/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const seg of segments) {
    const segClean = normalizeDevanagari(seg);
    for (const l of cleanLeft) {
      const lMatch =
        l.words.length > 0 &&
        l.words.some((w) => segClean.includes(w)) &&
        (segClean.includes(l.clean) || l.words.filter((w) => segClean.includes(w)).length >= Math.ceil(l.words.length * 0.5));
      if (!lMatch) continue;

      for (const r of cleanRight) {
        const rMatch =
          r.words.length > 0 &&
          r.words.some((w) => segClean.includes(w)) &&
          (segClean.includes(r.clean) || r.words.filter((w) => segClean.includes(w)).length >= Math.ceil(r.words.length * 0.5));
        if (rMatch) {
          pairs[l.idx] = r.idx;
        }
      }
    }
  }

  // Strategy 2: Explicit arrows (X → Y)
  const arrowRegex = /([^।\n\r;•|]+?)(?:→|->|–|—)([^।\n\r;•|]+)/g;
  let aMatch;
  while ((aMatch = arrowRegex.exec(expl)) !== null) {
    const partAClean = normalizeDevanagari(aMatch[1]);
    const partBClean = normalizeDevanagari(aMatch[2]);

    for (const l of cleanLeft) {
      const lInA = l.clean.length >= 2 && partAClean.includes(l.clean);
      const lInB = l.clean.length >= 2 && partBClean.includes(l.clean);
      if (!lInA && !lInB) continue;

      for (const r of cleanRight) {
        const rInA = r.clean.length >= 2 && partAClean.includes(r.clean);
        const rInB = r.clean.length >= 2 && partBClean.includes(r.clean);

        if ((lInA && rInB) || (lInB && rInA)) {
          pairs[l.idx] = r.idx;
        }
      }
    }
  }

  return pairs;
}

/**
 * Validates whether the selected correctAnswer for a match_following question
 * matches the pairings in its explanation.
 */
export function verifyMatchAnswerConsistency(q: any): {
  isConsistent: boolean;
  suggestedAnswer?: string;
  matchedPairsCount?: number;
  message?: string;
} {
  const meta = q.meta || {};
  const left = Array.isArray(meta.left) ? meta.left : [];
  const right = Array.isArray(meta.right) ? meta.right : [];
  const expl = typeof q.explanation === "string" ? q.explanation : "";
  const options = Array.isArray(q.options)
    ? q.options.map((o: any) => (typeof o === "string" ? o : o?.text || ""))
    : [];

  if (left.length < 2 || right.length < 2 || !expl || options.length !== 4) {
    return { isConsistent: true };
  }

  const pairs = extractPairsFromExplanation(expl, left, right);
  const pCount = Object.keys(pairs).length;
  if (pCount < 2) return { isConsistent: true };

  const scores = options.map((optStr: string) => {
    const optPairings = parseOptionPairings(optStr);
    let m = 0;
    for (const [lIdx, rIdx] of Object.entries(pairs)) {
      if (optPairings[Number(lIdx)] === rIdx) m++;
    }
    return m;
  });

  const maxScore = Math.max(...scores);
  const bestIdx = scores.indexOf(maxScore);

  if (maxScore >= Math.min(3, pCount) && maxScore >= 2) {
    const rawAns = q.correctAnswer !== undefined ? q.correctAnswer : q.a !== undefined ? q.a : q.answer;
    let selectedIdx = -1;
    if (typeof rawAns === "number") selectedIdx = rawAns;
    else if (rawAns === "opt1" || rawAns === "A" || rawAns === "0") selectedIdx = 0;
    else if (rawAns === "opt2" || rawAns === "B" || rawAns === "1") selectedIdx = 1;
    else if (rawAns === "opt3" || rawAns === "C" || rawAns === "2") selectedIdx = 2;
    else if (rawAns === "opt4" || rawAns === "D" || rawAns === "3") selectedIdx = 3;

    if (selectedIdx !== -1 && selectedIdx !== bestIdx && scores[selectedIdx] < maxScore) {
      const targetOptLetter = ["A", "B", "C", "D"][bestIdx];
      const selectedOptLetter = ["A", "B", "C", "D"][selectedIdx];
      return {
        isConsistent: false,
        suggestedAnswer: `opt${bestIdx + 1}`,
        matchedPairsCount: maxScore,
        message: `Explanation clearly proves Option ${targetOptLetter} (${options[bestIdx]}) is the correct match (score: ${maxScore}/${pCount} pairs), but Option ${selectedOptLetter} was selected.`,
      };
    }
  }

  return { isConsistent: true };
}
