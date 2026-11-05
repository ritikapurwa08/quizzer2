export type ViewMode = "groups" | "review";
export type WhyFilter = "all" | "similar_text_DIFFERENT_answer" | "same_answer_reworded";
export type StatusFilter = "all" | "reviewed" | "unreviewed";
export type DecisionType =
  | "CONFIRMED_DUPLICATE"
  | "DIFFERENT_QUESTION"
  | "KEY_ERROR_A"
  | "KEY_ERROR_B"
  | "CUSTOM";

export interface ReviewPairItem {
  pairKey: string;
  index: number;
  globalIndex: number;
  a: { id: string; q: string; options: string[]; answer: string };
  b: { id: string; q: string; options: string[]; answer: string };
  similarity: number;
  why: string;
  review: { decision: DecisionType; note: string; updatedAt: number } | null;
}

export interface MergedGroupItem {
  groupKey: string;
  canonicalId: string;
  index: number;
  globalIndex: number;
  membersCount: number;
  duplicateVariantsCount: number;
  members: Array<{
    id: string;
    exam?: string;
    year?: number;
    inConvex: boolean;
    question: string;
    options: string[];
    answer: string;
  }>;
  review: { decision: DecisionType; note: string; updatedAt: number } | null;
}
