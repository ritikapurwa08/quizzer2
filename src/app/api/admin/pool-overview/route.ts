import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { RAJASTHAN_GK_MASTER_SECTIONS } from "@/lib/constants/rajasthanGkMasterTopics";

export const dynamic = "force-dynamic";

// In-memory cache for published sets & topic lookups
let _publishedSetsData: any[] | null = null;
let _topicIdMapping: Record<string, string> | null = null;

function loadLocalSetsData() {
  const cwd = process.cwd();
  if (!_publishedSetsData) {
    const publishedPath = path.join(cwd, "data", "master-pool", "published-sets.json");
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
    const mapPath = path.join(cwd, "data", "master-pool", "topic-id-mapping.json");
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
    const cwd = process.cwd();
    const gkTopicsDir = path.join(cwd, "data", "ddd", "topics");
    const poolStateFile = path.join(cwd, "data", "ddd", "pool-state.json");

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

    // Aggregate sets and questions per master topic ID
    const liveStatsByMasterTopic = new Map<
      number,
      { setCount: number; questionCount: number; sets: Array<{ id: string; name: string; order: number; count: number }> }
    >();

    for (const s of publishedSets || []) {
      let masterTopicId: number | null = null;
      if (s.topicId && convexToMasterId.has(s.topicId)) {
        masterTopicId = convexToMasterId.get(s.topicId)!;
      }

      if (masterTopicId !== null) {
        const qCount = s.questionCount || (Array.isArray(s.questions) ? s.questions.length : 20);
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
    let grandLiveQuestions = 0;
    let grandLiveSets = 0;
    let grandUniqueUsed = 0;

    const GK_SECTIONS = RAJASTHAN_GK_MASTER_SECTIONS.filter((s) => s.code !== "E");

    for (const sec of GK_SECTIONS) {
      for (const top of sec.topics) {
        const padId = String(top.id).padStart(2, "0");
        let poolCount = 0;
        let subtopics: Array<{ name: string; count: number }> = [];

        // Read local JSON file from data/ddd/topics/
        try {
          if (fs.existsSync(gkTopicsDir)) {
            const files = fs.readdirSync(gkTopicsDir);
            const fileName = files.find((f) => f.startsWith(`${padId}_`) && f.endsWith(".json"));
            if (fileName) {
              const fileData = JSON.parse(fs.readFileSync(path.join(gkTopicsDir, fileName), "utf-8"));
              const questions: any[] = fileData.questions || [];
              poolCount = questions.length;

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
        const uniqueUsed = liveQuestionsCount; // Each set in published-sets has curated unique questions
        const remaining = Math.max(0, poolCount - uniqueUsed);
        const percentComplete = poolCount > 0 ? Math.min(100, Math.round((uniqueUsed / poolCount) * 100)) : 0;

        grandPoolTotal += poolCount;
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

    return NextResponse.json({
      success: true,
      summary: {
        totalMasterTopics: topicsList.length,
        totalSubjects: GK_SECTIONS.length,
        totalPoolQuestions: grandPoolTotal,
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
    });
  } catch (error: any) {
    console.error("Pool overview error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
