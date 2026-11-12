import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { RAJASTHAN_GK_MASTER_SECTIONS } from "@/lib/constants/rajasthanGkMasterTopics";
import { DATA_PATHS } from "@/lib/dataPaths";

export const dynamic = "force-dynamic";

// In-memory cache for published sets & topic lookups
let _publishedSetsData: any[] | null = null;
let _topicIdMapping: Record<string, string> | null = null;

function loadLocalSetsData() {
  if (!_publishedSetsData) {
    const publishedPath = DATA_PATHS.publishedSets;
    if (fs.existsSync(publishedPath)) {
      try {
        _publishedSetsData = JSON.parse(fs.readFileSync(publishedPath, "utf-8"));
      } catch (e) {
        console.error("Error reading published-sets.json:", e);
        _publishedSetsData = [];
      }
    } else {
      _publishedSetsData = [];
    }
  }

  if (!_topicIdMapping) {
    const mapPath = DATA_PATHS.topicIdMapping;
    if (fs.existsSync(mapPath)) {
      try {
        _topicIdMapping = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
      } catch (e) {
        console.error("Error reading topic-id-mapping.json:", e);
        _topicIdMapping = {};
      }
    } else {
      _topicIdMapping = {};
    }
  }

  return { sets: _publishedSetsData, topicMap: _topicIdMapping };
}

