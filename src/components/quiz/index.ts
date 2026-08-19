import { QuestionRendererProps } from "@/types";
import { McqRenderer } from "./McqRenderer";
import { TrueFalseRenderer } from "./TrueFalseRenderer";
import { MatchFollowingRenderer } from "./MatchFollowingRenderer";
import { AssertionReasonRenderer } from "./AssertionReasonRenderer";

/** v2 — four canonical question types + legacy aliases that fall back to the
 *  nearest equivalent renderer. This allows old imported questions (that may
 *  still carry legacy type strings) to render correctly without crashing.
 */
export const QUESTION_RENDERERS: Record<string, React.ComponentType<QuestionRendererProps>> = {
  // ── v2 canonical types ──────────────────────────────────────────────────
  mcq: McqRenderer,
  match: MatchFollowingRenderer,
  assertion: AssertionReasonRenderer,
  true_false: TrueFalseRenderer,

  // ── legacy aliases ──────────────────────────────────────────────────────
  match_following: MatchFollowingRenderer,
  assertion_reason: AssertionReasonRenderer,
  statement_reason: McqRenderer,
  sequence: McqRenderer,   // renders MCQ options; sequence items shown via meta display
  table: McqRenderer,      // renders MCQ options; table rendered via meta display
};

export { QuestionShell } from "./QuestionShell";
export { OptionButton } from "./OptionButton";
export { QuestionPalette } from "./QuestionPalette";
export { QuestionReviewCard } from "./QuestionReviewCard";
export { QuestionShellSkeleton } from "./QuestionShellSkeleton";
