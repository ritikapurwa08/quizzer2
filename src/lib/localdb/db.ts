import Dexie, { type Table } from "dexie";

export interface LocalGkQuestion {
  id: string;
  masterTopicId: number;
  masterTopic: string;
  question: string;
  options: string[];
  answer: "A" | "B" | "C" | "D";
  exam?: string;
  year?: number;
  explanation?: string;
  inConvex: boolean;
  repeatCount: number;
}

export interface ImportMeta {
  id: "singleton";
  importedAt: number;
  totalCount: number;
}

class QuizzerLocalDB extends Dexie {
  gkQuestions!: Table<LocalGkQuestion, string>;
  importMeta!: Table<ImportMeta, string>;
  localDuplicates!: Table<{ id: string; duplicateId: string; preferredId: string; markedAt: number; markedBy: string }, string>;

  constructor() {
    super("QuizzerLocalDB");
    this.version(1).stores({
      gkQuestions: "id, masterTopicId, inConvex",
      importMeta: "id",
      localDuplicates: "id, duplicateId, preferredId",
    });
  }
}

// Singleton — safe in SSR because Dexie is client-only
let _db: QuizzerLocalDB | null = null;

export function getLocalDB(): QuizzerLocalDB {
  if (typeof window === "undefined") {
    throw new Error("LocalDB is only available in the browser");
  }
  if (!_db) {
    _db = new QuizzerLocalDB();
  }
  return _db;
}

export type { QuizzerLocalDB };
