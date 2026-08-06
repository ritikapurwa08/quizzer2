"use client";

import { McqRenderer } from "./McqRenderer";
import { QuestionRendererProps } from "@/types";

export function AssertionReasonRenderer(props: QuestionRendererProps) {
  return <McqRenderer {...props} />;
}
