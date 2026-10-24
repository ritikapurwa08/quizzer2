import fs from "fs";
import path from "path";

// 53 Duplicate question numbers identified and verified
export const DUPLICATE_QUESTION_NUMBERS = new Set([
  21, 26, 31, 32, 33, 35, 40, 41, 44, 46, 50, 51, 52, 54, 60, 61, 62, 63, 64, 68,
  79, 81, 82, 83, 84, 85, 86, 90, 91, 92, 93, 94, 95, 96, 100, 101, 103, 105, 106,
  108, 111, 112, 113, 114, 115, 116, 148, 158, 161, 171, 172, 180, 182
]);

export interface RawQuestion {
  question_number: number;
  question: string;
  exam_tag?: string;
  options: Record<string, string>;
  answer: string;
}

export function extractYear(tag?: string): number {
  if (!tag) return 2026;
  const match = tag.match(/\b(20\d{2}|19\d{2})\b/);
  return match ? parseInt(match[1], 10) : 2026;
}

export function extractExamName(tag?: string): string {
  if (!tag) return "RPSC Standard Exam";
  return tag.replace(/[()[\]]/g, "").trim();
}

export function generateGrammarExplanation(qText: string, correctOptText: string, answerLetter: string): string {
  const t = qText.toLowerCase();
  const ans = (correctOptText || "").toLowerCase();

  if (t.includes("yesterday") || t.includes("last year") || t.includes("last week") || t.includes("ago") || t.includes("1990")) {
    return `Rule: Past time adverbials ('yesterday', 'ago', 'last year', specific past date) require the Simple Past Tense (V2 / did + V1).\nहिंदी व्याख्या: भूतकाल के निश्चित समय-सूचक शब्दों के साथ Simple Past Tense ('${correctOptText}') का प्रयोग होता है।`;
  }
  if (t.includes("since") || t.includes("for six") || t.includes("for ten") || t.includes("for years") || t.includes("for five")) {
    return `Rule: Action continuing from the past up to the present with 'since' (point of time) or 'for' (period of time) takes Present Perfect Continuous (has/have been + V-ing) or Present Perfect.\nहिंदी व्याख्या: 'Since / For + समय' होने पर कार्य के निरंतर जारी रहने को व्यक्त करने के लिए '${correctOptText}' का प्रयोग सही है।`;
  }
  if (t.includes("by the time") || t.includes("by tomorrow") || t.includes("by the end") || t.includes("by next")) {
    return `Rule: Future deadlines marked by 'by + time' express completion before a future point, requiring Future Perfect (will/shall have + V3) or Future Perfect Continuous.\nहिंदी व्याख्या: 'By + भविष्य का समय' होने पर कार्य की पूर्णता दर्शाने हेतु Future Perfect / '${correctOptText}' का प्रयोग होता है।`;
  }
  if (t.includes("if ") || t.includes("if he") || t.includes("if you") || t.includes("if they")) {
    return `Rule: Conditional clause structure:\n- Type 1: If + Simple Present, will + V1\n- Type 2: If + Simple Past (were/V2), would + V1\n- Type 3: If + Past Perfect (had + V3), would have + V3.\nहिंदी व्याख्या: शर्त सूचक वाक्य (Conditional Sentence) के नियमानुसार सही क्रिया रूप '${correctOptText}' है।`;
  }
  if (t.includes("it is time") || t.includes("it's time")) {
    return `Rule: After the phrase 'It is time / It is high time + Subject', the subjunctive Past Simple (V2) is used to denote an action that should have already been done.\nहिंदी व्याख्या: 'It is time + Subject' के बाद हमेशा Past Indefinite (V2) का प्रयोग किया जाता है।`;
  }
  if (t.includes("question tag") || t.includes("tag question") || t.endsWith("?")) {
    return `Rule: Question Tag Rule: Positive statement takes a negative tag (auxiliary + n't + pronoun), and negative statement takes a positive tag.\nहिंदी व्याख्या: सकारात्मक वाक्य का टैग नकारात्मक (और नकारात्मक का सकारात्मक) होता है। अतः सही विकल्प '${correctOptText}' है।`;
  }
  if (t.includes("always") || t.includes("generally") || t.includes("usually") || t.includes("often") || t.includes("every day") || t.includes("daily")) {
    return `Rule: Adverbs of frequency ('always', 'generally', 'often', 'usually') expressing routine habits or universal truths take Simple Present Tense (V1 / V1+s/es).\nहिंदी व्याख्या: आदत अथवा नियमित दिनचर्या दर्शाने के लिए Present Indefinite Tense ('${correctOptText}') प्रयुक्त होता है।`;
  }

  return `Rule & Explanation: According to standard English grammar rules and tense agreement, '${correctOptText}' is the correct form to complete the sentence meaningfully.\nहिंदी व्याख्या: वाक्य के संदर्भ और काल-संरचना (Tense concord) के अनुसार सही विकल्प (${answerLetter}) '${correctOptText}' है।`;
}

console.log("Helper module created.");