export async function GET() {
  try {
    const gkTopicsDir = DATA_PATHS.gkTopicsDir;
    const poolStateFile = DATA_PATHS.poolState;

    let poolState: any = null;
    if (fs.existsSync(poolStateFile)) {
      try {
        poolState = JSON.parse(fs.readFileSync(poolStateFile, "utf-8"));
      } catch (err) {
        console.error("Error reading pool-state.json:", err);
      }
    }

    const { sets: publishedSets, topicMap: masterToConvexMap } = loadLocalSetsData();

    // Reverse lookup: convexTopicId -> masterTopicId (number)
    const convexToMasterId = new Map<string, number>();
    for (const [mId, cId] of Object.entries(masterToConvexMap || {})) {
      convexToMasterId.set(cId, parseInt(mId, 10));
    }

    // Collect all unique published question IDs to accurately compute unassigned questions
    const allPublishedQuestionIds = new Set<string>();
    for (const s of publishedSets || []) {
      if (s.status === "archived" || s.isArchived) continue;
      if (Array.isArray(s.questionIds)) {
        for (const qid of s.questionIds) {
          allPublishedQuestionIds.add(String(qid));
        }
      }
    }

    // Aggregate sets and questions per master topic ID
    const liveStatsByMasterTopic = new Map<
      number,
      { setCount: number; questionCount: number; sets: Array<{ id: string; name: string; order: number; count: number }> }
    >();

    for (const s of publishedSets || []) {
      if (s.status === "archived" || s.isArchived) continue;
      let masterTopicId: number | null = null;
      if (s.topicId && convexToMasterId.has(s.topicId)) {
        masterTopicId = convexToMasterId.get(s.topicId)!;
      }

      if (masterTopicId !== null) {
        const qCount = s.questionCount || (Array.isArray(s.questionIds) ? s.questionIds.length : (Array.isArray(s.questions) ? s.questions.length : 20));
        const existing = liveStatsByMasterTopic.get(masterTopicId) || {
          setCount: 0,
          questionCount: 0,
          sets: [],
        };
        existing.setCount++;
        existing.questionCount += qCount;
        existing.sets.push({
          id: s._id || s.id || s.setId,
          name: s.name,
          order: s.order ?? existing.setCount,
          count: qCount,
        });
        liveStatsByMasterTopic.set(masterTopicId, existing);
      }
    }

    // Build topic overview for canonical GK sections only (A, B, C, D) — English (E) excluded
    const topicsList: any[] = [];
    let grandPoolTotal = 0;
    let grandArchivedVariants = 0;
    let grandPyqTotal = 0;
    let grandPracticeTotal = 0;
    let grandLiveQuestions = 0;
    let grandLiveSets = 0;
    let grandUniqueUsed = 0;
    const globalExamMap = new Map<string, number>();

    const GK_SECTIONS = RAJASTHAN_GK_MASTER_SECTIONS.filter((s) => s.code !== "E");

    for (const sec of GK_SECTIONS) {
      for (const top of sec.topics) {
        const padId = String(top.id).padStart(2, "0");
        let poolCount = 0;
        let pyqCount = 0;
        let practiceCount = 0;
        const topicExamMap = new Map<string, number>();
        let subtopics: Array<{ name: string; count: number }> = [];
        let unassignedCount = 0;

        // Read local JSON file from data/questions/rajasthan-gk/
        try {
          if (fs.existsSync(gkTopicsDir)) {
            const files = fs.readdirSync(gkTopicsDir);
            const fileName = files.find((f) => (f === `topic_${padId}.json` || f.startsWith(`${padId}_`)) && f.endsWith(".json"));
            if (fileName) {
              const fileData = JSON.parse(fs.readFileSync(path.join(gkTopicsDir, fileName), "utf-8"));
              const questions: any[] = fileData.questions || [];
              const archivedVariants: any[] = fileData.archivedVariants || [];
              poolCount = questions.length;
              grandArchivedVariants += archivedVariants.length;

              for (const q of questions) {
                // Exam / PYQ metadata extraction
                const ex = q.exam || (q.meta && q.meta.exam);
                const ref = q.reference || (q.meta && q.meta.reference);
                let examName = typeof ex === "string" ? ex.trim() : "";
                if (!examName && typeof ref === "string" && ref.includes("PYQ")) {
                  examName = ref.replace("📌 PYQ —", "").trim();
                }

                if (examName) {
                  pyqCount++;
                  topicExamMap.set(examName, (topicExamMap.get(examName) || 0) + 1);
                  globalExamMap.set(examName, (globalExamMap.get(examName) || 0) + 1);
                } else {
                  practiceCount++;
                }

                if (!allPublishedQuestionIds.has(String(q.id))) {
                  unassignedCount++;
                }
              }

              if (Array.isArray(fileData.subtopics) && fileData.subtopics.length > 0) {
                subtopics = fileData.subtopics;
              } else {
                const srcMap = new Map<string, number>();
                for (const q of questions) {
                  const sName = q.sourceTopic || "सामान्य";
                  srcMap.set(sName, (srcMap.get(sName) || 0) + 1);
                }
                subtopics = Array.from(srcMap.entries())
                  .map(([name, count]) => ({ name, count }))
                  .sort((a, b) => b.count - a.count);
              }
            }
          }
        } catch (err) {
          console.error(`Error reading topic file for ${top.id}:`, err);
        }

        const liveData = liveStatsByMasterTopic.get(top.id) || {
          setCount: 0,
          questionCount: 0,
          sets: [],
        };

        const liveSetsCount = liveData.setCount || 0;
        const liveQuestionsCount = liveData.questionCount || 0;
        const remaining = unassignedCount;
        const uniqueUsed = Math.max(0, poolCount - remaining);
        const percentComplete = poolCount > 0 ? Math.min(100, Math.round((uniqueUsed / poolCount) * 100)) : 0;

        grandPoolTotal += poolCount;
        grandPyqTotal += pyqCount;
        grandPracticeTotal += practiceCount;
        grandLiveQuestions += liveQuestionsCount;
        grandLiveSets += liveSetsCount;
        grandUniqueUsed += uniqueUsed;

        topicsList.push({
          id: top.id,
          name: top.name,
          nameHindi: top.nameHindi,
          subjectId: sec.code,
          subjectTitle: sec.titleHindi,
          subjectEnglish: sec.titleEnglish,
          poolTotal: poolCount,
          pyqCount,
          practiceCount,
          examBreakdown: Array.from(topicExamMap.entries())
            .map(([exam, count]) => ({ exam, count }))
            .sort((a, b) => b.count - a.count),
          liveSetsCount,
          liveQuestionsCount,
          uniqueUsed,
          remaining,
          percentComplete,
          subtopics,
          sets: liveData.sets.sort((a, b) => a.order - b.order),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalMasterTopics: topicsList.length,
          totalSubjects: GK_SECTIONS.length,
          totalPoolQuestions: grandPoolTotal,
          totalArchivedVariants: grandArchivedVariants,
          totalPyqQuestions: grandPyqTotal,
          totalPracticeQuestions: grandPracticeTotal,
          globalExamBreakdown: Array.from(globalExamMap.entries())
            .map(([exam, count]) => ({ exam, count }))
            .sort((a, b) => b.count - a.count),
          totalLiveQuestions: grandLiveQuestions,
          totalLiveSets: grandLiveSets,
          totalUniqueUsed: grandUniqueUsed,
          totalRemaining: Math.max(0, grandPoolTotal - grandUniqueUsed),
          totalDuplicatesInDb: 0,
          duplicateReport: [],
        },
        topics: topicsList,
        sections: GK_SECTIONS.map((s) => ({
          id: s.code,
          title: s.titleHindi,
          titleEnglish: s.titleEnglish,
          topicCount: s.topics.length,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Pool overview error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
