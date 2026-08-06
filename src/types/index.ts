import { Doc, Id } from "../../convex/_generated/dataModel";

export type Question = Doc<"questions">;
export type Subject = Doc<"subjects">;
export type Topic = Doc<"topics">;
export type TestSet = Doc<"testSets">;
export type Attempt = Doc<"attempts">;
export type WrongQuestion = Doc<"wrongQuestions">;
export type Bookmark = Doc<"bookmarks">;

export type QuestionId = Id<"questions">;
export type AttemptId = Id<"attempts">;
export type TestSetId = Id<"testSets">;

export type RendererMode = "quiz" | "review";

export interface QuestionRendererProps {
  question: Question;
  selected: string | string[] | undefined;
  onSelect: (value: string | string[]) => void;
  mode: RendererMode;
}
