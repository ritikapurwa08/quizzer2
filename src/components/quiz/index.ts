import { QuestionType } from "@/lib/constants";
import { QuestionRendererProps } from "@/types";
import { McqRenderer } from "./McqRenderer";
import { TrueFalseRenderer } from "./TrueFalseRenderer";
import { StatementReasonRenderer } from "./StatementReasonRenderer";
import { AssertionReasonRenderer } from "./AssertionReasonRenderer";
import { TableRenderer } from "./TableRenderer";
import { MatchFollowingRenderer } from "./MatchFollowingRenderer";
import { SequenceRenderer } from "./SequenceRenderer";

/** SRD Section 10 — one shared prop shape, one renderer per question type. */
export const QUESTION_RENDERERS: Record<QuestionType, React.ComponentType<QuestionRendererProps>> = {
  mcq: McqRenderer,
  true_false: TrueFalseRenderer,
  statement_reason: StatementReasonRenderer,
  assertion_reason: AssertionReasonRenderer,
  table: TableRenderer,
  match_following: MatchFollowingRenderer,
  sequence: SequenceRenderer,
};

export { QuestionShell } from "./QuestionShell";
export { OptionButton } from "./OptionButton";
export { QuestionPalette } from "./QuestionPalette";
