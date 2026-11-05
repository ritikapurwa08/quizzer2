import { NextRequest, NextResponse } from "next/server";
import { getHydratedPublishedSet } from "@/lib/questionPool";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ testSetId: string }> }
) {
  try {
    const { testSetId } = await context.params;
    if (!testSetId) {
      return NextResponse.json({ success: false, error: "Missing testSetId" }, { status: 400 });
    }

    const set = getHydratedPublishedSet(testSetId);

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
