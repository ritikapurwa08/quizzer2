import { NextRequest, NextResponse } from "next/server";
import { getAuthoritativeQuestion, normalizeQuestion } from "@/lib/questionPool";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids)) {
      return NextResponse.json({ success: false, error: "ids must be an array" }, { status: 400 });
    }

    const resolved: Record<string, any> = {};

    for (const rawId of ids) {
      if (!rawId) continue;
      const id = String(rawId);
      const rawQ = getAuthoritativeQuestion(id);
      if (rawQ) {
        resolved[id] = normalizeQuestion(rawQ);
      }
    }

    return NextResponse.json({
      success: true,
      questions: resolved,
    });
  } catch (err: any) {
    console.error("Error in /api/questions/resolve:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
