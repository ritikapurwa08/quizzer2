import { Question } from "@/types";

// In-memory client cache to prevent redundant HTTP requests across tabs and pagination
const _clientQuestionCache = new Map<string, Question>();

/**
 * Resolves questions by their IDs from the local-first question pool.
 * Uses client-side memory cache first; batches missing IDs to /api/questions/resolve.
 */
export async function resolveQuestions(ids: string[]): Promise<Record<string, Question>> {
  const result: Record<string, Question> = {};
  const missingIds: string[] = [];

  for (const id of ids) {
    if (!id) continue;
    if (_clientQuestionCache.has(id)) {
      result[id] = _clientQuestionCache.get(id)!;
    } else {
      missingIds.push(id);
    }
  }

  if (missingIds.length === 0) {
    return result;
  }

  try {
    const res = await fetch("/api/questions/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: missingIds }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.questions) {
        for (const [id, q] of Object.entries(data.questions)) {
          const typedQ = q as Question;
          _clientQuestionCache.set(id, typedQ);
          result[id] = typedQ;
        }
      }
    }
  } catch (err) {
    console.error("Failed to resolve questions:", err);
  }

  return result;
}

