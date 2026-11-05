import { tryParseMarkdownTable } from "./validators/question";

export interface ExtractedMatch {
  cleanPrompt: string;
  leftTitle: string;
  rightTitle: string;
  left: Array<{ id: string; text: string }>;
  right: Array<{ id: string; text: string }>;
}

export {
  SEQUENCE_KEYWORDS_REGEX,
  STATEMENT_EVALUATION_REGEX,
  isStatementOptions,
  hasCorruptedMatchMeta,
} from "./matchValidators";
import {
  SEQUENCE_KEYWORDS_REGEX,
  STATEMENT_EVALUATION_REGEX,
  isStatementOptions,
  hasCorruptedMatchMeta,
} from "./matchValidators";

function filterProgressiveMarkers(
  markers: Array<{ token: string; id: string; index: number; length: number }>
): Array<{ token: string; id: string; index: number; length: number }> {
  if (markers.length < 3) return markers;

  const engAlpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const devAlpha1 = ["अ", "ब", "स", "द", "य", "र"];
  const devAlpha2 = ["क", "ख", "ग", "घ", "ङ"];
  const romanAlpha = ["I", "II", "III", "IV", "V", "VI"];

  const firstId = markers[0].id.toUpperCase();
  let expectedSequence: string[] | null = null;

  if (engAlpha.startsWith(firstId)) {
    expectedSequence = engAlpha.split("");
  } else if (devAlpha1[0] === markers[0].id) {
    expectedSequence = devAlpha1;
  } else if (devAlpha2[0] === markers[0].id) {
    expectedSequence = devAlpha2;
  } else if (romanAlpha[0] === firstId) {
    expectedSequence = romanAlpha;
  } else if (/^[1\u0967]$/.test(markers[0].id)) {
    const result = [markers[0]];
    let nextNum = 2;
    for (let i = 1; i < markers.length; i++) {
      const curId = markers[i].id;
      if (parseInt(curId, 10) === nextNum || curId === String(nextNum)) {
        result.push(markers[i]);
        nextNum++;
      }
    }
    return result;
  }

  if (expectedSequence) {
    const result = [markers[0]];
    let nextIdx = 1;
    for (let i = 1; i < markers.length; i++) {
      const curId = markers[i].id.toUpperCase();
      if (curId === expectedSequence[nextIdx] || markers[i].id === expectedSequence[nextIdx]) {
        result.push(markers[i]);
        nextIdx++;
      }
    }
    return result;
  }

  return markers;
}

