import { NextRequest, NextResponse } from "next/server";
import { getAllGkQuestions } from "@/lib/questionPool";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
    const pageSize = Math.min(1000, Math.max(50, parseInt(searchParams.get("pageSize") || "500", 10)));

    const gkOnly = getAllGkQuestions();

    const start = page * pageSize;
    const slice = gkOnly.slice(start, start + pageSize);

    const mapped = slice.map((q: any) => ({
      id: String(q.id),
      masterTopicId: Number(q.masterTopicId) || 0,
      masterTopic: q.masterTopic || q.topic || "",
      question: q.questionText || q.question || "",
      questionText: q.questionText || q.question || "",
      options: Array.isArray(q.options) ? q.options : [],
      answer: q.answer || "A",
      exam: q.exam || undefined,
      year: q.year || undefined,
      explanation: q.explanation || undefined,
      inConvex: Boolean(q.inConvex),
      repeatCount: Number(q.repeatCount) || 0,
      type: q.type || "mcq",
      meta: q.meta || {},
    }));

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      total: gkOnly.length,
      questions: mapped,
    });
  } catch (err: any) {
    console.error("Error loading local pool:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
