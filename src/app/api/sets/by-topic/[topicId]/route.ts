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

    const sets = getPublishedSetsList();
    const matchingSets = sets.filter(
      (s) => s.topicId === topicId || String(s.masterTopicId) === topicId
    );

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
