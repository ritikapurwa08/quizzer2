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

            const indexKey = (k: string) => {
              map.set(k, normalized);
              map.set(k.toLowerCase(), normalized);
              map.set(k.toUpperCase(), normalized);
            };

            if (q._id) indexKey(String(q._id));
            if (q.id) indexKey(String(q.id));
            if (q.canonicalId) indexKey(String(q.canonicalId));
            if (q.convexId) indexKey(String(q.convexId));
            if (q.sourceQuestionId) indexKey(String(q.sourceQuestionId));
            if (q.meta?.sourceQuestionId) indexKey(String(q.meta.sourceQuestionId));
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

        const indexPoolKey = (k: string) => {
          map.set(k, normalized);
          map.set(k.toLowerCase(), normalized);
          map.set(k.toUpperCase(), normalized);
        };

        indexPoolKey(String(p.id));
        if (Array.isArray(p.convexIds)) {
          for (const cid of p.convexIds) {
            indexPoolKey(String(cid));
          }
        }
        if (Array.isArray(p.variantIds)) {
          for (const vid of p.variantIds) {
            indexPoolKey(String(vid));
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

    // 4. Index individual topic files for any unassigned questions
    const topicsDir = path.join(cwd, "data", "ddd", "topics");
    if (fs.existsSync(topicsDir)) {
      const topicFiles = fs.readdirSync(topicsDir).filter((f) => f.endsWith(".json"));
      for (const tf of topicFiles) {
        try {
          const tp = path.join(topicsDir, tf);
          const tData = JSON.parse(fs.readFileSync(tp, "utf-8"));
          if (Array.isArray(tData.questions)) {
            for (const rawQ of tData.questions) {
              if (!rawQ.id) continue;
              if (map.has(rawQ.id)) continue;
              const q = enrichQuestionStructure(rawQ);
              const normalized: NormalizedQuestion = {
                _id: q._id || q.id,
                id: q.id || q._id,
                type: q.type || "mcq",
                questionText: q.questionText || q.question || "",
                options: Array.isArray(q.options)
                  ? q.options.map((opt: any, i: number) =>
                      typeof opt === "string" ? { id: `opt${i + 1}`, text: opt } : opt
                    )
                  : [],
                correctAnswer:
                  q.correctAnswer ||
                  q.answer ||
                  (q.answerIndex !== undefined ? `opt${q.answerIndex + 1}` : "opt1"),
                explanation: q.explanation || "",
                difficulty: q.difficulty || "medium",
                reference: q.exam ? `📌 ${q.exam}${q.year ? ` (${q.year})` : ""}` : "",
                meta: q.meta,
              };
              const indexKey = (k: string) => {
                map.set(k, normalized);
                map.set(k.toLowerCase(), normalized);
                map.set(k.toUpperCase(), normalized);
              };
              indexKey(String(q.id));
              if (q._id) indexKey(String(q._id));
            }
          }
        } catch {}
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
      const q = cache.get(id) || cache.get(id.toLowerCase()) || cache.get(id.toUpperCase());
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