export function extractMatchQuestionData(rawText: string): ExtractedMatch | null {
  if (!rawText) return null;
  const text = rawText.trim();

  // If text explicitly matches sequence/arrangement keywords, it is NOT a match question
  if (SEQUENCE_KEYWORDS_REGEX.test(text)) {
    return null;
  }

  // If text is a statement evaluation question and lacks explicit match table headers, it is NOT a match question
  const hasExplicitMatchHeader =
    /(?:सूची|तालिका|सारणी|स्तंभ|कॉलम|List|Column|Table)\s*[-–—:\s]*(?:1|I|A)|(?:सुमेलित\s*(?:करें|कीजिए|कीजिये|किजीए)|मिलान\s*(?:करें|कीजिए|कीजिये|किजीए))/iu.test(
      text
    );
  if (STATEMENT_EVALUATION_REGEX.test(text) && !hasExplicitMatchHeader) {
    return null;
  }

  // Mask out headers like सूची-1, सूची-2, तालिका-1, तालिका-2, सारणी-1, List-1, etc.
  // Note: ensure parenthesized group does not swallow single-marker letters like (a) or (i)
  const masked = text.replace(
    /(?:सूची|तालिका|सारणी|स्तंभ|कॉलम|List|Column|Table)\s*[-–—:\s]*(?:[12]|I{1,2}|[AB])(?:\s*\((?![a-eA-E1-8\u0905-\u0926ivxlcIVXLC]\))[^\)]+\))?/gi,
    (m) => " ".repeat(m.length)
  );

  // Regex to find markers:
  // 1. Bracketed markers: (1..8), (a..e), (अ..द), (i..viii), (I..VIII)
  // 2. Letter markers: अ., ब., स., द., a., b., c., d.
  // 3. Digit markers: 1..8 ONLY (never multi-digit numbers like 921.)
  // 4. Roman numeral markers: i., ii., iii., iv., I., II., III., IV.
  // 5. Bare digit marker: 1..5 followed by space and Devanagari text
  const markerRegex =
    /(?:\(([1-8ivxlcIVXLCa-eA-E\u0905\u092c\u0938\u0926\u0915-\u0918\u0967-\u096f]+)\)|(?<=^|\s|[\n\r:\-–—\u0900-\u097f])([a-eA-E\u0905\u092c\u0938\u0926\u0915-\u0918])[.)\-:]|(?<=^|\s|[\n\r:\-–—\u0900-\u097f])([1-8\u0967-\u096f])[.)\-:]|(?<=^|\s|[\n\r:\-–—\u0900-\u097f])((?:[ivxlc]{1,4}|[IVXLC]{1,4}))[.)\-:]|(?<=\s|^|[)\]:\-–—\u0900-\u097f])([1-5])\s+(?=[\u0900-\u097f]))/gu;

  const markers: Array<{ token: string; id: string; index: number; length: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = markerRegex.exec(masked)) !== null) {
    markers.push({
      token: m[0],
      id: (m[1] || m[2] || m[3] || m[4] || m[5] || "").trim(),
      index: m.index,
      length: m[0].length,
    });
  }

  if (markers.length < 4) return null;

  // Extract raw items between markers
  const rawItems: Array<{ id: string; text: string }> = [];
  for (let i = 0; i < markers.length; i++) {
    const cur = markers[i];
    const next = markers[i + 1];
    let content = next ? text.slice(cur.index + cur.length, next.index) : text.slice(cur.index + cur.length);
    content = content
      .replace(
        /(?:[\s\-–—]+(?:कूट|कोड|codes?)|(?<!त्रि|चित्र)(?:कूट|कोड)\s*[:\-–—]|नीचे\s*दिए\s*गए|निम्न\s*में\s*से|उपयुक्त\s*(?:उत्तर|विकल्प)|सही\s*(?:उत्तर|विकल्प)\s*का\s*चयन|Choose\s+the\s+(?:most\s+)?appropriate\s+answer|Choose\s+the\s+correct\s+answer|Select\s+the\s+correct\s+(?:option|code)|from\s+the\s+options\s+given\s+below|1\s*,\s*2\s*,\s*3\s*,\s*4|[अa]\s*,\s*[बb]\s*,\s*[सc]\s*,\s*[दd])[\s\S]*$/i,
        ""
      )
      .trim();
    content = content.replace(/^[\-–—:]\s*/, "").replace(/[\-–—:]\s*$/, "").trim();
    if (content) {
      rawItems.push({ id: cur.id, text: content });
    }
  }

  if (rawItems.length < 4) return null;

  // Determine if interleaved (alternating IDs) or sequential
  const isDigit = (id: string) => /^[0-9\u0967-\u096f]+$/.test(id);
  const isDevLetter = (id: string) => /^[\u0905\u092c\u0938\u0926\u0915-\u0918]$/.test(id);
  const isEngLetter = (id: string) => /^[a-eA-E]$/.test(id);
  const isRoman = (id: string) => /^(?:[ivxlc]+|[IVXLC]+)$/.test(id);

  let leftItems: Array<{ id: string; text: string }> = [];
  let rightItems: Array<{ id: string; text: string }> = [];

  const type0 = isDigit(rawItems[0].id)
    ? "digit"
    : isDevLetter(rawItems[0].id)
    ? "dev"
    : isEngLetter(rawItems[0].id)
    ? "eng"
    : "roman";
  const type1 = isDigit(rawItems[1].id)
    ? "digit"
    : isDevLetter(rawItems[1].id)
    ? "dev"
    : isEngLetter(rawItems[1].id)
    ? "eng"
    : "roman";

  if (type0 !== type1 && rawItems.length % 2 === 0) {
    // Interleaved alternating list
    for (let i = 0; i < rawItems.length; i += 2) {
      leftItems.push(rawItems[i]);
      rightItems.push(rawItems[i + 1]);
    }
  } else {
    // Only allow sequential split in half IF there is an explicit match header or match keyword!
    const hasExplicitMatchIndicator =
      /(?:सूची|तालिका|सारणी|स्तंभ|कॉलम|List|Column|Table)\s*[-–—:\s]*(?:1|I|A)|(?:सुमेलित|मिलान|मिलाएं|मिलाइये|मिलाइए)/i.test(
        text
      );
    if (!hasExplicitMatchIndicator) {
      return null;
    }

    const half = Math.floor(rawItems.length / 2);
    leftItems = rawItems.slice(0, half);
    rightItems = rawItems.slice(half);
  }

  if (leftItems.length < 2 || rightItems.length < 2) return null;

  // Extract Titles from header part (before first marker)
  const headerPart = text.slice(0, markers[0].index).trim();

  let leftTitle = "सूची – I";
  let rightTitle = "सूची – II";

  // 1. Parenthesized headers: e.g. सूची-1(पशुधन)सूची-2(नस्ल) or तालिका-I (भौतिक आकृति)...
  const parenM = headerPart.match(
    /(?:सूची|तालिका|सारणी|स्तंभ|कॉलम|List|Column|Table)\s*[-–—:\s]*(?:1|I|A)\s*\(([^)]+)\).*?(?:सूची|तालिका|सारणी|स्तंभ|कॉलम|List|Column|Table)\s*[-–—:\s]*(?:2|II|B)\s*\(([^)]+)\)/i
  );
  if (parenM) {
    const isEng = /List|Column|Table/i.test(parenM[0]);
    leftTitle = (isEng ? "List – I" : "सूची – I") + " (" + parenM[1].trim() + ")";
    rightTitle = (isEng ? "List – II" : "सूची – II") + " (" + parenM[2].trim() + ")";
  } else {
    // 2. Direct title format: e.g. -सूची-1 प्राणी प्रतीक सूची-II जिला
    const directM = headerPart.match(
      /(?:सूची|तालिका|सारणी|स्तंभ|कॉलम|List|Column|Table)\s*[-–—:\s]*(?:1|I|A)\s+([^\s:]+).*?(?:सूची|तालिका|सारणी|स्तंभ|कॉलम|List|Column|Table)\s*[-–—:\s]*(?:2|II|B)\s+([^\s:]+)/i
    );
    if (directM) {
      leftTitle = "सूची – I (" + directM[1].trim() + ")";
      rightTitle = "सूची – II (" + directM[2].trim() + ")";
    } else {
      // 3. Plain noun pair: e.g. -पशु नस्ल or -कुप्रथा सर्वप्रथम रोक लगाने वाली रियासत
      const dashM = headerPart.match(/[-–—:]\s*([\u0900-\u097f\w\s]+?)\s{1,3}([\u0900-\u097f\w\s]+)$/);
      if (dashM && !dashM[1].includes("कीजिए") && !dashM[1].includes("सुमेलित")) {
        const t1 = dashM[1].trim();
        const t2 = dashM[2].trim();
        if (t1 && t2 && t1.length < 25 && t2.length < 35) {
          leftTitle = t1;
          rightTitle = t2;
        }
      }
    }
  }

  // Extract clean prompt sentence from headerPart
  let prompt = "";
  const promptEndM = headerPart.match(
    /(?:सुमेलित\s*(?:कीजिए|कीजिये|किजीए|करें)|मिलान\s*(?:कीजिए|कीजिये|किजीए|करें)|(?:सही\s*(?:उत्तर|विकल्प)\s*का\s*(?:चयन|चुनाव)\s*(?:कीजिए|कीजिये|किजीए|करें|चुनिए|चुनिये))|(?:उपयुक्त\s*उत्तर\s*(?:का\s*चयन\s*कीजिए|का\s*चयन\s*कीजिये|चुनें|चुनिए|चुनिये))|(?:उत्तर\s*(?:दें|दीजिए|दीजिये|चुनिए|चुनिये)))\s*[:\-–—\s]*/i
  );

  if (promptEndM && promptEndM.index !== undefined) {
    prompt = headerPart.slice(0, promptEndM.index + promptEndM[0].length).trim();
  } else {
    const headerSplit = headerPart.search(
      /[-–—:]\s*(?:(?:सूची|तालिका|सारणी|स्तंभ|कॉलम|List|Column|Table)|\([^)]+\)|[\u0900-\u097f\w\s]+?\s+[\u0900-\u097f\w\s]+$)/i
    );
    if (headerSplit > 0) {
      prompt = headerPart.slice(0, headerSplit).trim();
    } else {
      prompt = "सूची-I को सूची-II से सुमेलित कीजिए :";
    }
  }

  prompt = prompt.replace(/[\-–—:]\s*$/, "").trim();
  if (!prompt.endsWith(":") && !prompt.endsWith("।") && !prompt.endsWith("?")) {
    prompt += " :";
  }

  return {
    cleanPrompt: prompt,
    leftTitle,
    rightTitle,
    left: leftItems,
    right: rightItems,
  };
}

