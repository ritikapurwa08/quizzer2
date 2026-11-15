"use client";

import { getLocalDB, type LocalGkQuestion } from "./db";

/** Returns count of locally stored GK questions, or null if not accessible */
export async function getLocalGkCount(): Promise<number> {
  try {
    const db = getLocalDB();
    return await db.gkQuestions.count();
  } catch {
    return 0;
  }
}

/** Returns import metadata (last import time, total count), or null */
export async function getImportMeta(): Promise<{ importedAt: number; totalCount: number } | null> {
  try {
    const db = getLocalDB();
    const meta = await db.importMeta.get("singleton");
    return meta ? { importedAt: meta.importedAt, totalCount: meta.totalCount } : null;
  } catch {
    return null;
  }
}

/** Fetches all GK questions for a masterTopicId from local DB */
export async function getLocalGkByTopic(masterTopicId: number): Promise<LocalGkQuestion[]> {
  const db = getLocalDB();
  return db.gkQuestions.where("masterTopicId").equals(masterTopicId).toArray();
}

/** Clears all GK questions and import meta, then re-imports from server in chunks */
export async function importGkPoolFromServer(
  onProgress?: (done: number, total: number) => void
): Promise<{ total: number; importedAt: number }> {
  const db = getLocalDB();

  // Clear existing data
  await db.gkQuestions.clear();
  await db.importMeta.clear();

  const pageSize = 500;
  let page = 0;
  let totalImported = 0;
  let grandTotal = 0;

  while (true) {
    const res = await fetch(`/api/admin/import-local-pool?page=${page}&pageSize=${pageSize}`);
    if (!res.ok) throw new Error(`Import failed: HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Import failed");

    const questions: LocalGkQuestion[] = json.questions;
    grandTotal = json.total;

    if (questions.length === 0) break;

    await db.gkQuestions.bulkPut(questions);
    totalImported += questions.length;
    onProgress?.(totalImported, grandTotal);

    if (questions.length < pageSize) break;
    page++;
  }

  const importedAt = Date.now();
  await db.importMeta.put({ id: "singleton", importedAt, totalCount: totalImported });

  return { total: totalImported, importedAt };
}
