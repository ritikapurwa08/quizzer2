import fs from "fs";
import path from "path";

export interface BackupInventoryTopic {
  topicId: string;
  name: string;
  nameHindi: string;
  slug: string;
  order: number;
  setCount: number;
  questionCount: number;
  uniqueUsedSourceCount: number;
  sets: Array<{ id: string; name: string; order: number; count: number }>;
}

export interface BackupInventorySubject {
  subjectId: string;
  name: string;
  nameHindi?: string;
  slug: string;
  order: number;
  topics: BackupInventoryTopic[];
}

export interface BackupDuplicateReportItem {
  topicId: string;
  topicHindi: string;
  duplicateCount: number;
  setsAffected: string[];
}

export interface BackupInventoryResult {
  subjects: BackupInventorySubject[];
  totalDuplicates: number;
  duplicateReport: BackupDuplicateReportItem[];
}

/** Check if convex-latest-backup directory exists with documents */
export function hasConvexBackup(): boolean {
  const p = path.join(process.cwd(), "convex-latest-backup", "questions", "documents.jsonl");
  return fs.existsSync(p);
}

function readJsonlSync(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const items: any[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch {
      // Ignore corrupted line
    }
  }
  return items;
}

/** Reads all existing source question IDs from convex-latest-backup to avoid Convex cloud calls */
export function getBackupExistingQuestionIds(): Set<string> {
  const qPath = path.join(process.cwd(), "convex-latest-backup", "questions", "documents.jsonl");
  const existing = new Set<string>();
  if (!fs.existsSync(qPath)) return existing;

  const questions = readJsonlSync(qPath);
  for (const q of questions) {
    const sid = q.sourceQuestionId || q.meta?.sourceQuestionId;
    if (sid) {
      existing.add(String(sid));
    }
  }
  return existing;
}

/** Computes inventory and duplicate audit directly from local convex backup */
export function getBackupInventory(): BackupInventoryResult | null {
  const baseDir = path.join(process.cwd(), "convex-latest-backup");
  const qPath = path.join(baseDir, "questions", "documents.jsonl");
  const tPath = path.join(baseDir, "topics", "documents.jsonl");
  const sPath = path.join(baseDir, "subjects", "documents.jsonl");
  const setPath = path.join(baseDir, "testSets", "documents.jsonl");

  if (!fs.existsSync(qPath) || !fs.existsSync(tPath) || !fs.existsSync(sPath) || !fs.existsSync(setPath)) {
    return null;
  }

  const subjects = readJsonlSync(sPath).sort((a, b) => a.order - b.order);
  const topics = readJsonlSync(tPath).sort((a, b) => a.order - b.order);
  const testSets = readJsonlSync(setPath);
  const questions = readJsonlSync(qPath);

  const topicMap = new Map<string, any>(topics.map((t) => [t._id, t]));
  const setMap = new Map<string, any>(testSets.map((s) => [s._id, s]));

  const setsByTopic = new Map<string, any[]>();
  for (const s of testSets) {
    const tid = s.topicId as string;
    const list = setsByTopic.get(tid);
    if (!list) setsByTopic.set(tid, [s]);
    else list.push(s);
  }

  const questionsByTopic = new Map<string, number>();
  const usedSourceIdsByTopic = new Map<string, Set<string>>();

  // Duplicate tracking
  const seenByTopic = new Map<string, Map<string, { setName: string }>>();
  const duplicateCountsByTopic = new Map<string, { topicHindi: string; count: number; sets: Set<string> }>();
  let totalDuplicates = 0;

  for (const q of questions) {
    const set = setMap.get(q.testSetId);
    const tid = q.topicId || set?.topicId;
    if (!tid) continue;

    // Count questions per topic
    questionsByTopic.set(tid, (questionsByTopic.get(tid) || 0) + 1);

    const sid = q.sourceQuestionId || q.meta?.sourceQuestionId;
    if (sid) {
      let setOfIds = usedSourceIdsByTopic.get(tid);
      if (!setOfIds) {
        setOfIds = new Set();
        usedSourceIdsByTopic.set(tid, setOfIds);
      }
      setOfIds.add(String(sid));
    }

    // Check duplicate
    if (!seenByTopic.has(tid)) {
      seenByTopic.set(tid, new Map());
    }
    const topicSeen = seenByTopic.get(tid)!;

    const normText = (q.questionText || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    const key = sid || normText;
    const setName = set?.name || "Unknown Set";

    if (topicSeen.has(key)) {
      totalDuplicates++;
      const existing = topicSeen.get(key)!;
      const topicObj = topicMap.get(tid);
      const topHindi = topicObj?.nameHindi || topicObj?.name || "Unknown";

      if (!duplicateCountsByTopic.has(tid)) {
        duplicateCountsByTopic.set(tid, { topicHindi: topHindi, count: 0, sets: new Set() });
      }
      const entry = duplicateCountsByTopic.get(tid)!;
      entry.count++;
      entry.sets.add(existing.setName);
      entry.sets.add(setName);
    } else {
      topicSeen.set(key, { setName });
    }
  }

  const subjectResults: BackupInventorySubject[] = subjects.map((sub) => {
    const subTopics: BackupInventoryTopic[] = topics
      .filter((t) => t.subjectId === sub._id)
      .map((top) => {
        const tid = top._id;
        const sets = setsByTopic.get(tid) || [];
        const questionCount = questionsByTopic.get(tid) || 0;
        const uniqueUsedSourceCount = usedSourceIdsByTopic.get(tid)?.size || 0;

        return {
          topicId: top._id,
          name: top.name,
          nameHindi: top.nameHindi,
          slug: top.slug,
          order: top.order,
          setCount: sets.length,
          questionCount,
          uniqueUsedSourceCount,
          sets: sets.map((s) => ({
            id: s._id,
            name: s.name,
            order: s.order,
            count: Number(s.questionCount) || 0,
          })),
        };
      });

    return {
      subjectId: sub._id,
      name: sub.name,
      nameHindi: sub.nameHindi,
      slug: sub.slug,
      order: sub.order,
      topics: subTopics,
    };
  });

  const duplicateReport: BackupDuplicateReportItem[] = Array.from(duplicateCountsByTopic.entries()).map(
    ([topicId, info]) => ({
      topicId,
      topicHindi: info.topicHindi,
      duplicateCount: info.count,
      setsAffected: Array.from(info.sets),
    })
  );

  return {
    subjects: subjectResults,
    totalDuplicates,
    duplicateReport,
  };
}

