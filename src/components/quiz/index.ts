import { QuestionRendererProps } from "@/types";
import { McqRenderer } from "./McqRenderer";
import { MatchFollowingRenderer } from "./MatchFollowingRenderer";
import { AssertionReasonRenderer } from "./AssertionReasonRenderer";
import { StatementReasonRenderer } from "./StatementReasonRenderer";
import { SequenceRenderer } from "./SequenceRenderer";
import { TableRenderer } from "./TableRenderer";

/** The authoritative 6 canonical question types */
export const QUESTION_RENDERERS: Record<string, React.ComponentType<QuestionRendererProps>> = {
  mcq: McqRenderer,
  match_following: MatchFollowingRenderer,
  assertion_reason: AssertionReasonRenderer,
  statement_reason: StatementReasonRenderer,
  sequence: SequenceRenderer,
  table: TableRenderer,
};

export { QuestionShell } from "./QuestionShell";
export { QuestionSourceMeta, parseQuestionSource } from "./QuestionSourceMeta";
export { OptionButton } from "./OptionButton";
export { QuestionPalette } from "./QuestionPalette";
export { QuestionPaletteToggle } from "./QuestionPaletteToggle";
export { QuestionReviewCard } from "./QuestionReviewCard";
export { QuestionReviewFilter } from "./QuestionReviewFilter";
export { QuestionShellSkeleton } from "./QuestionShellSkeleton";
