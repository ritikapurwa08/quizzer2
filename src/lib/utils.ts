import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatAccuracy(accuracy: number): string {
  return `${accuracy.toFixed(1)}%`;
}

export function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

export function containsDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Standardized display helper for Subjects.
 * Returns Hindi title if present, otherwise English title.
 * Keeps internal DB keys and slugs unchanged.
 */
export function getSubjectDisplayName(subject?: { name: string; nameHindi?: string } | null): string {
  if (!subject) return "";
  return subject.nameHindi?.trim() || subject.name || "";
}

/**
 * Standardized display helper for Topics.
 * Returns Hindi title if present, otherwise English title.
 * Keeps internal DB keys and slugs unchanged.
 */
export function getTopicDisplayName(topic?: { name: string; nameHindi?: string } | null): string {
  if (!topic) return "";
  return topic.nameHindi?.trim() || topic.name || "";
}

/**
 * Derives a display letter from a zero-based option index.
 * 0 → A, 1 → B, 2 → C, 3 → D, 4 → E, etc.
 * Also handles "opt1".."opt5" ID strings.
 */
export function getOptionLabel(indexOrId: number | string): string {
  if (typeof indexOrId === "number") {
    return String.fromCharCode(65 + indexOrId);
  }
  // Handle "opt1" → 0, "opt2" → 1, etc.
  const match = indexOrId.match(/^opt(\d+)$/);
  if (match && match[1]) {
    const idx = parseInt(match[1], 10) - 1;
    if (idx >= 0 && idx < 26) return String.fromCharCode(65 + idx);
  }
  return indexOrId;
}

function isInstructionLine(line: string): boolean {
  return /(?:सुमेलित|मिलान|कीजिए|करें|चुनिए|उत्तर|match|following|select|below|code|कूट|(?:को|से|with|and)\s*(?:सूची|List|Column))/i.test(line);
}

function isTableOrItemLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Standalone list header: e.g. "सूची-I                 सूची-II", "सूची-I:", "List-I List-II", "Column A"
  // but NOT instruction sentences like "सूची-I को सूची-II से सुमेलित कीजिए"
  if (/(?:सूची|List|Column)\s*[-–—:\s]*(?:I{1,3}|[12]|[AB])\b/i.test(trimmed)) {
    if (!isInstructionLine(trimmed)) {
      return true;
    }
  }

  // List bullet items: "A. ...", "(A) ...", "1. ...", "(i) ...", "i. ...", "(क) ..."
  if (/^(?:(?:\([A-Ea-e1-5\divxlc\u0915-\u0918]+\))|(?:[A-Ea-e1-5\divxlc\u0915-\u0918]+[\.\):]))\s+/i.test(trimmed)) {
    return true;
  }

  // Standalone "कूट:" / "Codes:"
  if (/^(?:कूट|Codes?)\s*[:=]?$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * For match_following (and similar list-based) questions, questionText often contains
 * both the instruction prompt and the raw text lists (List I / List II / सूची-I / सूची-II).
 * This function strips out the embedded raw text lists so only the clean instruction prompt is shown above the rendered boxes.
 */
export function cleanQuestionPrompt(text: string, type?: string): string {
  if (!text) return "";
  if (type && type !== "match_following") {
    return text;
  }

  const lines = text.split(/\r?\n/);
  const promptLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isTableOrItemLine(trimmed)) {
      break;
    }
    promptLines.push(trimmed);
  }

  const promptResult = promptLines.join("\n").trim();
  return promptResult || text;
}

/**
 * Intelligently shuffles options and balances correct answer distribution
 * across an entire set of questions, eliminating repetitive answer keys.
 * Supports both 4-option and 5-option questions dynamically.
 */
