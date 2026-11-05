import fs from "fs";
import path from "path";
import { DATA_PATHS } from "@/lib/dataPaths";
import { enrichQuestionStructure } from "@/lib/matchQuestionParser";
import { healOptionText } from "@/lib/optionTextHealer";

export interface NormalizedOption {
  id: string;
  text: string;
}

export interface HydratedQuestion {
  _id: string;
  id: string;
  order?: number;
  canonicalId?: string;
  convexId?: string;
  type: string;
  questionText: string;
  question?: string;
  options: NormalizedOption[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  reference?: string;
  meta?: Record<string, any>;
  [key: string]: any;
}

export interface SetManifest {
  id: string;
  name: string;
  topicId: string;
  masterTopicId?: number;
  negativeMarking?: boolean;
  order?: number;
  questionCount?: number;
  questionIds: string[];
  [key: string]: any;
}

export interface HydratedSet extends Omit<SetManifest, "questionIds"> {
  questions: HydratedQuestion[];
}

// In-memory singletons for zero-latency retrieval
let _questionIndex: Map<string, any> | null = null;
let _gkQuestionsCache: any[] | null = null;
let _allQuestionsCache: any[] | null = null;
let _idMappingCache: Record<string, string> | null = null;
let _publishedManifestsCache: SetManifest[] | null = null;

function getIdMapping(): Record<string, string> {
  if (_idMappingCache) return _idMappingCache;
  if (fs.existsSync(DATA_PATHS.idMapping)) {
    try {
      _idMappingCache = JSON.parse(fs.readFileSync(DATA_PATHS.idMapping, "utf-8"));
    } catch {
      _idMappingCache = {};
    }
  } else {
    _idMappingCache = {};
  }
  return _idMappingCache || {};
}

const ANSWER_LETTER_TO_OPT: Record<string, string> = {
  A: "opt1",
  B: "opt2",
  C: "opt3",
  D: "opt4",
  "1": "opt1",
  "2": "opt2",
  "3": "opt3",
  "4": "opt4",
};

export function normalizeQuestion(rawQ: any, index: number = 0): HydratedQuestion {
  const q = enrichQuestionStructure(rawQ);
  const qId = q._id || q.id || q.convexId || q.canonicalId || `q_${index + 1}`;

  const options: NormalizedOption[] = (q.options || []).map((opt: any, optIdx: number) => {
    const rawText = typeof opt === "string" ? opt : opt?.text || "";
    const healed = healOptionText(rawText);
    return {
      id: opt?.id || `opt${optIdx + 1}`,
      text: healed,
    };
  });

  const rawQText = q.questionText || q.question || "";
  const healedQText = healOptionText(rawQText);

  let correctAnswer = q.correctAnswer;
  if (!correctAnswer) {
    if (q.answerIndex !== undefined && q.answerIndex >= 0) {
      correctAnswer = `opt${q.answerIndex + 1}`;
    } else if (q.answer) {
      const a = String(q.answer).toUpperCase().trim();
      correctAnswer = ANSWER_LETTER_TO_OPT[a] || "opt1";
    } else {
      correctAnswer = "opt1";
    }
  }

  const meta = q.meta || {
    exam: q.exam,
    year: q.year,
    sourceTopic: q.sourceTopic || q.topic,
    masterTopicId: q.masterTopicId,
  };

  const reference = q.reference || (q.exam ? `📌 PYQ — ${q.exam}${q.year ? ` ${q.year}` : ""}` : undefined);

  return {
    ...q,
    _id: qId,
    id: qId,
    order: index,
    type: q.type || "mcq",
    questionText: healedQText,
    question: healedQText,
    options,
    correctAnswer,
    explanation: q.explanation || "",
    difficulty: q.difficulty || "medium",
    reference,
    meta,
  };
}

export function buildQuestionIndex(): Map<string, any> {
  if (_questionIndex) return _questionIndex;

  const index = new Map<string, any>();
  const allGk: any[] = [];
  const allList: any[] = [];

  // 1. Index 55 Rajasthan GK topic files
  const gkDir = DATA_PATHS.gkTopicsDir;
  if (fs.existsSync(gkDir)) {
    const files = fs.readdirSync(gkDir).filter((f) => f.endsWith(".json"));
    // Sort topic_01 to topic_55 numerically
    files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const file of files) {
      try {
        const filePath = path.join(gkDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const list: any[] = Array.isArray(data) ? data : data.questions || [];
        for (const q of list) {
          allGk.push(q);
          allList.push(q);
          const qId = q.id || q.canonicalId;
          if (qId) {
            index.set(String(qId), q);
            index.set(String(qId).toLowerCase(), q);
          }
          if (q.convexId) {
            index.set(String(q.convexId), q);
          }
        }
      } catch (err) {
        console.error(`Failed to load ${file}:`, err);
      }
    }
  }

  // 2. Index English topic files
  const engTopicsDir = path.join(DATA_PATHS.englishDir, "topics");
  if (fs.existsSync(engTopicsDir)) {
    const engFiles = fs.readdirSync(engTopicsDir).filter((f) => f.endsWith(".json"));
    for (const file of engFiles) {
      try {
        const filePath = path.join(engTopicsDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const list: any[] = Array.isArray(data) ? data : data.questions || [];
        for (const q of list) {
          allList.push(q);
          const qId = q.id || q.canonicalId;
          if (qId) {
            index.set(String(qId), q);
            index.set(String(qId).toLowerCase(), q);
          }
          if (q.convexId) {
            index.set(String(q.convexId), q);
          }
        }
      } catch (err) {
        console.error(`Failed to load English file ${file}:`, err);
      }
    }
  }

  _gkQuestionsCache = allGk;
  _allQuestionsCache = allList;
  _questionIndex = index;
  return index;
}

export function getAuthoritativeQuestion(idOrKey: string): any | null {
  if (!idOrKey) return null;
  const index = buildQuestionIndex();
  const direct = index.get(idOrKey) || index.get(idOrKey.toLowerCase());
  if (direct) return direct;

  const idMap = getIdMapping();
  const mapped = idMap[idOrKey];
  if (mapped) {
    return index.get(mapped) || index.get(mapped.toLowerCase()) || null;
  }

  return null;
}

export function getAllGkQuestions(): any[] {
  if (_gkQuestionsCache) return _gkQuestionsCache;
  buildQuestionIndex();
  return _gkQuestionsCache || [];
}

export function getAllQuestions(): any[] {
  if (_allQuestionsCache) return _allQuestionsCache;
  buildQuestionIndex();
  return _allQuestionsCache || [];
}

export function getPublishedManifests(): SetManifest[] {
  if (_publishedManifestsCache) return _publishedManifestsCache;

  const setsFilePath = DATA_PATHS.publishedSets;
  if (!fs.existsSync(setsFilePath)) {
    _publishedManifestsCache = [];
    return [];
  }

  try {
    const raw = fs.readFileSync(setsFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    _publishedManifestsCache = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading published sets:", err);
    _publishedManifestsCache = [];
  }

  return _publishedManifestsCache || [];
}

export function hydrateSet(manifest: SetManifest): HydratedSet {
  const index = buildQuestionIndex();
  const idMap = getIdMapping();

  const qIds = manifest.questionIds || [];
  const hydratedQuestions: HydratedQuestion[] = [];

  qIds.forEach((rawId, i) => {
    let rawQ = index.get(rawId) || index.get(rawId.toLowerCase());
    if (!rawQ && idMap[rawId]) {
      const canonical = idMap[rawId];
      rawQ = index.get(canonical) || index.get(canonical.toLowerCase());
    }

    if (rawQ) {
      hydratedQuestions.push(normalizeQuestion(rawQ, i));
    }
  });

  return {
    ...manifest,
    questions: hydratedQuestions,
  };
}

export function getHydratedPublishedSet(setId: string): HydratedSet | null {
  const manifests = getPublishedManifests();
  const match = manifests.find((s) => s.id === setId || (s as any).setId === setId || (s as any)._id === setId);
  if (!match) return null;
  return hydrateSet(match);
}
