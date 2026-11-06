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
  const hasSkew = percentage > 45; // in a balanced 20-question test, Option A should be ~25% (max 40%)

  return {
    hasSkew,
    aCount,
    total: questions.length,
    percentage,
    message: hasSkew
      ? `AI Answer Key Skew Detected: ${aCount}/${questions.length} (${percentage}%) questions have Option A as the answer. Please ensure answer keys are authentic and balanced across A, B, C, D.`
      : undefined,
  };
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const ENG_ALPHA = ['a', 'b', 'c', 'd', 'e'];

/**
 * Validates whether the selected correctAnswer for a match_following question
 * matches the pairings in its explanation (e.g. arrows X → Y).
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

  // Look for arrow patterns: X → Y
  const arrowRegex = /([^।\n\r;]+?)(?:→|->)([^।\n\r;]+)/g;
  let match;
  const pairs: Record<string, string> = {};

  while ((match = arrowRegex.exec(expl)) !== null) {
    const partA = match[1].toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
    const partB = match[2].toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

    for (let l = 0; l < left.length; l++) {
      const lText = (left[l].text || left[l] || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
      if (lText.length < 2) continue;
      const lInA = partA.includes(lText) || lText.includes(partA);
      const lInB = partB.includes(lText) || lText.includes(partB);

      for (let r = 0; r < right.length; r++) {
        const rText = (right[r].text || right[r] || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
        if (rText.length < 2) continue;
        const rInA = partA.includes(rText) || rText.includes(partA);
        const rInB = partB.includes(rText) || rText.includes(partB);

        if ((lInA && rInB) || (lInB && rInA)) {
          pairs[ENG_ALPHA[l]] = ROMAN_NUMERALS[r];
        }
      }
    }
  }

  const pCount = Object.keys(pairs).length;
  if (pCount < 2) return { isConsistent: true };

  // Score options
  const scores = options.map((optStr: string) => {
    let m = 0;
    for (const [l, r] of Object.entries(pairs)) {
      if (new RegExp(`\\b${l}-${r}\\b`, "i").test(optStr)) m++;
    }
    return m;
  });

  const maxScore = Math.max(...scores);
  const bestIdx = scores.indexOf(maxScore);

  if (maxScore >= Math.min(3, pCount) && maxScore >= 2) {
    const rawAns = q.correctAnswer !== undefined ? q.correctAnswer : q.a !== undefined ? q.a : q.answer;
    let selectedIdx = -1;
    if (typeof rawAns === "number") selectedIdx = rawAns;
    else if (rawAns === "opt1" || rawAns === "A") selectedIdx = 0;
    else if (rawAns === "opt2" || rawAns === "B") selectedIdx = 1;
    else if (rawAns === "opt3" || rawAns === "C") selectedIdx = 2;
    else if (rawAns === "opt4" || rawAns === "D") selectedIdx = 3;

    if (selectedIdx !== -1 && selectedIdx !== bestIdx && scores[selectedIdx] < maxScore) {
      const targetOptLetter = ["A", "B", "C", "D"][bestIdx];
      return {
        isConsistent: false,
        suggestedAnswer: `opt${bestIdx + 1}`,
        matchedPairsCount: maxScore,
        message: `Explanation clearly proves Option ${targetOptLetter} (${options[bestIdx]}) is the correct match, but Option ${["A", "B", "C", "D"][selectedIdx]} was selected.`,
      };
    }
  }

  return { isConsistent: true };
}