export function distributeAndShuffleAnswers<T extends {
  type: string;
  options: { id: string; text: string }[];
  correctAnswer: string | string[];
  [key: string]: any;
}>(questions: T[]): {
  shuffledQuestions: T[];
  distribution: Record<string, number>;
} {
  if (!questions || questions.length === 0) {
    return { shuffledQuestions: [], distribution: { opt1: 0, opt2: 0, opt3: 0, opt4: 0, opt5: 0 } };
  }

  const distribution: Record<string, number> = { opt1: 0, opt2: 0, opt3: 0, opt4: 0, opt5: 0 };

  // Pre-compute balanced slot sequences for 4 and 5 option lengths
  function buildBalancedSlots(slotCount: number, total: number): number[] {
    const slots = Array.from({ length: slotCount }, (_, i) => i);
    const balanced: number[] = [];
    let last = -1;
    while (balanced.length < total) {
      const round = [...slots].sort(() => Math.random() - 0.5);
      if (round[0] === last && round.length > 1) {
        [round[0], round[1]] = [round[1], round[0]];
      }
      for (const slot of round) {
        if (balanced.length < total) {
          balanced.push(slot);
          last = slot;
        }
      }
    }
    return balanced;
  }

  const slots4 = buildBalancedSlots(4, questions.length);
  const slots5 = buildBalancedSlots(5, questions.length);

  const shuffledQuestions = questions.map((q, idx) => {
    const optCount = Array.isArray(q.options) ? q.options.length : 0;
    // Only shuffle single-choice MCQ-style options with 4 or 5 options
    if (
      (q.type === "mcq" || q.type === "match_following" || q.type === "assertion_reason" || q.type === "statement_reason" || q.type === "sequence" || q.type === "table") &&
      (optCount === 4 || optCount === 5) &&
      typeof q.correctAnswer === "string"
    ) {
      const currentOptions = [...q.options];
      const correctOptIndex = currentOptions.findIndex((o) => o.id === q.correctAnswer);

      if (correctOptIndex !== -1) {
        const correctOpt = currentOptions[correctOptIndex];
        const distractors = currentOptions.filter((_, i) => i !== correctOptIndex);
        distractors.sort(() => Math.random() - 0.5);

        const targetIndex = optCount === 5 ? slots5[idx] : slots4[idx];
        const newOptionsList: { text: string }[] = [];

        let distractorIdx = 0;
        for (let i = 0; i < optCount; i++) {
          if (i === targetIndex) {
            newOptionsList.push({ text: correctOpt.text });
          } else {
            newOptionsList.push({ text: distractors[distractorIdx].text });
            distractorIdx++;
          }
        }

        const finalOptions = newOptionsList.map((item, i) => ({
          id: `opt${i + 1}`,
          text: item.text,
        }));

        const newCorrectId = `opt${targetIndex + 1}`;
        distribution[newCorrectId] = (distribution[newCorrectId] || 0) + 1;

        return {
          ...q,
          options: finalOptions,
          correctAnswer: newCorrectId,
        };
      }
    }

    return { ...q };
  });

  return { shuffledQuestions, distribution };
}

/**
 * Normalizes an exam name/reference string into a recognizable short exam name + year.
 * Examples:
 * - "RPSC Senior Teacher Grade II 2024" -> "RPSC 2nd Grade 2024"
 * - "Rajasthan Eligibility Examination for Teachers 2022" -> "REET 2022"
 * - "Rajasthan Administrative Service 2023" -> "RAS 2023"
 */
