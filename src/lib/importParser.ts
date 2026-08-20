import { importJsonSchema, ImportJson, QuestionInput, normalizeMinifiedQuestion } from "./validators/question";

/**
 * Strips markdown code fences from LLM output, e.g.:
 * ```json
 * [...]
 * ```
 */
export function stripMarkdownFences(raw: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  return raw
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

/**
 * Automatically fixes common JSON syntax errors:
 * - Trailing commas before } or ]
 * - Single quotes used instead of double quotes for keys/strings
 * - JS line comments (// ...)
 * - Unbalanced closing brackets/braces
 */
export function autoFixJson(rawJson: string): { fixedText: string; success: boolean } {
  // First strip markdown fences if present
  let cleaned = stripMarkdownFences(rawJson);

  // 1. Strip single-line comments // ...
  cleaned = cleaned.replace(/^\s*\/\/.*$/gm, "");

  // 2. Fix trailing commas before } or ]
  cleaned = cleaned.replace(/(,)(\s*[\}\]])/g, "$2");

  // 3. Replace single quotes around keys or string values with double quotes
  // Replace 'key': with "key":
  cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'(\s*):/g, '"$1"$2:');
  // Replace : 'value' with : "value"
  cleaned = cleaned.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
  // Replace array items 'item' with "item"
  cleaned = cleaned.replace(/\[\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, '["$1"');
  cleaned = cleaned.replace(/,\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ', "$1"');

  // 4. Try balancing unclosed braces/brackets
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") openBraces++;
      else if (char === "}") openBraces = Math.max(0, openBraces - 1);
      else if (char === "[") openBrackets++;
      else if (char === "]") openBrackets = Math.max(0, openBrackets - 1);
    }
  }

  while (openBrackets > 0) {
    cleaned += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    cleaned += "}";
    openBraces--;
  }

  // Verify if fixed string parses as JSON and auto-repair schema edge-cases
  try {
    const obj = JSON.parse(cleaned);
    let modified = false;

    const qArray = Array.isArray(obj) ? obj : Array.isArray(obj?.questions) ? obj.questions : null;

    if (qArray) {
      for (let i = 0; i < qArray.length; i++) {
        const q = qArray[i];
        if (!q || typeof q !== "object") continue;

        // Detect and normalize minified format in-place
        if ("q" in q && !("questionText" in q)) {
          const normalized = normalizeMinifiedQuestion(q);
          if (normalized) {
            qArray[i] = normalized;
            modified = true;
          }
          continue;
        }

        // Legacy: fix match_following without meta
        if (
          (q.type === "match_following" || q.type === "match") &&
          !(q.meta?.left || q.meta?.columnA)
        ) {
          q.meta = {
            ...(q.meta || {}),
            left: [],
            right: [],
          };
          modified = true;
        }
      }

      // Wrap array into object if needed
      if (Array.isArray(obj)) {
        const finalResult = modified ? JSON.stringify({ questions: qArray }, null, 2) : cleaned;
        // But keep array format if it's already valid
        const asArray = JSON.stringify(qArray, null, 2);
        return { fixedText: modified ? asArray : cleaned, success: true };
      }
    }

    const finalResult = modified ? JSON.stringify(obj, null, 2) : cleaned;
    return { fixedText: finalResult, success: true };
  } catch {
    return { fixedText: cleaned, success: false };
  }
}

export interface IsolatedImportResult {
  validQuestions: QuestionInput[];
  invalidQuestions: { index: number; raw: any; reason: string }[];
  totalParsed: number;
  metadata?: {
    subject?: string;
    topic?: string;
    testSet?: string;
    negativeMarking?: boolean;
  };
}

/**
 * Validates an import payload and isolates valid vs invalid questions.
 * This prevents a single malformed question from failing the entire import batch.
 */
