import { NextResponse } from "next/server";
import { getPublishedManifests } from "@/lib/questionPool";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const manifests = getPublishedManifests();
    const topicCounts: Record<string, number> = {};
    for (const s of manifests) {
      if (s.topicId) {
        topicCounts[s.topicId] = (topicCounts[s.topicId] || 0) + 1;
      }
    }
    return NextResponse.json({
      success: true,
      topicCounts,
      totalSets: manifests.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

