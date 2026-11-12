import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DATA_PATHS } from "@/lib/dataPaths";

export const dynamic = "force-dynamic";

let _setsListCache: any[] | null = null;

function getPublishedSetsList(): any[] {
  if (_setsListCache) return _setsListCache;

  const setsFilePath = DATA_PATHS.publishedSets;
  if (fs.existsSync(setsFilePath)) {
    try {
      const raw = fs.readFileSync(setsFilePath, "utf-8");
      _setsListCache = JSON.parse(raw);
    } catch (e) {
      console.error("Error loading published-sets.json:", e);
      _setsListCache = [];
    }
  } else {
    _setsListCache = [];
  }

  return _setsListCache || [];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await context.params;
    if (!topicId) {
      return NextResponse.json({ success: false, error: "Missing topicId" }, { status: 400 });
    }

    let targetConvexId = topicId;
    let targetMasterId: string | null = null;

    // Load topicId mapping if available to resolve between numeric masterTopicId and Convex topicId
    const mapPath = DATA_PATHS.topicIdMapping;
    let topicMap: Record<string, string> = {};
    if (fs.existsSync(mapPath)) {
      try {
        topicMap = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
      } catch (err) {
        console.error("Error reading topicIdMapping:", err);
      }
    }

    if (/^\d+$/.test(topicId)) {
      targetMasterId = topicId;
      if (topicMap[topicId]) {
        targetConvexId = topicMap[topicId];
      }
    } else {
      for (const [mId, cId] of Object.entries(topicMap)) {
        if (cId === topicId) {
          targetMasterId = mId;
          break;
        }
      }
    }

    const sets = getPublishedSetsList();
    const matchingSets = sets.filter((s) => {
      if (s.status === "archived" || s.isArchived) return false;
      if (s.topicId === topicId || s.topicId === targetConvexId) return true;
      if (targetMasterId && String(s.masterTopicId) === targetMasterId) return true;
      return false;
    });

    // Return lightweight set headers (without heavy question bodies)
    const setHeaders = matchingSets.map((s) => ({
      _id: s.id,
      id: s.id,
      name: s.name,
      topicId: s.topicId,
      order: s.order ?? 0,
      questionCount: s.questionCount ?? (s.questionIds ? s.questionIds.length : (s.questions ? s.questions.length : 20)),
      negativeMarking: s.negativeMarking !== false,
      isLocal: true,
    }));

    return NextResponse.json({
      success: true,
      sets: setHeaders,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