export function validateAndIsolateQuestions(rawJsonOrObj: string | any): IsolatedImportResult {
  let parsedObj: any = rawJsonOrObj;

  if (typeof rawJsonOrObj === "string") {
    const trimmed = rawJsonOrObj.trim();
    if (!trimmed) {
      return { validQuestions: [], invalidQuestions: [], totalParsed: 0 };
    }
    try {
      parsedObj = JSON.parse(trimmed);
    } catch {
      const { fixedText, success } = autoFixJson(trimmed);
      if (success) {
        try {
          parsedObj = JSON.parse(fixedText);
        } catch {
          return {
            validQuestions: [],
            invalidQuestions: [{ index: 1, raw: trimmed, reason: "Invalid JSON syntax." }],
            totalParsed: 0,
          };
        }
      } else {
        return {
          validQuestions: [],
          invalidQuestions: [{ index: 1, raw: trimmed, reason: "Invalid JSON syntax." }],
          totalParsed: 0,
        };
      }
    }
  }

  const rawQuestions: any[] = Array.isArray(parsedObj)
    ? parsedObj
    : Array.isArray(parsedObj?.questions)
    ? parsedObj.questions
    : [];

  const metadata = Array.isArray(parsedObj)
    ? undefined
    : {
        subject: parsedObj?.subject,
        topic: parsedObj?.topic,
        testSet: parsedObj?.testSet,
        negativeMarking: parsedObj?.negativeMarking,
      };

  const validQuestions: QuestionInput[] = [];
  const invalidQuestions: { index: number; raw: any; reason: string }[] = [];

  rawQuestions.forEach((item, idx) => {
    const qNum = idx + 1;
    if (!item || typeof item !== "object") {
      invalidQuestions.push({
        index: qNum,
        raw: item,
        reason: `Question ${qNum}: Item is not a valid question object.`,
      });
      return;
    }

    const rawOpts = item.o ?? item.options;
    if (!Array.isArray(rawOpts) || rawOpts.length < 2) {
      invalidQuestions.push({
        index: qNum,
        raw: item,
        reason: `Question ${qNum}: Invalid options — expected 4 options, received ${Array.isArray(rawOpts) ? rawOpts.length : 0}.`,
      });
      return;
    }

    // Try normalizing and parsing with schema
    const normalized = normalizeMinifiedQuestion(item);
    if (!normalized) {
      invalidQuestions.push({
        index: qNum,
        raw: item,
        reason: `Question ${qNum}: Missing question text or invalid structure.`,
      });
      return;
    }

    validQuestions.push(normalized);
  });

  return {
    validQuestions,
    invalidQuestions,
    totalParsed: rawQuestions.length,
    metadata,
  };
}

/**
 * Parses raw plain text question blocks into standard ImportJson format.
 *
 * Example input format:
 * Question: What is the capital of Rajasthan?
 * A. Jodhpur
 * B. Jaipur
 * C. Udaipur
 * D. Kota
 * Answer: B
 * Explanation: Jaipur is the capital city of Rajasthan.
 */
