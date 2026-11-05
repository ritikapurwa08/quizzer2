/**
 * Quiz session utility helpers
 */

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Single source of truth helper: safely checks candidate question IDs
 * against local answers map, ensuring empty strings / arrays count as unattempted.
 */
export function getQuestionAnswer(q: any, answers: Record<string, any>, index?: number) {
  if (!q || !answers) return undefined;
  const candidates = [
    q.canonicalId,
    q._id,
    q.id,
    q.convexId,
    q.sourceQuestionId,
    q.meta?.sourceQuestionId,
    index !== undefined ? `q_idx_${index}` : undefined,
  ].filter(Boolean);

  for (const cid of candidates) {
    if (cid && answers[cid] !== undefined && answers[cid] !== null && answers[cid] !== "") {
      if (Array.isArray(answers[cid]) && answers[cid].length === 0) continue;
      return answers[cid];
    }
  }
  return undefined;
}
