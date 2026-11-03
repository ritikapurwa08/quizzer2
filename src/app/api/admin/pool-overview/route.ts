import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { RAJASTHAN_GK_MASTER_SECTIONS } from "@/lib/constants/rajasthanGkMasterTopics";
import { hasConvexBackup, getBackupInventory } from "@/lib/convex-backup";

export const dynamic = "force-dynamic";

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

    // Prioritize local convex backup to prevent exhausting live Convex Cloud quota
    let liveInventory: any = null;
    let duplicateAudit: any = null;

    if (hasConvexBackup()) {
      const backupData = getBackupInventory();
      if (backupData) {
        liveInventory = { subjects: backupData.subjects };
        duplicateAudit = {
          totalDuplicates: backupData.totalDuplicates,
          report: backupData.duplicateReport,
        };
      }
    }

    // Only fallback to Convex Cloud if local backup is missing
    if (!liveInventory) {
      try {
        const urlsToCheck = Array.from(new Set([
          "https://shiny-wildcat-270.convex.cloud",
          process.env.NEXT_PUBLIC_CONVEX_URL,
        ])).filter(Boolean) as string[];

        for (const prodUrl of urlsToCheck) {
          try {
            const [invRes, dupRes] = await Promise.all([
              fetch(`${prodUrl}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: "audit:getLiveInventory", args: {} }),
              }),
              fetch(`${prodUrl}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: "audit:auditDuplicates", args: {} }),
              }),
            ]);

            if (invRes.ok) {
              const invJson = await invRes.json();
              if (invJson.value) liveInventory = invJson.value;
            }
            if (dupRes.ok) {
              const dupJson = await dupRes.json();
              if (dupJson.value) duplicateAudit = dupJson.value;
            }
            if (liveInventory) break;
          } catch {
            // Try next url
          }
        }
      } catch (convexErr) {
        console.error("Error fetching live inventory from Convex:", convexErr);
      }
    }

    // Map live topics by nameHindi, name, and slug
    const liveTopicMap = new Map<string, any>();
    if (liveInventory?.subjects) {
      for (const sub of liveInventory.subjects) {
        for (const top of sub.topics) {
          if (top.nameHindi) liveTopicMap.set(top.nameHindi, top);
          if (top.name) liveTopicMap.set(top.name, top);
          if (top.slug) liveTopicMap.set(top.slug, top);
        }
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
      const targetDir = gkTopicsDir;

      for (const top of sec.topics) {
        const padId = String(top.id).padStart(2, "0");
        let poolCount = 0;
        let subtopics: Array<{ name: string; count: number }> = [];

        // Read local JSON file
        try {
          if (fs.existsSync(targetDir)) {
            const files = fs.readdirSync(targetDir);
            const fileName = files.find((f) => f.startsWith(`${padId}_`) && f.endsWith(".json"));
            if (fileName) {
              const fileData = JSON.parse(fs.readFileSync(path.join(targetDir, fileName), "utf-8"));
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

        const liveData =
          liveTopicMap.get(top.nameHindi) ||
          liveTopicMap.get(top.name) || {
            setCount: 0,
            questionCount: 0,
            uniqueUsedSourceCount: 0,
            sets: [],
          };

        const liveSetsCount = liveData.setCount || 0;
        const liveQuestionsCount = liveData.questionCount || 0;
        const uniqueUsed = liveData.uniqueUsedSourceCount || 0;
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
          sets: liveData.sets || [],
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalMasterTopics: topicsList.length,
        totalSubjects: RAJASTHAN_GK_MASTER_SECTIONS.length,
        totalPoolQuestions: grandPoolTotal,
        totalLiveQuestions: grandLiveQuestions,
        totalLiveSets: grandLiveSets,
        totalUniqueUsed: grandUniqueUsed,
        totalRemaining: grandPoolTotal - grandUniqueUsed,
        totalDuplicatesInDb: duplicateAudit?.totalDuplicates || 0,
        duplicateReport: duplicateAudit?.report || [],
      },
      topics: topicsList,
      sections: RAJASTHAN_GK_MASTER_SECTIONS.map((s) => ({
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