export function parsePlainTextQuestions(
  text: string,
  defaultSubject = "General Studies",
  defaultTopic = "General Knowledge",
  defaultSet = "Practice Set 1"
): { data: ImportJson | null; error: string | null } {
  if (!text || !text.trim()) {
    return { data: null, error: "Input text is empty." };
  }

  const lines = text.split(/\r?\n/);
  const questions: QuestionInput[] = [];

  let currentSubject = defaultSubject;
  let currentTopic = defaultTopic;
  let currentSet = defaultSet;

  let currentQuestionText = "";
  let currentOptions: { id: string; text: string }[] = [];
  let currentAnswer = "";
  let currentExplanation = "";
  let currentDifficulty: "easy" | "medium" | "hard" = "medium";

  function finalizeQuestion() {
    if (!currentQuestionText.trim()) return;

    // Ensure we have options
    if (currentOptions.length === 0) return;

    // Determine correct answer ID
    let finalAnswerId = currentAnswer.trim();
    if (!finalAnswerId) {
      finalAnswerId = currentOptions[0]?.id ?? "opt1";
    } else {
      // If Answer is "A", "B", "C", "D", map to option id if options use opt1..opt4 or A..D
      const upperAns = finalAnswerId.toUpperCase().replace(/[^A-D1-4]/g, "");
      if (upperAns === "A" || upperAns === "1") {
        finalAnswerId = currentOptions[0]?.id ?? "opt1";
      } else if (upperAns === "B" || upperAns === "2") {
        finalAnswerId = currentOptions[1]?.id ?? "opt2";
      } else if (upperAns === "C" || upperAns === "3") {
        finalAnswerId = currentOptions[2]?.id ?? "opt3";
      } else if (upperAns === "D" || upperAns === "4") {
        finalAnswerId = currentOptions[3]?.id ?? "opt4";
      } else {
        // Try matching option ID directly
        const matchOpt = currentOptions.find((o) => o.id.toLowerCase() === finalAnswerId.toLowerCase());
        if (matchOpt) finalAnswerId = matchOpt.id;
      }
    }

    // Standardize to 4 options if fewer exist
    while (currentOptions.length < 4) {
      const id = `opt${currentOptions.length + 1}`;
      currentOptions.push({ id, text: `Option ${currentOptions.length + 1}` });
    }

    questions.push({
      type: "mcq",
      questionText: currentQuestionText.trim(),
      options: currentOptions.slice(0, 4),
      correctAnswer: finalAnswerId,
      explanation: currentExplanation.trim() || undefined,
      difficulty: currentDifficulty,
    });

    // Reset accumulators
    currentQuestionText = "";
    currentOptions = [];
    currentAnswer = "";
    currentExplanation = "";
    currentDifficulty = "medium";
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? "";
    if (!line) continue;

    // Header metadata check
    if (/^Subject\s*:/i.test(line)) {
      currentSubject = line.replace(/^Subject\s*:/i, "").trim() || defaultSubject;
      continue;
    }
    if (/^Topic\s*:/i.test(line)) {
      currentTopic = line.replace(/^Topic\s*:/i, "").trim() || defaultTopic;
      continue;
    }
    if (/^Set\s*:/i.test(line) || /^TestSet\s*:/i.test(line)) {
      currentSet = line.replace(/^(Set|TestSet)\s*:/i, "").trim() || defaultSet;
      continue;
    }

    // Check for Question start: "Question:", "Q1.", "Q1:", "1.", "1)"
    const qMatch = line.match(/^(?:Question\s*\d*[:.]?|Q\d*[:.]?|\d+[\).?])\s*(.*)/i);
    if (qMatch && !/^A[\.)] /i.test(line) && !/^B[\.)] /i.test(line) && !/^C[\.)] /i.test(line) && !/^D[\.)] /i.test(line)) {
      // If we already had a question, finalize it
      if (currentQuestionText) {
        finalizeQuestion();
      }
      currentQuestionText = qMatch[1]?.trim() || line;
      continue;
    }

    // Check for Options: A. / B. / C. / D. or (A) / (B) / (C) / (D) or 1. / 2. / 3. / 4.
    const optMatch = line.match(/^(?:(?:[A-D1-4][\).])|(?:\([A-D1-4]\)))\s*(.*)/i);
    if (optMatch && currentQuestionText) {
      const rawOptId = line.substring(0, 3).replace(/[^A-D1-4]/gi, "").toUpperCase();
      let optId = "opt1";
      if (rawOptId === "A" || rawOptId === "1") optId = "opt1";
      else if (rawOptId === "B" || rawOptId === "2") optId = "opt2";
      else if (rawOptId === "C" || rawOptId === "3") optId = "opt3";
      else if (rawOptId === "D" || rawOptId === "4") optId = "opt4";
      else optId = `opt${currentOptions.length + 1}`;

      currentOptions.push({
        id: optId,
        text: optMatch[1]?.trim() || line,
      });
      continue;
    }

    // Check for Answer: Answer: B / Ans: B / Correct Answer: B
    const ansMatch = line.match(/^(?:Answer|Ans|Correct\s*Answer)\s*[:=]?\s*(.*)/i);
    if (ansMatch && currentQuestionText) {
      currentAnswer = ansMatch[1]?.trim() || "";
      continue;
    }

    // Check for Explanation: Explanation: ... / Exp: ...
    const expMatch = line.match(/^(?:Explanation|Exp|Reason)\s*[:=]?\s*(.*)/i);
    if (expMatch && currentQuestionText) {
      currentExplanation = expMatch[1]?.trim() || "";
      continue;
    }

    // Check for Difficulty: Difficulty: easy/medium/hard
    const diffMatch = line.match(/^Difficulty\s*[:=]?\s*(easy|medium|hard)/i);
    if (diffMatch && currentQuestionText) {
      currentDifficulty = diffMatch[1]?.toLowerCase() as "easy" | "medium" | "hard";
      continue;
    }

    // If none of the above and we are accumulating question text, append line
    if (currentQuestionText && currentOptions.length === 0 && !currentAnswer) {
      currentQuestionText += "\n" + line;
    } else if (currentExplanation) {
      currentExplanation += "\n" + line;
    }
  }

  // Finalize last question in file
  finalizeQuestion();

  if (questions.length === 0) {
    return {
      data: null,
      error: "Could not parse any valid questions. Please check the text format.",
    };
  }

  const payload: ImportJson = {
    subject: currentSubject,
    topic: currentTopic,
    testSet: currentSet,
    negativeMarking: true,
    questions,
  };

  const validation = importJsonSchema.safeParse(payload);
  if (!validation.success) {
    return {
      data: payload,
      error: validation.error.issues.map((i) => i.message).join(", "),
    };
  }

  return { data: payload, error: null };
}