export function formatExamDisplay(
  rawExam?: string | null,
  rawYear?: string | number | null
): string {
  if (!rawExam && !rawYear) return "";
  let str = (rawExam != null ? String(rawExam) : "").trim();
  if (!str && !rawYear) return "";

  // Clean markdown/emoji/PYQ prefixes
  str = str.replace(/^[📌📍📄✎✦\s]+/, "");
  str = str.replace(/^(?:PYQ[_\s]*(?:EXACT|MODIFIED)?\s*[—–\-:·•]\s*)/i, "").trim();

  // Extract year
  let year = "";
  if (rawYear != null) {
    const yStr = String(rawYear).trim();
    if (/^\d{4}$/.test(yStr)) {
      year = yStr;
    }
  }

  // If no year passed in, extract 4-digit year from exam string (e.g. 1980-2035)
  if (!year) {
    const matchYear = str.match(/\b(19[89]\d|20[0-3]\d)\b/);
    if (matchYear) {
      year = matchYear[1];
    } else {
      // 2-digit year in date pattern e.g. 21-10-18
      const dateMatch = str.match(/\b\d{1,2}-\d{1,2}-(\d{2})\b/);
      if (dateMatch) {
        const y2 = parseInt(dateMatch[1], 10);
        year = y2 < 50 ? String(2000 + y2) : String(1900 + y2);
      }
    }
  }

  // Remove the year and surrounding parens from the string for abbreviation matching
  const clean = str
    .replace(/\b(19[89]\d|20[0-3]\d)\b/g, "")
    .replace(/\(\s*\)/g, "")
    .trim();

  let shortName = "";

  // 1. REET / Rajasthan Eligibility Examination for Teachers
  if (/Rajasthan Eligibility Examination for Teachers|REET/i.test(clean)) {
    shortName = "REET";
  }
  // 2. RPSC 2nd Grade / Senior Teacher Grade II
  else if (
    /Senior Teacher\s*(?:Grade|Gr)?\.?\s*(?:II|2)|Sr\.?\s*Teacher\s*(?:Grade|Gr)?\.?\s*(?:II|2)|2nd Grade/i.test(
      clean
    )
  ) {
    shortName = "RPSC 2nd Grade";
  }
  // 3. RPSC 1st Grade / School Lecturer
  else if (/School Lecturer|Lecturer\s*\(School|1st Grade/i.test(clean)) {
    shortName = "RPSC 1st Grade";
  }
  // 4. RAS / RTS / Rajasthan Administrative Service
  else if (
    /Rajasthan Administrative Service|State and Sub\. Services|RAS[\s\/-]*RTS|RPSC\s*RAS|RAS\s*Pre|\bRAS\b/i.test(
      clean
    )
  ) {
    shortName = "RAS";
  }
  // 5. 3rd Grade Teacher / Primary Teacher
  else if (/3rd Grade|Third Grade|Primary School Teacher|Teacher Gr[\s\.]*III/i.test(clean)) {
    shortName = "3rd Grade Teacher";
  }
  // 6. Common Eligibility Test / CET
  else if (/\bCET\b|Common Eligibility Test/i.test(clean)) {
    if (/Graduate|Grad/i.test(clean)) shortName = "CET Graduate";
    else if (/12th|Senior Secondary|Sr\.?\s*Sec/i.test(clean)) shortName = "CET 12th Level";
    else shortName = "CET";
  }
  // 7. Police Constable
  else if (/Police Constable|Constable/i.test(clean)) {
    shortName = "Police Constable";
  }
  // 8. Sub Inspector / Police SI
  else if (/Sub[\s-]*Inspector|Police SI|\bRPSC SI\b|\bSI Exam\b/i.test(clean)) {
    shortName = "Sub Inspector";
  }
  // 9. Patwar / Patwari
  else if (/Patwar/i.test(clean)) {
    shortName = "Patwar";
  }
  // 10. VDO / Village Development Officer / Gram Sevak
  else if (/Village Development Officer|Gram Sevak|\bVDO\b/i.test(clean)) {
    shortName = "VDO";
  }
  // 11. Lab Assistant
  else if (/Lab Assistant/i.test(clean)) {
    shortName = "Lab Assistant";
  }
  // 12. Animal Attendant / Pashu Parichar
  else if (/Animal Attendant|Pashu Parichar/i.test(clean)) {
    shortName = "Animal Attendant";
  }
  // 13. Forest Guard / Forester
  else if (/Forest Guard|Vanrakshak/i.test(clean)) {
    shortName = "Forest Guard";
  } else if (/Forester|Vanpal/i.test(clean)) {
    shortName = "Forester";
  }
  // 14. Agriculture Supervisor
  else if (/Agriculture Supervisor/i.test(clean)) {
    shortName = "Agriculture Supervisor";
  }
  // 15. AAO / Asst. Agriculture Officer
  else if (/Asst(?:t)?\.?\s*Agriculture Officer|\bAAO\b/i.test(clean)) {
    shortName = "AAO";
  }
  // 16. Agriculture Officer / ARO
  else if (/Agriculture Officer|\bAO\b/i.test(clean)) {
    shortName = "Agriculture Officer";
  } else if (/Agriculture Research Officer|\bARO\b/i.test(clean)) {
    shortName = "ARO";
  }
  // 17. Assistant Professor / College Lecturer
  else if (
    /Assistant Professor|Asst\.?\s*Prof|Lect\.?\s*College Edu|College Lecturer/i.test(
      clean
    )
  ) {
    shortName = "Asst. Professor";
  }
  // 18. Junior Engineer / JEN
  else if (/Junior Engineer|\bJEN\b/i.test(clean)) {
    shortName = "JEN";
  }
  // 19. Librarian Grade III / II / generic
  else if (/Librarian Grade III|Librarian Gr[\s\.]*III/i.test(clean)) {
    shortName = "Librarian Grade III";
  } else if (/Librarian Grade II|Librarian Gr[\s\.]*II/i.test(clean)) {
    shortName = "Librarian Grade II";
  } else if (/Librarian/i.test(clean)) {
    shortName = "Librarian";
  }
  // 20. Computor / Sanganak
  else if (/Computor|Sanganak/i.test(clean)) {
    shortName = "Computor";
  }
  // 21. Stenographer / Steno
  else if (/Stenographer|Steno/i.test(clean)) {
    shortName = "Stenographer";
  }
  // 22. Junior Accountant / TRA
  else if (
    /Junior Accountant|Jr\.?\s*Accountant|Tehsil Revenue Accountant|\bTRA\b/i.test(
      clean
    )
  ) {
    shortName = "Junior Accountant";
  }
  // 23. ASO / Asst. Statistical Officer
  else if (/Asst(?:t)?\.?\s*Statistical Officer|\bASO\b/i.test(clean)) {
    shortName = "ASO";
  }
  // 24. Statistical Officer
  else if (/Statistical Officer|\bSO\b/i.test(clean)) {
    shortName = "Statistical Officer";
  }
  // 25. Jail Warder / Jail Prahari
  else if (/Jail Warder|Jail Prahari|Prahari/i.test(clean)) {
    shortName = "Jail Warder";
  }
  // 26. High Court LDC / LDC / Clerk Grade II
  else if (/High Court LDC/i.test(clean)) {
    shortName = "High Court LDC";
  } else if (
    /Clerk Grade[\s-]*II|Clerk GR[\s-]*II|\bLDC\b|Junior Assistant|Jr\.?\s*Asst/i.test(
      clean
    )
  ) {
    shortName = "LDC";
  }
  // 27. EO / RO
  else if (/\bEO\s*[\/-]?\s*RO\b/i.test(clean)) {
    shortName = "RPSC EO/RO";
  }
  // 28. RSSB 4th Class / Group D
  else if (/Fourth Class|Class IV|Group D/i.test(clean)) {
    shortName = "RSSB 4th Class";
  }
  // 29. Junior Instructor
  else if (/Junior Instructor/i.test(clean)) {
    shortName = "Junior Instructor";
  }
  // 30. Computer Instructor
  else if (/Computer Instructor/i.test(clean)) {
    shortName = "Computer Instructor";
  }
  // 31. Protection Officer
  else if (/Protection Officer/i.test(clean)) {
    shortName = "Protection Officer";
  }
  // 32. Evaluation Officer
  else if (/Evaluation Officer/i.test(clean)) {
    shortName = "Evaluation Officer";
  }
  // 33. Veterinary Officer
  else if (/Veterinary Officer/i.test(clean)) {
    shortName = "Veterinary Officer";
  }
  // Fallback: strip noise words and format clean string
  else {
    const fallback = clean
      .replace(/Comp\.?\s*Exam/gi, "")
      .replace(/Exam(?:ination)?/gi, "")
      .replace(/\(.*?\)/g, "")
      .replace(/Paper\s*[-–]?\s*[I|1|2|II]+/gi, "")
      .replace(/Shift\s*[-–]?\s*\d+/gi, "")
      .replace(/[-–:·•]+$/, "")
      .trim();
    shortName = fallback || clean;
  }

  if (year) {
    return `${shortName} ${year}`;
  }
  return shortName;
}


