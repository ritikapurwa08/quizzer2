import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  getAllQuestions,
  getAuthoritativeQuestion,
  normalizeQuestion,
  invalidateQuestionPoolCache,
  getPublishedManifests,
  HydratedQuestion,
} from "@/lib/questionPool";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";
import { DATA_PATHS } from "@/lib/dataPaths";

export const dynamic = "force-dynamic";

function getSetsForTopic(masterTopicId?: number | null): Array<{ id: string; name: string; questionCount: number; order: number }> {
  if (!masterTopicId) return [];
  const manifests = getPublishedManifests();
  const topicInfo = MASTER_TOPICS_LIST.find((t) => t.id === masterTopicId);
  const cleanTopicName = topicInfo ? topicInfo.nameHindi.replace(/\s*\(.*?\)/g, "").trim() : "";

  const matching = manifests.filter((s) => {
    if (s.masterTopicId && Number(s.masterTopicId) === masterTopicId) return true;
    if (cleanTopicName && s.name && s.name.includes(cleanTopicName)) return true;
    return false;
  });

  return matching
    .map((s) => ({
      id: s.id,
      name: s.name,
      questionCount: s.questionIds ? s.questionIds.length : (s.questions ? s.questions.length : 20),
      order: s.order ?? 0,
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term")?.trim().toLowerCase() || "";
    const subject = searchParams.get("subject")?.trim() || "";
    const masterTopicIdParam = searchParams.get("masterTopicId");
    const masterTopicId = masterTopicIdParam && masterTopicIdParam !== "all" ? parseInt(masterTopicIdParam, 10) : null;
    const setId = searchParams.get("setId")?.trim() || "";
    const questionType = searchParams.get("type")?.trim().toLowerCase() || "";
    const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    let all: any[] = [];

    // 1. If a specific Practice Set is selected, load its exact questions in set order
    if (setId && setId !== "all") {
      const manifests = getPublishedManifests();
      const targetSet = manifests.find((s) => s.id === setId || (s as any)._id === setId);
      if (targetSet && targetSet.questionIds) {
        all = targetSet.questionIds
          .map((id) => getAuthoritativeQuestion(id))
          .filter(Boolean);
      } else {
        all = [];
      }
    } else {
      all = getAllQuestions();

      // Filter by Master Topic if provided
      if (masterTopicId && !isNaN(masterTopicId)) {
        all = all.filter((q) => Number(q.masterTopicId || q.topicId) === masterTopicId);
      } else if (subject && subject !== "all") {
        const allowedTopicIds = new Set(
          MASTER_TOPICS_LIST.filter(
            (mt) =>
              mt.subjectHindi.toLowerCase().includes(subject.toLowerCase()) ||
              mt.subjectName.toLowerCase().includes(subject.toLowerCase())
          ).map((mt) => mt.id)
        );
        all = all.filter((q) => allowedTopicIds.has(Number(q.masterTopicId || q.topicId)));
      }
    }

    // 2. Filter by question type if requested (e.g. match_following, table, sequence, mcq)
    if (questionType && questionType !== "all") {
      all = all.filter((q) => {
        const t = (q.type || "mcq").toLowerCase();
        return t === questionType;
      });
    }

    // 3. Filter by search term
    if (term) {
      all = all.filter((q) => {
        const text = (q.question || q.questionText || "").toLowerCase();
        const expl = (q.explanation || "").toLowerCase();
        const id = (q.id || q.canonicalId || q._id || "").toLowerCase();
        const exam = (q.exam || "").toLowerCase();
        return text.includes(term) || expl.includes(term) || id.includes(term) || exam.includes(term);
      });
    }

    const total = all.length;
    const totalPages = Math.ceil(total / limit);
    const start = page * limit;
    const paginated = all.slice(start, start + limit).map((q, idx) => normalizeQuestion(q, start + idx));

    // Get sets available for the selected topic
    const availableSets = masterTopicId ? getSetsForTopic(masterTopicId) : [];

    return NextResponse.json({
      success: true,
      questions: paginated,
      total,
      page,
      totalPages,
      limit,
      availableSets,
      masterTopics: MASTER_TOPICS_LIST,
    });
  } catch (err: any) {
    console.error("GET /api/admin/questions error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, ...updates } = body;

    if (!questionId || typeof questionId !== "string") {
      return NextResponse.json(
        { success: false, message: "Missing or invalid questionId" },
        { status: 400 }
      );
    }

    // Find the authoritative question to determine its file location
    const existing = getAuthoritativeQuestion(questionId);
    let targetFilePath: string | null = null;
    let masterTopicId = updates.masterTopicId || existing?.masterTopicId || existing?.topicId;

    if (masterTopicId && Number(masterTopicId) >= 1 && Number(masterTopicId) <= 55) {
      const num = Number(masterTopicId);
      const filename = `topic_${String(num).padStart(2, "0")}.json`;
      const candidate = path.join(DATA_PATHS.gkTopicsDir, filename);
      if (fs.existsSync(candidate)) {
        targetFilePath = candidate;
      }
    } else if (masterTopicId && Number(masterTopicId) >= 56) {
      const engDir = DATA_PATHS.englishTopicsDir;
      if (fs.existsSync(engDir)) {
        const files = fs.readdirSync(engDir).filter((f) => f.endsWith(".json"));
        const pad = String(masterTopicId).padStart(2, "0");
        const match = files.find((f) => f.startsWith(pad));
        if (match) {
          targetFilePath = path.join(engDir, match);
        }
      }
    }

    // Fallback: search all 55 GK topic files for this question ID
    if (!targetFilePath && fs.existsSync(DATA_PATHS.gkTopicsDir)) {
      const files = fs.readdirSync(DATA_PATHS.gkTopicsDir).filter((f) => f.endsWith(".json"));
      for (const f of files) {
        const p = path.join(DATA_PATHS.gkTopicsDir, f);
        try {
          const raw = fs.readFileSync(p, "utf-8");
          if (raw.includes(`"${questionId}"`)) {
            targetFilePath = p;
            break;
          }
        } catch {}
      }
    }

    // Fallback: search English topic files
    if (!targetFilePath && fs.existsSync(DATA_PATHS.englishTopicsDir)) {
      const files = fs.readdirSync(DATA_PATHS.englishTopicsDir).filter((f) => f.endsWith(".json"));
      for (const f of files) {
        const p = path.join(DATA_PATHS.englishTopicsDir, f);
        try {
          const raw = fs.readFileSync(p, "utf-8");
          if (raw.includes(`"${questionId}"`)) {
            targetFilePath = p;
            break;
          }
        } catch {}
      }
    }

    if (!targetFilePath || !fs.existsSync(/*turbopackIgnore: true*/ targetFilePath)) {
      return NextResponse.json(
        { success: false, message: `Question ${questionId} file not found.` },
        { status: 404 }
      );
    }

    // Read and parse target file
    const fileContent = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ targetFilePath, "utf-8"));
    const list: any[] = Array.isArray(fileContent) ? fileContent : fileContent.questions || [];
    const idx = list.findIndex(
      (q) =>
        String(q.id || "").toLowerCase() === questionId.toLowerCase() ||
        String(q.canonicalId || "").toLowerCase() === questionId.toLowerCase() ||
        String(q._id || "").toLowerCase() === questionId.toLowerCase()
    );

    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: `Question ${questionId} not found in ${path.basename(targetFilePath)}` },
        { status: 404 }
      );
    }

    const targetQ = list[idx];

    // Apply updates
    if (updates.questionText !== undefined) {
      targetQ.question = updates.questionText;
      targetQ.questionText = updates.questionText;
    }

    if (updates.options !== undefined && Array.isArray(updates.options)) {
      const isStringArray = Array.isArray(targetQ.options) && targetQ.options.length > 0 && typeof targetQ.options[0] === "string";
      if (isStringArray) {
        targetQ.options = updates.options.map((o: any) => (typeof o === "string" ? o : o.text || ""));
      } else {
        targetQ.options = updates.options.map((o: any, oIdx: number) => ({
          id: o.id || `opt${oIdx + 1}`,
          text: typeof o === "string" ? o : o.text || "",
        }));
      }
    }

    if (updates.correctAnswer !== undefined) {
      targetQ.correctAnswer = updates.correctAnswer;
      const optMatch = String(updates.correctAnswer).match(/opt(\d+)/i);
      if (optMatch) {
        const optNum = parseInt(optMatch[1], 10);
        const letters = ["A", "B", "C", "D", "E", "F"];
        targetQ.answer = letters[optNum - 1] || "A";
        targetQ.answerIndex = optNum - 1;
      } else {
        targetQ.answer = updates.correctAnswer;
      }
    }

    if (updates.explanation !== undefined) {
      targetQ.explanation = updates.explanation;
    }

    if (updates.difficulty !== undefined) {
      targetQ.difficulty = updates.difficulty;
    }

    if (updates.type !== undefined) {
      targetQ.type = updates.type;
    }

    if (updates.reference !== undefined) {
      targetQ.reference = updates.reference;
    }

    if (updates.meta !== undefined) {
      targetQ.meta = { ...(targetQ.meta || {}), ...updates.meta };
      if (updates.meta?.exam) {
        targetQ.exam = updates.meta.exam;
      }
    }

    // Save back to disk
    if (Array.isArray(fileContent)) {
      fs.writeFileSync(/*turbopackIgnore: true*/ targetFilePath, JSON.stringify(list, null, 2), "utf-8");
    } else {
      fileContent.questions = list;
      fs.writeFileSync(/*turbopackIgnore: true*/ targetFilePath, JSON.stringify(fileContent, null, 2), "utf-8");
    }

    // Invalidate memory cache so changes propagate to all sets and tests immediately
    invalidateQuestionPoolCache();

    const normalized = normalizeQuestion(targetQ, idx);

    return NextResponse.json({
      success: true,
      message: "Question updated successfully in local pool",
      question: normalized,
    });
  } catch (err: any) {
    console.error("PUT /api/admin/questions error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to update question" },
      { status: 500 }
    );
  }
}
