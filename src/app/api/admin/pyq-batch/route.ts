import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

interface ManifestTopic {
  masterTopic: string;
  inputCount: number;
  keepCount: number;
  batchCount: number;
  finalBatchFiles: string[];
}

interface ManifestFile {
  summary: Record<string, unknown>;
  topics: ManifestTopic[];
}

function findMasterTopic(topicInput: string, manifestTopics: ManifestTopic[]): ManifestTopic | null {
  const cleanInput = topicInput.trim();
  if (!cleanInput) return null;

  // 1. Exact match
  const exact = manifestTopics.find((t) => t.masterTopic === cleanInput);
  if (exact) return exact;

  // 2. Replace / with _ or vice versa
  const slashToUnderscore = cleanInput.replace(/\//g, "_");
  const match1 = manifestTopics.find((t) => t.masterTopic === slashToUnderscore);
  if (match1) return match1;

  const underscoreToSlash = cleanInput.replace(/_/g, "/");
  const match2 = manifestTopics.find((t) => t.masterTopic === underscoreToSlash);
  if (match2) return match2;

  // 3. Normalized whitespace and punctuation
  const normInput = cleanInput.replace(/[^\p{L}\p{N}]+/gu, " ").trim().toLowerCase();
  const match3 = manifestTopics.find((t) => {
    const normT = t.masterTopic.replace(/[^\p{L}\p{N}]+/gu, " ").trim().toLowerCase();
    return normT === normInput;
  });
  if (match3) return match3;

  return null;
}

function extractBatchIndex(subtopicInput: string): number {
  if (!subtopicInput) return 1;
  const m =
    subtopicInput.match(/(?:Part|भाग|Set|सेट|Batch|बैच)\s*(\d+)/i) ||
    subtopicInput.match(/(\d+)/);
  if (m && m[1]) {
    const num = parseInt(m[1], 10);
    return num > 0 ? num : 1;
  }
  return 1;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicParam = searchParams.get("topic") || "";
    const setParam = searchParams.get("set") || "1";

    if (!topicParam.trim()) {
      return NextResponse.json(
        { success: false, error: "Topic is required" },
        { status: 400 }
      );
    }

    const baseDir = path.join(process.cwd(), "src", "xdata", "final_pyq_batches");
    const manifestPath = path.join(baseDir, "MANIFEST_FINAL.json");

    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json({
        success: false,
        error: "Final PYQ manifest file missing from repository.",
      });
    }

    const manifest: ManifestFile = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const matchedTopic = findMasterTopic(topicParam, manifest.topics);

    if (!matchedTopic) {
      return NextResponse.json({
        success: false,
        error: "इस Topic/Set का Final PYQ batch नहीं मिला। पहले सही batch उपलब्ध कराएँ।",
      });
    }

    const batchIndex = extractBatchIndex(setParam);
    const batchFileName = `batch_${String(batchIndex).padStart(3, "0")}.json`;

    // Verify if batch file is part of this topic's manifest
    if (!matchedTopic.finalBatchFiles.includes(batchFileName)) {
      return NextResponse.json({
        success: false,
        error: "इस Topic/Set का Final PYQ batch नहीं मिला। पहले सही batch उपलब्ध कराएँ।",
      });
    }

    const batchFilePath = path.join(baseDir, matchedTopic.masterTopic, batchFileName);
    if (!fs.existsSync(batchFilePath)) {
      return NextResponse.json({
        success: false,
        error: "इस Topic/Set का Final PYQ batch नहीं मिला। पहले सही batch उपलब्ध कराएँ।",
      });
    }

    const rawBatchData = JSON.parse(fs.readFileSync(batchFilePath, "utf-8"));
    const rawQuestions: any[] = Array.isArray(rawBatchData.questions)
      ? rawBatchData.questions
      : [];

    if (rawQuestions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "इस Topic/Set का Final PYQ batch नहीं मिला। पहले सही batch उपलब्ध कराएँ।",
      });
    }

    // Format questions for clean prompt injection with provenance
    const formattedQuestions = rawQuestions.map((q: any) => {
      const options = Array.isArray(q.options)
        ? q.options.map((o: any) => (typeof o === "string" ? o.trim() : String(o.text ?? "").trim()))
        : [];

      let ansIdx = 0;
      if (typeof q.correctAnswer === "number") {
        ansIdx = q.correctAnswer;
      } else if (typeof q.correctAnswer === "string") {
        const match = q.correctAnswer.match(/^opt(\d+)$/i);
        if (match) {
          ansIdx = parseInt(match[1], 10) - 1;
        } else {
          const idx = q.options?.findIndex((o: any) => (typeof o === "string" ? o : o.id) === q.correctAnswer);
          ansIdx = idx !== -1 ? idx : 0;
        }
      }

      return {
        q: String(q.questionText ?? "").trim(),
        o: options,
        a: ansIdx,
        e: String(q.explanation ?? "").trim(),
        t: String(q.type ?? "mcq").trim(),
        sourceType: String(q.meta?.sourceType ?? "PYQ").trim(),
        ...(q.meta?.sourceQuestionId ? { sourceQuestionId: q.meta.sourceQuestionId } : {}),
        ...(q.meta?.exam ? { exam: String(q.meta.exam).trim() } : {}),
        ...(q.meta?.year ? { year: q.meta.year } : {}),
        ...(q.reference ? { reference: String(q.reference).trim() } : {}),
      };
    });

    const questionsText = JSON.stringify(formattedQuestions, null, 2);

    return NextResponse.json({
      success: true,
      masterTopic: matchedTopic.masterTopic,
      batchName: rawBatchData.batchName || `${matchedTopic.masterTopic} भाग ${batchIndex}`,
      batchIndex,
      batchFileName,
      questionCount: formattedQuestions.length,
      questions: formattedQuestions,
      questionsText,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load PYQ batch." },
      { status: 500 }
    );
  }
}
