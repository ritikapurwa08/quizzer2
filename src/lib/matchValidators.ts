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

  // 2. Comma/space-separated subset of statement identifiers without pairing dashes:
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
