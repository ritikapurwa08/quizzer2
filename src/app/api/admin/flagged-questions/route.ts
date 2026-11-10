import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DATA_PATHS } from "@/lib/dataPaths";

export const dynamic = "force-dynamic";

export interface FlaggedQuestionItem {
  questionId: string;
  testSetId?: string;
  questionNumber?: number;
  flagType: "wrong_answer" | "duplicate" | "similar" | "formatting";
  flagLabel: string;
  note?: string;
  questionText?: string;
  answer?: string;
  options?: any[];
  flaggedAt: number;
  flaggedBy?: string;
}

interface FlaggedQuestionsStore {
  updatedAt: string;
  totalCount: number;
  flags: FlaggedQuestionItem[];
}

const FLAG_LABELS: Record<string, string> = {
  wrong_answer: "गलत उत्तर / Wrong Answer",
  duplicate: "डुप्लीकेट प्रश्न / Duplicate Question",
  similar: "समान प्रश्न / Similar Question",
  formatting: "फॉर्मेटिंग त्रुटि / UI Glitch",
};

function readFlagsStore(): FlaggedQuestionsStore {
  try {
    if (fs.existsSync(DATA_PATHS.flaggedQuestions)) {
      const raw = fs.readFileSync(DATA_PATHS.flaggedQuestions, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.flags)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to read flagged-questions.json:", err);
  }
  return {
    updatedAt: new Date().toISOString(),
    totalCount: 0,
    flags: [],
  };
}

function writeFlagsStore(store: FlaggedQuestionsStore): boolean {
  try {
    const dir = path.dirname(DATA_PATHS.flaggedQuestions);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    store.totalCount = store.flags.length;
    store.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_PATHS.flaggedQuestions, JSON.stringify(store, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write flagged-questions.json:", err);
    return false;
  }
}

export async function GET() {
  try {
    const store = readFlagsStore();
    return NextResponse.json({
      success: true,
      updatedAt: store.updatedAt,
      totalCount: store.totalCount,
      flags: store.flags,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load flags" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      questionId,
      testSetId,
      questionNumber,
      flagType,
      note,
      questionText,
      answer,
      options,
      flaggedBy,
    } = body || {};

    if (!questionId || typeof questionId !== "string") {
      return NextResponse.json(
        { success: false, error: "questionId is required" },
        { status: 400 }
      );
    }

    if (!flagType || !FLAG_LABELS[flagType]) {
      return NextResponse.json(
        { success: false, error: `Invalid flagType: ${flagType}` },
        { status: 400 }
      );
    }

    const store = readFlagsStore();
    const existingIndex = store.flags.findIndex(
      (f) => f.questionId === questionId || (testSetId && f.testSetId === testSetId && f.questionNumber === questionNumber)
    );

    const newItem: FlaggedQuestionItem = {
      questionId: String(questionId),
      testSetId: testSetId ? String(testSetId) : undefined,
      questionNumber: typeof questionNumber === "number" ? questionNumber : undefined,
      flagType,
      flagLabel: FLAG_LABELS[flagType] || flagType,
      note: note ? String(note).trim() : undefined,
      questionText: questionText ? String(questionText).trim() : undefined,
      answer: answer !== undefined ? String(answer).trim() : undefined,
      options: Array.isArray(options) ? options : undefined,
      flaggedAt: Date.now(),
      flaggedBy: flaggedBy ? String(flaggedBy) : "admin",
    };

    if (existingIndex >= 0) {
      // Retain existing note if new note is omitted
      if (!newItem.note && store.flags[existingIndex].note) {
        newItem.note = store.flags[existingIndex].note;
      }
      store.flags[existingIndex] = {
        ...store.flags[existingIndex],
        ...newItem,
      };
    } else {
      store.flags.unshift(newItem);
    }

    writeFlagsStore(store);

    return NextResponse.json({
      success: true,
      item: newItem,
      totalCount: store.flags.length,
      flags: store.flags,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to save flag" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let questionId = searchParams.get("questionId");

    if (!questionId) {
      try {
        const body = await req.json();
        questionId = body?.questionId;
      } catch {}
    }

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: "questionId is required" },
        { status: 400 }
      );
    }

    const store = readFlagsStore();
    const prevCount = store.flags.length;
    store.flags = store.flags.filter((f) => f.questionId !== questionId);

    const removed = prevCount !== store.flags.length;
    if (removed) {
      writeFlagsStore(store);
    }

    return NextResponse.json({
      success: true,
      removed,
      questionId,
      totalCount: store.flags.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to remove flag" },
      { status: 500 }
    );
  }
}
