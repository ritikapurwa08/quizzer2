export interface DDDQuestion {
  id: string;
  source: string;
  sourceTopicId: number | null;
  sourceTopic: string | null;
  masterTopicId: number | null;
  masterTopic: string | null;
  question: string;
  options: string[];
  answer: string | number;
  exam: string | null;
  year: number | null;
  explanation: string | null;
  _questionLevelSplit?: boolean;
  _candidateMasterTopicIds?: number[];
}

export interface UsedEntry {
  id: string;
  usedInSet: string;
  usedAt: string;
}

export interface RequeuedEntry {
  id: string;
  requeueCount: number;
  lastRejectedFromSet: string;
  reason?: string;
}

export interface RejectedEntry {
  id: string;
  reason: string;
  rejectedAt: string;
}

export interface TopicQueueState {
  masterTopicId: number;
  masterTopic: string;
  available: string[];
  candidate: string[];
  used: (string | UsedEntry)[];
  requeued: (string | RequeuedEntry)[];
  rejected: (string | RejectedEntry)[];
  completedSets: number;
}

export interface PoolState {
  generatedAt: string;
  updatedAt: string;
  architecture: "LOCAL_MASTER_POOL";
  totalMasterPoolQuestions: number;
  totalTopicAssignedQuestions: number;
  totalQuestionLevelSplit: number;
  topics: Record<string, TopicQueueState>;
}
