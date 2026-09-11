import { NextRequest, NextResponse } from "next/server";
import { getRelevantPyqQuestions } from "@/lib/pyqRetrieval";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, topic, subtopic, maxResults = 100, usedQuestionIds = [] } = body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const result = getRelevantPyqQuestions(
      {
        subject: subject || undefined,
        topic: topic.trim(),
        subtopic: subtopic || undefined,
      },
      {
        maxResults: Math.min(200, Math.max(1, Number(maxResults) || 100)),
        usedQuestionIds: Array.isArray(usedQuestionIds) ? usedQuestionIds : [],
      }
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("PYQ retrieval error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve PYQ batch." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject") || undefined;
  const topic = searchParams.get("topic") || "";
  const subtopic = searchParams.get("subtopic") || undefined;
  const maxResults = parseInt(searchParams.get("maxResults") || "100", 10);
  const usedIdsStr = searchParams.get("usedIds");
  const usedQuestionIds = usedIdsStr
    ? usedIdsStr.split(",").map((id) => parseInt(id.trim(), 10)).filter((n) => !isNaN(n))
    : [];

  if (!topic) {
    return NextResponse.json({ error: "Topic query parameter is required." }, { status: 400 });
  }

  const result = getRelevantPyqQuestions(
    { subject, topic, subtopic },
    { maxResults, usedQuestionIds }
  );

  return NextResponse.json(result);
}
