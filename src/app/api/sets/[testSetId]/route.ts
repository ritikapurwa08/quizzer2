import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// In-memory cache for published sets to provide sub-millisecond responses
let _setsCache: Map<string, any> | null = null;

function getPublishedSetsMap(): Map<string, any> {
  if (_setsCache) return _setsCache;

  const map = new Map<string, any>();
  const setsFilePath = path.join(process.cwd(), "data", "master-pool", "published-sets.json");

  if (fs.existsSync(setsFilePath)) {
    try {
      const raw = fs.readFileSync(setsFilePath, "utf-8");
      const sets: any[] = JSON.parse(raw);
      for (const s of sets) {
        if (s.id) map.set(s.id, s);
        if (s.setId) map.set(s.setId, s);
        if (s._id) map.set(s._id, s);
      }
    } catch (e) {
      console.error("Error loading published-sets.json:", e);
    }
  }

  _setsCache = map;
  return map;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ testSetId: string }> }
) {
  try {
    const { testSetId } = await context.params;
    if (!testSetId) {
      return NextResponse.json({ success: false, error: "Missing testSetId" }, { status: 400 });
    }

    const setsMap = getPublishedSetsMap();
    const set = setsMap.get(testSetId);

    if (!set) {
      return NextResponse.json({ success: false, error: "Set not found in published pool" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      set,
    });
  } catch (err: any) {
    console.error("Error fetching set:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
