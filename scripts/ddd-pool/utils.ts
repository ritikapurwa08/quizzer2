import fs from "fs";
import path from "path";
import { DDDQuestion, PoolState, TopicQueueState } from "./types";
import { RAJASTHAN_GK_MASTER_SECTIONS } from "../../src/lib/constants/rajasthanGkMasterTopics";

const CWD = process.cwd();
export const DATA_DIR = path.join(CWD, "data", "ddd");
export const TOPICS_DIR = path.join(DATA_DIR, "topics");
export const CANDIDATES_DIR = path.join(DATA_DIR, "candidates");
export const SETS_DIR = path.join(DATA_DIR, "sets");
export const HISTORY_DIR = path.join(DATA_DIR, "history");
export const POOL_STATE_PATH = path.join(DATA_DIR, "pool-state.json");
export const MANIFEST_PATH = path.join(DATA_DIR, "prepared", "_MANIFEST.json");

// Ensure all needed directories exist
export function ensurePoolDirectories(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(TOPICS_DIR, { recursive: true });
  fs.mkdirSync(CANDIDATES_DIR, { recursive: true });
  fs.mkdirSync(SETS_DIR, { recursive: true });
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

// Master Topics Map (1 to 73)
export const MASTER_TOPICS = new Map<number, { id: number; nameHindi: string; nameEnglish: string }>();
for (const sec of RAJASTHAN_GK_MASTER_SECTIONS) {
  for (const top of sec.topics) {
    MASTER_TOPICS.set(top.id, {
      id: top.id,
      nameHindi: top.nameHindi,
      nameEnglish: top.name,
    });
  }
}

export function loadPoolState(): PoolState {
  if (!fs.existsSync(POOL_STATE_PATH)) {
    throw new Error(`pool-state.json not found at ${POOL_STATE_PATH}. Run initialize-state.ts first.`);
  }
  return JSON.parse(fs.readFileSync(POOL_STATE_PATH, "utf-8"));
}

export function savePoolState(state: PoolState): void {
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(POOL_STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

export function findTopicFile(masterTopicId: number): string | null {
  const padId = String(masterTopicId).padStart(2, "0");
  if (!fs.existsSync(TOPICS_DIR)) return null;
  const files = fs.readdirSync(TOPICS_DIR);
  const matched = files.find((f) => f.startsWith(`${padId}_`) && f.endsWith(".json"));
  return matched ? path.join(TOPICS_DIR, matched) : null;
}

export function loadTopicQuestions(masterTopicId: number): {
  masterTopicId: number;
  masterTopic: string;
  totalAvailable: number;
  questions: DDDQuestion[];
} {
  const topicPath = findTopicFile(masterTopicId);
  if (!topicPath || !fs.existsSync(topicPath)) {
    throw new Error(`Topic file for masterTopicId ${masterTopicId} not found in ${TOPICS_DIR}`);
  }
  return JSON.parse(fs.readFileSync(topicPath, "utf-8"));
}

export function getId(entry: any): string {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry === "object" && entry.id) return String(entry.id);
  return String(entry);
}
