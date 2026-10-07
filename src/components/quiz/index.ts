import { QuestionRendererProps } from "@/types";
import { McqRenderer } from "./McqRenderer";
import { MatchFollowingRenderer } from "./MatchFollowingRenderer";
import { AssertionReasonRenderer } from "./AssertionReasonRenderer";
import { StatementReasonRenderer } from "./StatementReasonRenderer";
import { SequenceRenderer } from "./SequenceRenderer";
import { TableRenderer } from "./TableRenderer";

/** The authoritative canonical question types and backward-compatible aliases */
export const QUESTION_RENDERERS: Record<string, React.ComponentType<QuestionRendererProps>> = {
  mcq: McqRenderer,
  match: MatchFollowingRenderer,
  matching: MatchFollowingRenderer,
  match_following: MatchFollowingRenderer,
  match_the_following: MatchFollowingRenderer,
  assertion: AssertionReasonRenderer,
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