export function extractSequenceQuestionData(rawText: string): {
  cleanPrompt: string;
  items: Array<{ id: string; text: string }>;
} | null {
  if (!rawText) return null;
  const isSeq = SEQUENCE_KEYWORDS_REGEX.test(rawText);
  if (!isSeq) return null;

  const text = rawText.trim();
  const markerRegex =
    /(?:\(([0-9a-eA-EivxlcIVXLC\u0905\u092c\u0938\u0926\u0915-\u0918\u0967-\u096f]+)\)|(?<=^|\s|[\n\r:\-–—\u0900-\u097f])([a-eA-E\u0905\u092c\u0938\u0926\u0915-\u0918])[.)\-:]|(?<=^|\s|[\n\r:\-–—\u0900-\u097f])([0-9\u0967-\u096f]+)[.)\-:]|(?<=^|\s|[\n\r:\-–—\u0900-\u097f])((?:[ivxlc]+|[IVXLC]+))[.)\-:]|(?<=\s|^|[)\]:\-–—\u0900-\u097f])([1-5])\s+(?=[\u0900-\u097f]))/g;

  const rawMarkers: Array<{ token: string; id: string; index: number; length: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = markerRegex.exec(text)) !== null) {
    rawMarkers.push({
      token: m[0],
      id: (m[1] || m[2] || m[3] || m[4] || m[5] || "").trim(),
      index: m.index,
      length: m[0].length,
    });
  }

  const markers = filterProgressiveMarkers(rawMarkers);
  if (markers.length < 3) return null;

  const items: Array<{ id: string; text: string }> = [];
  for (let i = 0; i < markers.length; i++) {
    const cur = markers[i];
    const next = markers[i + 1];
    let content = next ? text.slice(cur.index + cur.length, next.index) : text.slice(cur.index + cur.length);
    content = content
      .replace(
        /(?:[\s\-–—]+(?:कूट|कोड|codes?)|(?<!त्रि|चित्र)(?:कूट|कोड)\s*[:\-–—]|नीचे\s*दिए\s*गए|निम्न\s*में\s*से|उपयुक्त\s*(?:उत्तर|विकल्प)|सही\s*(?:उत्तर|विकल्प)\s*का\s*चयन|Choose\s+the\s+(?:most\s+)?appropriate\s+answer|Choose\s+the\s+correct\s+answer|Select\s+the\s+correct\s+(?:option|code)|from\s+the\s+options\s+given\s+below)[\s\S]*$/i,
        ""
      )
      .trim();
    content = content.replace(/^[\-–—:]\s*/, "").replace(/[\-–—:]\s*$/, "").trim();
    if (content) {
      items.push({ id: cur.id, text: content });
    }
  }

  if (items.length < 3) return null;

  let prompt = text.slice(0, markers[0].index).trim().replace(/[\-–—:.]\s*$/, "").trim();
  if (!prompt.endsWith(":") && !prompt.endsWith("।") && !prompt.endsWith("?")) {
    prompt += " :";
  }

  return { cleanPrompt: prompt, items };
}

