/**
 * Type definitions for Quizzer Notes & Study Material Structured JSON System
 */

export type NoteBlockType =
  | "heading"
  | "paragraph"
  | "facts"
  | "key_points"
  | "bullet_list"
  | "numbered_list"
  | "table"
  | "comparison_table"
  | "timeline"
  | "trick"
  | "mnemonic"
  | "exam_tip"
  | "exam_trap"
  | "callout"
  | "quote"
  | "image"
  | "faq"
  | "quick_revision"
  | "pyq_connection"
  | "definition";

export interface HeadingBlock {
  type: "heading";
  level?: 1 | 2 | 3 | 4;
  text: string;
  subtitle?: string;
}

export interface ParagraphBlock {
  type: "paragraph";
  content: string;
}

export interface FactsBlock {
  type: "facts";
  title?: string;
  items: string[];
}

export interface KeyPointsBlock {
  type: "key_points";
  title?: string;
  items: string[];
}

export interface BulletListBlock {
  type: "bullet_list";
  items: string[];
}

export interface NumberedListBlock {
  type: "numbered_list";
  items: string[];
}

export interface TableBlock {
  type: "table";
  title?: string;
  columns: string[];
  rows: string[][];
  caption?: string;
}

export interface ComparisonTableBlock {
  type: "comparison_table";
  title?: string;
  headers: [string, string];
  rows: Array<{
    feature: string;
    col1: string;
    col2: string;
  }>;
}

export interface TimelineBlock {
  type: "timeline";
  title?: string;
  events: Array<{
    dateOrEra: string;
    title: string;
    description: string;
  }>;
}

export interface TrickBlock {
  type: "trick" | "mnemonic";
  title?: string;
  mnemonic: string;
  explanation: string;
  examContext?: string;
}

export interface ExamTipBlock {
  type: "exam_tip";
  title?: string;
  content: string;
}

export interface ExamTrapBlock {
  type: "exam_trap";
  title?: string;
  confusion: string;
  clarification: string;
}

export interface CalloutBlock {
  type: "callout";
  calloutType?: "info" | "warning" | "success" | "tip";
  title?: string;
  content: string;
}

export interface QuoteBlock {
  type: "quote";
  quote: string;
  author?: string;
  source?: string;
}

export interface ImageBlock {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
  explanation?: string;
  width?: number;
  height?: number;
}

export interface FaqBlock {
  type: "faq";
  title?: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
}

export interface QuickRevisionBlock {
  type: "quick_revision";
  title?: string;
  summaryPoints: string[];
}

export interface PyqConnectionBlock {
  type: "pyq_connection";
  examName?: string;
  year?: string;
  questionSnippet?: string;
  insight: string;
}

export interface DefinitionBlock {
  type: "definition";
  term: string;
  definition: string;
  details?: string;
}

export type NoteBlock =
  | HeadingBlock
  | ParagraphBlock
  | FactsBlock
  | KeyPointsBlock
  | BulletListBlock
  | NumberedListBlock
  | TableBlock
  | ComparisonTableBlock
  | TimelineBlock
  | TrickBlock
  | ExamTipBlock
  | ExamTrapBlock
  | CalloutBlock
  | QuoteBlock
  | ImageBlock
  | FaqBlock
  | QuickRevisionBlock
  | PyqConnectionBlock
  | DefinitionBlock;

export interface NoteDocument {
  version?: string;
  title: string;
  subtitle?: string;
  overview?: string;
  tags?: string[];
  lastUpdated?: string;
  blocks: NoteBlock[];
}
