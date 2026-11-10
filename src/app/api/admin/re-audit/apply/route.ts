import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DATA_PATHS } from "@/lib/dataPaths";
import { invalidateQuestionPoolCache, getPublishedManifests } from "@/lib/questionPool";

export const dynamic = "force-dynamic";

function parseJsonFromText(text: string): any[] {
  let cleaned = text.trim();
  // Strip Markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
  }
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { setId, masterTopicId, rawText, questions: directQuestions } = body || {};

    let refixedQuestions: any[] = [];
    if (Array.isArray(directQuestions) && directQuestions.length > 0) {
      refixedQuestions = directQuestions;
    } else if (rawText && typeof rawText === "string") {
      try {
        refixedQuestions = parseJsonFromText(rawText);
      } catch (e: any) {
        return NextResponse.json(
          { success: false, message: `JSON Parsing Failed: ${e.message}` },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(refixedQuestions) || refixedQuestions.length === 0) {
      return NextResponse.json(
        { success: false, message: "No questions array found in input" },
        { status: 400 }
      );
    }

    // Determine target masterTopicId
    let targetTopicId = masterTopicId ? Number(masterTopicId) : null;
    let targetSet: any = null;

    if (setId) {
      const manifests = getPublishedManifests();
      targetSet = manifests.find((s) => s.id === setId || (s as any)._id === setId);
      if (targetSet && targetSet.masterTopicId) {
        targetTopicId = targetSet.masterTopicId;
      }
    }

    if (!targetTopicId && refixedQuestions[0]?.masterTopicId) {
      targetTopicId = Number(refixedQuestions[0].masterTopicId);
    }

    if (!targetTopicId) {
      return NextResponse.json(
        { success: false, message: "Could not determine masterTopicId for this set" },
        { status: 400 }
      );
    }

    const topicFilePath = path.join(
      DATA_PATHS.gkTopicsDir,
      `topic_${String(targetTopicId).padStart(2, "0")}.json`
    );

    if (!fs.existsSync(topicFilePath)) {
      return NextResponse.json(
        { success: false, message: `Topic file not found: ${path.basename(topicFilePath)}` },
        { status: 404 }
      );
    }

    // Read existing master topic file
    const rawFileContent = fs.readFileSync(topicFilePath, "utf-8");
    const parsedData = JSON.parse(rawFileContent);
    const existingList: any[] = Array.isArray(parsedData) ? parsedData : parsedData.questions || [];

    const existingMap = new Map<string, any>();
    existingList.forEach((q) => {
      if (q.id) existingMap.set(String(q.id).toLowerCase(), q);
    });

    let updatedCount = 0;
    const updatedIds: string[] = [];

    // Merge refixed questions into existing master pool
    for (const refixed of refixedQuestions) {
      const qid = refixed.id || refixed._id;
      if (!qid) continue;

      const existingQ = existingMap.get(String(qid).toLowerCase());
      if (existingQ) {
        // Update fields while preserving metadata
        if (refixed.question) {
          existingQ.question = refixed.question;
          existingQ.questionText = refixed.question;
        } else if (refixed.questionText) {
          existingQ.question = refixed.questionText;
          existingQ.questionText = refixed.questionText;
        }

        if (Array.isArray(refixed.options) && refixed.options.length > 0) {
          existingQ.options = refixed.options.map((o: any) =>
            typeof o === "string" ? o : o.text || ""
          );
        }

        if (refixed.answer !== undefined) {
          existingQ.answer = String(refixed.answer).toUpperCase();
        } else if (refixed.correctAnswer !== undefined) {
          existingQ.answer = String(refixed.correctAnswer).toUpperCase();
        }

        if (refixed.explanation) {
          existingQ.explanation = refixed.explanation;
        }

        if (refixed.type) {
          existingQ.type = refixed.type;
        }

        if (refixed.meta) {
          existingQ.meta = { ...(existingQ.meta || {}), ...refixed.meta };
        }

        updatedCount++;
        updatedIds.push(qid);
      }
    }

    // Write master topic file back
    if (Array.isArray(parsedData)) {
      fs.writeFileSync(topicFilePath, JSON.stringify(existingList, null, 2), "utf-8");
    } else {
      parsedData.questions = existingList;
      fs.writeFileSync(topicFilePath, JSON.stringify(parsedData, null, 2), "utf-8");
    }

    // Also update matching static set file if exists
    if (targetSet) {
      const setOrder = targetSet.order ?? 1;
      const setFilePath = path.join(
        DATA_PATHS.setsDir,
        `topic-${String(targetTopicId).padStart(2, "0")}`,
        `set-${String(setOrder).padStart(3, "0")}.json`
      );
      if (fs.existsSync(setFilePath)) {
        try {
          const rawSet = JSON.parse(fs.readFileSync(setFilePath, "utf-8"));
          if (Array.isArray(rawSet.questions)) {
            const refixedMap = new Map<string, any>(
              refixedQuestions.map((q) => [String(q.id || q._id).toLowerCase(), q])
            );
            rawSet.questions = rawSet.questions.map((q: any) => {
              const r = refixedMap.get(String(q.id || q._id).toLowerCase());
              return r ? { ...q, ...r } : q;
            });
            fs.writeFileSync(setFilePath, JSON.stringify(rawSet, null, 2), "utf-8");
          }
        } catch (e) {
          console.error("Error updating static set file:", e);
        }
      }
    }

    // Invalidate pool cache in memory
    invalidateQuestionPoolCache();

    // Clear any audit flags for these questions from flagged-questions.json
    if (fs.existsSync(DATA_PATHS.flaggedQuestions)) {
      try {
        const flagStore = JSON.parse(fs.readFileSync(DATA_PATHS.flaggedQuestions, "utf-8"));
        if (Array.isArray(flagStore.flags)) {
          const idSet = new Set(updatedIds.map((id) => id.toLowerCase()));
          const initialLen = flagStore.flags.length;
          flagStore.flags = flagStore.flags.filter(
            (f: any) => !idSet.has(String(f.questionId).toLowerCase())
          );
          if (flagStore.flags.length !== initialLen) {
            flagStore.totalCount = flagStore.flags.length;
            flagStore.updatedAt = new Date().toISOString();
            fs.writeFileSync(DATA_PATHS.flaggedQuestions, JSON.stringify(flagStore, null, 2), "utf-8");
          }
        }
      } catch (e) {
        console.error("Error updating flagged-questions.json:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully merged and updated ${updatedCount} questions in Topic #${targetTopicId}!`,
      updatedCount,
      updatedIds,
      masterTopicId: targetTopicId,
      setId,
    });
  } catch (err: any) {
    console.error("POST /api/admin/re-audit/apply error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to apply refixed questions" },
      { status: 500 }
    );
  }
}