/**
 * Robustly normalizes question object, detecting and enriching:
 * 1. Markdown Table questions (populating headers, rows)
 * 2. Sequence questions (populating items) - checked BEFORE match to avoid false match tables!
 * 3. Match questions (populating left, right, leftTitle, rightTitle, cleanPrompt)
 */
export function enrichQuestionStructure(q: any): any {
  if (!q) return q;
  let meta = { ...(q.meta || {}) };
  const rawText = meta.rawQuestionText || q.questionText || q.question || "";
  let type = q.type || "mcq";
  let questionText = q.questionText || q.question || rawText;

  // 1. Markdown Table Check (Always retain table type if headers & rows present)
  if (rawText.includes("|") || type === "table" || (meta.headers && meta.headers.length >= 2)) {
    if (!meta.headers || meta.headers.length === 0) {
      const parsedTable = tryParseMarkdownTable(rawText);
      if (parsedTable && parsedTable.headers.length >= 2) {
        type = "table";
        meta.headers = parsedTable.headers;
        meta.rows = parsedTable.rows;
        meta.rawQuestionText = rawText;
        if (parsedTable.remainingText) {
          questionText = parsedTable.remainingText;
        }
      }
    }
    if (meta.headers && meta.headers.length >= 2 && meta.rows && meta.rows.length >= 1) {
      type = "table";
      return {
        ...q,
        type: "table",
        questionText: questionText || meta.rawQuestionText || rawText,
        question: questionText || meta.rawQuestionText || rawText,
        meta,
      };
    }
  }

  // 2. Sequence Question Check (Check BEFORE match so arrangement/chronology questions never become fake match tables)
  const isSeqCandidate =
    type === "sequence" ||
    Boolean(meta.items && meta.items.length >= 2) ||
    SEQUENCE_KEYWORDS_REGEX.test(rawText);

  if (isSeqCandidate) {
    const extractedSeq = extractSequenceQuestionData(rawText);
    if (extractedSeq && extractedSeq.items.length >= 2) {
      meta.items = extractedSeq.items;
      delete meta.left;
      delete meta.right;
      delete meta.leftTitle;
      delete meta.rightTitle;
      meta.rawQuestionText = rawText;
      return {
        ...q,
        type: "sequence",
        questionText: extractedSeq.cleanPrompt,
        question: extractedSeq.cleanPrompt,
        meta,
      };
    }
  }

  // 3. Statement MCQ Quality Gate Guard
  // Questions with statement evaluation options ('1 और 2 सही हैं', 'a और d', 'केवल 1') or corrupted meta
  // MUST NEVER be treated as match questions! Revert immediately to pure MCQ.
  const isStatementMcq =
    isStatementOptions(q.options) ||
    hasCorruptedMatchMeta(meta) ||
    (STATEMENT_EVALUATION_REGEX.test(rawText) &&
      !/(?:सूची|तालिका|सारणी|स्तंभ|कॉलम|List|Column|Table)\s*[-–—:\s]*(?:1|I|A)|(?:सुमेलित\s*(?:करें|कीजिए|कीजिये)|मिलान\s*(?:करें|कीजिए|कीजिये))/iu.test(
        rawText
      ));

  if (isStatementMcq) {
    if (meta.rawQuestionText) {
      questionText = meta.rawQuestionText;
    }
    delete meta.left;
    delete meta.right;
    delete meta.leftTitle;
    delete meta.rightTitle;
    delete meta.headers;
    delete meta.rows;
    delete meta.items;

    return {
      ...q,
      type: "mcq",
      questionText,
      question: questionText,
      meta,
    };
  }

  // 4. Match Question Check
  const hasExistingMatchMeta = Boolean(meta.left && meta.left.length >= 2 && meta.right && meta.right.length >= 2);
  const isMatchCandidate =
    hasExistingMatchMeta ||
    type === "match_following" ||
    /(?:सूची|तालिका|सारणी|स्तंभ|कॉलम|List|Column|Table|सुमेलित|मिलान|मिलाएं|मिलाइये|मिलाइए)/i.test(
      rawText
    );

  if (isMatchCandidate && !SEQUENCE_KEYWORDS_REGEX.test(rawText)) {
    if (hasExistingMatchMeta) {
      type = "match_following";
    } else {
      const extractedMatch = extractMatchQuestionData(rawText);
      if (extractedMatch && extractedMatch.left.length >= 2 && extractedMatch.right.length >= 2) {
        type = "match_following";
        meta.left = extractedMatch.left;
        meta.right = extractedMatch.right;
        meta.leftTitle = extractedMatch.leftTitle;
        meta.rightTitle = extractedMatch.rightTitle;
        meta.rawQuestionText = rawText;
        questionText = extractedMatch.cleanPrompt;
      }
    }
  }

  return {
    ...q,
    type,
    questionText,
    question: questionText,
    meta,
  };
}

