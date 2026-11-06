import { Doc, Id } from "../../convex/_generated/dataModel";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  _id: string;
  id?: string;
  canonicalId?: string;
  answer?: string;
  question?: string;
  _creationTime?: number;
  testSetId?: string;
  topicId?: string;
  subjectId?: string;
  status?: string;
  sourceQuestionId?: string;
  type: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string | string[];
  explanation?: string;
  reference?: string;
  difficulty?: "easy" | "medium" | "hard";
  order?: number;
  meta?: any;
  [key: string]: any;
}

export type Subject = Doc<"subjects">;
export type Topic = Doc<"topics">;
export type TestSet = Doc<"testSets">;
export type Attempt = Doc<"attempts">;
export type WrongQuestion = Doc<"wrongQuestions">;
export type Bookmark = Doc<"bookmarks">;

export type QuestionId = string;
export type AttemptId = Id<"attempts">;
export type TestSetId = Id<"testSets">;

export type RendererMode = "quiz" | "review";

export interface QuestionRendererProps {
  question: Question;
  selected: string | string[] | undefined;
  onSelect: (value: string | string[]) => void;
  mode: RendererMode;
}
