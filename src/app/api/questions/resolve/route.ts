import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { enrichQuestionStructure } from "@/lib/matchQuestionParser";

export const dynamic = "force-dynamic";

interface QuestionOption {
  id: string;
  text: string;
}

interface NormalizedQuestion {
  _id: string;
  id?: string;
  testSetId?: string;
  topicId?: string;
  subjectId?: string;
  type: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string | string[];
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  reference?: string;
  meta?: any;
}

// In-memory cache loaded once on server startup
let _questionsCache: Map<string, NormalizedQuestion> | null = null;

function getQuestionsCache(): Map<string, NormalizedQuestion> {
  if (_questionsCache) return _questionsCache;

  const map = new Map<string, NormalizedQuestion>();
  const cwd = process.cwd();

  try {
    const publishedSetsPath = path.join(cwd, "data", "master-pool", "published-sets.json");
    if (fs.existsSync(publishedSetsPath)) {
      const sets: any[] = JSON.parse(fs.readFileSync(publishedSetsPath, "utf-8"));
      for (const s of sets) {
        if (Array.isArray(s.questions)) {
          for (const rawQ of s.questions) {
            const q = enrichQuestionStructure(rawQ);
            const normalized: NormalizedQuestion = {
              _id: q._id || q.id || q.canonicalId || q.convexId,
              id: q.id || q.canonicalId || q._id,
              testSetId: q.testSetId || s.id || s._id,
              topicId: q.topicId || s.topicId,
              subjectId: q.subjectId || s.subjectId,
              type: q.type || "mcq",
              questionText: q.questionText || q.question || "",
              options: Array.isArray(q.options)
                ? q.options.map((opt: any, i: number) =>
                    typeof opt === "string" ? { id: `opt${i + 1}`, text: opt } : opt
                  )
                : [],
              correctAnswer: q.correctAnswer || (q.answerIndex !== undefined ? `opt${q.answerIndex + 1}` : "opt1"),
              explanation: q.explanation || "",
              difficulty: q.difficulty || "medium",
              reference: q.reference || "",
              meta: q.meta,
            };

            if (q._id) map.set(q._id, normalized);
            if (q.id) map.set(q.id, normalized);
            if (q.canonicalId) map.set(q.canonicalId, normalized);
            if (q.convexId) map.set(q.convexId, normalized);
            if (q.sourceQuestionId) map.set(String(q.sourceQuestionId), normalized);
            if (q.meta?.sourceQuestionId) map.set(String(q.meta.sourceQuestionId), normalized);
          }
        }
      }
    }

    const masterPoolPath = path.join(cwd, "data", "master-pool", "master-pool.json");
    if (fs.existsSync(masterPoolPath)) {
      const pool: any[] = JSON.parse(fs.readFileSync(masterPoolPath, "utf-8"));
      for (const rawP of pool) {
        if (!rawP.id) continue;
        const p = enrichQuestionStructure(rawP);
        const normalized: NormalizedQuestion = {
          _id: p.id,
          id: p.id,
          type: p.type || "mcq",
          questionText: p.questionText || p.question || "",
          options: Array.isArray(p.options)
            ? p.options.map((opt: any, i: number) =>
                typeof opt === "string" ? { id: `opt${i + 1}`, text: opt } : opt
              )
            : [],
          correctAnswer: p.correctAnswer || (p.answerIndex !== undefined ? `opt${p.answerIndex + 1}` : "opt1"),
          explanation: p.explanation || "",
          difficulty: p.difficulty || "medium",
          reference: p.exam ? `📌 ${p.exam}${p.year ? ` (${p.year})` : ""}` : "",
          meta: p.meta,
        };

        if (!map.has(p.id)) {
          map.set(p.id, normalized);
        }
        if (Array.isArray(p.convexIds)) {
          for (const cid of p.convexIds) {
            if (!map.has(cid)) {
              map.set(cid, normalized);
            }
          }
        }
      }
    }

    const idMappingPath = path.join(cwd, "data", "master-pool", "id-mapping.json");
    if (fs.existsSync(idMappingPath)) {
      const idMap: Record<string, string> = JSON.parse(fs.readFileSync(idMappingPath, "utf-8"));
      for (const [k, v] of Object.entries(idMap)) {
        if (!map.has(k) && map.has(v)) {
          map.set(k, map.get(v)!);
        }
      }
    }
  } catch (err) {
    console.error("Error building questions lookup cache:", err);
  }

  _questionsCache = map;
  return map;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids)) {
      return NextResponse.json({ success: false, error: "ids must be an array" }, { status: 400 });
    }

    const cache = getQuestionsCache();
    const resolved: Record<string, NormalizedQuestion> = {};

    for (const rawId of ids) {
      if (!rawId) continue;
      const id = String(rawId);
      const q = cache.get(id);
      if (q) {
        resolved[id] = q;
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

