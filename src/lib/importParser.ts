import { importJsonSchema, ImportJson, QuestionInput } from "./validators/question";

/**
 * Automatically fixes common JSON syntax errors:
 * - Trailing commas before } or ]
 * - Single quotes used instead of double quotes for keys/strings
 * - JS line comments (// ...)
 * - Unbalanced closing brackets/braces
 */
export function autoFixJson(rawJson: string): { fixedText: string; success: boolean } {
  let cleaned = rawJson.trim();

  // 1. Strip single-line comments // ...
  cleaned = cleaned.replace(/^\s*\/\/.*$/gm, "");

  // 2. Fix trailing commas before } or ]
  cleaned = cleaned.replace(/,(\s*[\}\]])/g, "$1");

  // 3. Replace single quotes around keys or string values with double quotes
  // Replace 'key': with "key":
  cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '"$1":');
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
      for (const q of qArray) {
        if (q && typeof q === "object") {
          // Fix sequence without meta.items
          if (q.type === "sequence" && !q.meta?.items) {
            const extractedItems = Array.isArray(q.options)
              ? q.options.map((o: any) => o?.text || String(o)).filter(Boolean)
              : [];
            q.meta = {
              ...(q.meta || {}),
              items: extractedItems.length > 0 ? extractedItems : ["Item 1", "Item 2", "Item 3", "Item 4"],
            };
            modified = true;
          }

          // Fix match_following without meta.left/right or columnA/columnB
          if (q.type === "match_following" && !(q.meta?.left || q.meta?.columnA)) {
            const optTexts = Array.isArray(q.options)
              ? q.options.map((o: any) => o?.text || String(o)).filter(Boolean)
              : [];
            q.meta = {
              ...(q.meta || {}),
              left: optTexts.slice(0, 2).length > 0 ? optTexts.slice(0, 2) : ["List I - Item A", "List I - Item B"],
              right: optTexts.slice(2, 4).length > 0 ? optTexts.slice(2, 4) : ["List II - Item 1", "List II - Item 2"],
            };
            modified = true;
          }
        }
      }
    }

    const finalResult = modified ? JSON.stringify(obj, null, 2) : cleaned;
    return { fixedText: finalResult, success: true };
  } catch {
    return { fixedText: cleaned, success: false };
  }
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
    const qMatch = line.match(/^(?:Question\s*\d*[:.]?|Q\d*[:.]?|\d+[\).])\s*(.*)/i);
    if (qMatch && !/^A[\).]/i.test(line) && !/^B[\).]/i.test(line) && !/^C[\).]/i.test(line) && !/^D[\).]/i.test(line)) {
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
