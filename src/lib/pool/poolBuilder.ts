import fs from "fs";
import path from "path";
import { QuestionDuplicateRegistry, normalizeQuestionText, computeQuestionFingerprint } from "./deduplication";
import { comparePoolQuestions } from "./sortQuestions";

export interface PreparedPoolQuestion {
  masterTopicId: number;
  masterTopic: string;
  source: string;
  sourceQuestionId: string;
  questionText: string;
  options: string[];
  correctAnswer: string | number;
  explanation?: string;
  exam?: string;
  year?: number;
  type: string;
  status: "AVAILABLE" | "PROCESSING" | "USED" | "REQUEUED" | "PERMANENTLY_EXCLUDED";
  queueOrder: number;
  rejectedCount: number;
  fingerprint: string;
  reference?: string;
}

import { MASTER_TOPICS_LIST, getTopicById, getTopicByName } from "./masterTopics";
export { MASTER_TOPICS_LIST, getTopicById, getTopicByName };


/**
 * Builds the prepared questions for all or a specific masterTopicId with multi-level deduplication.
 */
export function buildTopicPoolQuestions(targetTopicId?: number): {
  questionsByTopic: Map<number, PreparedPoolQuestion[]>;
  stats: {
    totalEvaluated: number;
    totalKept: number;
    totalUsed: number;
    totalDuplicates: number;
  };
} {
  const registry = new QuestionDuplicateRegistry();
  const cwd = process.cwd();

  // 1. Seed already-imported production Convex questions as USED
  const backupPath = path.join(
    cwd,
    "src",
    "xdata",
    "10-19-2026-latest_convex_backup",
    "questions",
    "documents.jsonl"
  );

  const usedQuestionNorms = new Set<string>();
  const usedSourceIds = new Set<string>();

  if (fs.existsSync(backupPath)) {
    const lines = fs.readFileSync(backupPath, "utf-8").trim().split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const q = JSON.parse(line);
        const norm = normalizeQuestionText(q.questionText);
        if (norm) usedQuestionNorms.add(norm);
        const sid = q.meta?.sourceQuestionId ? String(q.meta.sourceQuestionId).trim() : q._id;
        usedSourceIds.add(sid);
        const opts = (q.options || []).map((o: any) => (typeof o === "string" ? o : o.text));
        registry.register("Production", sid, q.questionText, opts);
      } catch {}
    }
  }

  const questionsByTopic = new Map<number, PreparedPoolQuestion[]>();
  for (const mt of MASTER_TOPICS_LIST) {
    if (!targetTopicId || mt.id === targetTopicId) {
      questionsByTopic.set(mt.id, []);
    }
  }

  let totalEvaluated = 0;
  let totalKept = 0;
  let totalUsed = 0;
  let totalDuplicates = 0;

  // Helper to process and push a question
  const processQuestion = (raw: {
    masterTopicId: number;
    masterTopic: string;
    source: string;
    sourceQuestionId: string;
    questionText: string;
    options: string[];
    correctAnswer: string | number;
    explanation?: string;
    exam?: string | null;
    year?: number | null;
    type?: string;
    reference?: string;
  }) => {
    totalEvaluated++;
    const topicId = raw.masterTopicId;
    if (targetTopicId && topicId !== targetTopicId) return;

    const list = questionsByTopic.get(topicId);
    if (!list) return;

    const norm = normalizeQuestionText(raw.questionText);
    if (!norm) return;

    // Check if already used in production
    const isAlreadyUsed = usedQuestionNorms.has(norm) || usedSourceIds.has(raw.sourceQuestionId);

    // Multi-level deduplication check
    const dupeCheck = registry.checkDuplicate(
      raw.source,
      raw.sourceQuestionId,
      raw.questionText,
      raw.options
    );

    if (dupeCheck.isDuplicate && !isAlreadyUsed) {
      totalDuplicates++;
      return;
    }

    registry.register(raw.source, raw.sourceQuestionId, raw.questionText, raw.options);

    const qOrder = list.length + 1;
    const status = isAlreadyUsed ? "USED" : "AVAILABLE";
    if (isAlreadyUsed) totalUsed++;
    else totalKept++;

    list.push({
      masterTopicId: topicId,
      masterTopic: raw.masterTopic,
      source: raw.source,
      sourceQuestionId: raw.sourceQuestionId,
      questionText: raw.questionText.trim(),
      options: raw.options,
      correctAnswer: raw.correctAnswer,
      explanation: raw.explanation ? raw.explanation.trim() : undefined,
      exam: raw.exam && raw.exam !== "null" ? raw.exam.trim() : undefined,
      year: typeof raw.year === "number" && raw.year >= 1950 ? raw.year : undefined,
      type: raw.type || "mcq",
      status,
      queueOrder: qOrder,
      rejectedCount: 0,
      fingerprint: computeQuestionFingerprint(raw.questionText, raw.options),
      reference: raw.reference || (raw.exam ? `📌 PYQ — ${raw.exam}${raw.year ? ` (${raw.year})` : ""}` : undefined),
    });
  };

  // 2. Load RajasthanGyan Dataset (ddd.json)
  const dddPath = path.join(cwd, "src", "xdata", "ddd.json");
  if (fs.existsSync(dddPath)) {
    const dddData: any[] = JSON.parse(fs.readFileSync(dddPath, "utf-8"));
    for (const item of dddData) {
      const mId = Number(item.masterTopicId);
      if (!mId || mId < 1 || mId > 75) continue;

      const mt = getTopicById(mId);
      const masterTopicName = mt ? mt.nameHindi : item.masterTopic || `Topic ${mId}`;

      const options = Array.isArray(item.options)
        ? item.options.map((o: any) => String(o).trim())
        : [];

      // Convert letter answer (A, B, C, D) to zero-based index or keep string
      let ans = item.answer;
      if (typeof ans === "string") {
        const u = ans.trim().toUpperCase();
        if (u === "A") ans = 0;
        else if (u === "B") ans = 1;
        else if (u === "C") ans = 2;
        else if (u === "D") ans = 3;
      }

      processQuestion({
        masterTopicId: mId,
        masterTopic: masterTopicName,
        source: "RajasthanGyan",
        sourceQuestionId: item.id || `rg_${totalEvaluated}`,
        questionText: item.question,
        options,
        correctAnswer: ans,
        explanation: item.explanation,
        exam: item.exam,
        year: item.year,
        type: "mcq",
      });
    }
  }

  // 3. Load Final PYQ batches (cross-topic enrichment)
  const pyqBaseDir = path.join(cwd, "src", "xdata", "final_pyq_batches");
  const manifestPath = path.join(pyqBaseDir, "MANIFEST_FINAL.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      for (const t of manifest.topics || []) {
        const matched = getTopicByName(t.masterTopic);
        if (!matched) continue;
        if (targetTopicId && matched.id !== targetTopicId) continue;

        for (const batchFile of t.finalBatchFiles || []) {
          const bPath = path.join(pyqBaseDir, t.masterTopic, batchFile);
          if (fs.existsSync(bPath)) {
            const bData = JSON.parse(fs.readFileSync(bPath, "utf-8"));
            for (const q of bData.questions || []) {
              const sid = q.meta?.sourceQuestionId
                ? `pyq_${q.meta.sourceQuestionId}`
                : `pyq_${Math.random().toString(36).slice(2, 9)}`;

              const options = Array.isArray(q.options)
                ? q.options.map((o: any) => (typeof o === "string" ? o.trim() : String(o.text ?? "").trim()))
                : [];

              let ans = q.correctAnswer;
              if (typeof ans === "string" && /^opt(\d+)$/i.test(ans)) {
                ans = parseInt(ans.slice(3), 10) - 1;
              }

              processQuestion({
                masterTopicId: matched.id,
                masterTopic: matched.nameHindi,
                source: "FinalPYQ",
                sourceQuestionId: sid,
                questionText: q.questionText,
                options,
                correctAnswer: ans,
                explanation: q.explanation,
                exam: q.meta?.exam,
                year: q.meta?.year,
                type: q.type || "mcq",
                reference: q.reference,
              });
            }
          }
        }
      }
    } catch {}
  }

  // Sort each topic's questions: Latest Exam Year -> Older Exam Year -> Non-Exam at end
  for (const [_, list] of questionsByTopic.entries()) {
    list.sort((a, b) => comparePoolQuestions({ ...a, id: a.sourceQuestionId }, { ...b, id: b.sourceQuestionId }));
    list.forEach((q, idx) => {
      q.queueOrder = idx + 1;
    });
  }

  return {
    questionsByTopic,
    stats: {
      totalEvaluated,
      totalKept,
      totalUsed,
      totalDuplicates,
    },
  };
}
