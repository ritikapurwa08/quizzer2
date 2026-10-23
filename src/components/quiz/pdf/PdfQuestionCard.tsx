"use client";

import React from "react";
import { cn, containsDevanagari, cleanQuestionPrompt } from "@/lib/utils";

interface Option {
  id: string;
  text: string;
}

interface PdfQuestionCardProps {
  number: number;
  question: {
    _id?: string;
    id?: string;
    type: string;
    questionText: string;
    options: Option[];
    correctAnswer: string | string[];
    explanation?: string;
    reference?: string | null;
    meta?: any;
  };
  selectedAnswer?: string | string[];
  status: "correct" | "incorrect" | "unanswered";
}

/**
 * Parses markdown bold (**bold**) into strong tags for clean print typesetting
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={`b-${match.index}`} className="font-bold text-slate-900">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

/**
 * Splits explanation into Concept and Elimination logic parts if available
 */
function parseExplanationParts(explanation?: string, meta?: any) {
  if (meta?.concept || meta?.elimination_logic) {
    return {
      concept: meta.concept || null,
      elimination: meta.elimination_logic || null,
      generic: null,
    };
  }

  if (!explanation) return null;

  // Check for dual-section markers in raw explanation
  const conceptMatch = explanation.match(
    /\*\*(?:नियम \/ अवधारणा|अवधारणा|Grammar Concept|Concept)[\s\S]*?\*\*[:\s]*([\s\S]*?)(?=\n\s*\n\s*\*\*|$)/i
  );
  const eliminationMatch = explanation.match(
    /\*\*(?:विकल्प विश्लेषण|विकल्प|Elimination Logic|Elimination)[\s\S]*?\*\*[:\s]*([\s\S]*?)$/i
  );

  if (conceptMatch || eliminationMatch) {
    return {
      concept: conceptMatch ? conceptMatch[1].trim() : null,
      elimination: eliminationMatch ? eliminationMatch[1].trim() : null,
      generic: null,
    };
  }

  return {
    concept: null,
    elimination: null,
    generic: explanation.trim(),
  };
}

export function PdfQuestionCard({
  number,
  question,
  selectedAnswer,
  status,
}: PdfQuestionCardProps) {
  const cleanedText = cleanQuestionPrompt(question.questionText, question.type);
  const isHindi = containsDevanagari(cleanedText || question.questionText);

  const correctOptId = Array.isArray(question.correctAnswer)
    ? question.correctAnswer[0]
    : question.correctAnswer;
  const userOptId = Array.isArray(selectedAnswer)
    ? selectedAnswer[0]
    : selectedAnswer;

  const examRef =
    question.reference ||
    (question.meta?.exam ? `${question.meta.exam}${question.meta.year ? ` (${question.meta.year})` : ""}` : null);

  const expParts = parseExplanationParts(question.explanation, question.meta);

  return (
    <div className="pdf-question-card block w-full rounded-md border border-slate-300 bg-white p-2.5 mb-2.5 shadow-none text-slate-900 break-inside-avoid page-break-inside-avoid">
      {/* ── Card Header: Number + Status + PYQ ── */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center rounded bg-slate-900 px-1.5 py-0.5 text-[8pt] font-black text-white leading-none">
            Q. {String(number).padStart(2, "0")}
          </span>

          {status === "correct" && (
            <span className="inline-flex items-center gap-0.5 rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[7pt] font-bold text-emerald-800 leading-none">
              ✓ Correct (+2.0)
            </span>
          )}
          {status === "incorrect" && (
            <span className="inline-flex items-center gap-0.5 rounded border border-rose-300 bg-rose-50 px-1.5 py-0.5 text-[7pt] font-bold text-rose-800 leading-none">
              ✗ Incorrect (-0.67)
            </span>
          )}
          {status === "unanswered" && (
            <span className="inline-flex items-center gap-0.5 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[7pt] font-bold text-slate-700 leading-none">
              ○ Skipped (0.0)
            </span>
          )}
        </div>

        {examRef && (
          <span className="inline-block max-w-[170px] truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[6.5pt] font-medium text-slate-600">
            {examRef}
          </span>
        )}
      </div>

      {/* ── Question Statement ── */}
      <div
        className={cn(
          "text-[9pt] font-semibold text-slate-900 leading-[1.45] mb-2 whitespace-pre-wrap",
          isHindi && "font-hindi"
        )}
      >
        {cleanedText || question.questionText}
      </div>

      {/* ── Options List ── */}
      {question.options && question.options.length > 0 && (
        <div className="space-y-1 mb-2">
          {question.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isCorrect = opt.id === correctOptId;
            const isSelected = opt.id === userOptId;

            let rowClasses = "border-slate-200 bg-white text-slate-800";
            let letterClasses = "border-slate-300 bg-slate-100 text-slate-700";

            if (isCorrect) {
              rowClasses = "border-emerald-600 bg-emerald-50/90 text-emerald-950 font-semibold";
              letterClasses = "border-emerald-600 bg-emerald-600 text-white font-bold";
            } else if (isSelected && status === "incorrect") {
              rowClasses = "border-rose-600 bg-rose-50/90 text-rose-950";
              letterClasses = "border-rose-600 bg-rose-600 text-white font-bold";
            }

            return (
              <div
                key={opt.id}
                className={cn(
                  "flex items-center gap-2 rounded border px-2 py-1 text-[8pt] leading-tight",
                  rowClasses
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded text-[7pt] leading-none",
                    letterClasses
                  )}
                >
                  {letter}
                </span>

                <span
                  className={cn(
                    "flex-1 min-w-0 leading-normal",
                    containsDevanagari(opt.text) && "font-hindi"
                  )}
                >
                  {opt.text}
                </span>

                {isCorrect && (
                  <span className="shrink-0 rounded bg-emerald-100 border border-emerald-300 px-1 py-0.2 text-[6.5pt] font-bold text-emerald-900 uppercase tracking-tight">
                    ✓ Correct Answer
                  </span>
                )}
                {!isCorrect && isSelected && (
                  <span className="shrink-0 rounded bg-rose-100 border border-rose-300 px-1 py-0.2 text-[6.5pt] font-bold text-rose-900 uppercase tracking-tight">
                    ✗ Your Choice
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detailed Structured Explanation ── */}
      {expParts && (expParts.concept || expParts.elimination || expParts.generic) && (
        <div className="mt-2 rounded border border-slate-200 bg-slate-50/90 p-2 text-[7.5pt] text-slate-700 space-y-1.5 leading-[1.45]">
          {/* Concept Section */}
          {expParts.concept && (
            <div>
              <span className="inline-block rounded bg-blue-100/90 border border-blue-200 px-1.5 py-0.2 text-[6.5pt] font-extrabold text-blue-900 uppercase tracking-wide mb-0.5">
                Grammar Concept / मुख्य नियम
              </span>
              <div className={cn("text-slate-900 font-medium", containsDevanagari(expParts.concept) && "font-hindi")}>
                {renderInlineMarkdown(expParts.concept)}
              </div>
            </div>
          )}

          {/* Option Elimination Section */}
          {expParts.elimination && (
            <div className={expParts.concept ? "pt-1 border-t border-slate-200" : ""}>
              <span className="inline-block rounded bg-slate-200/90 border border-slate-300 px-1.5 py-0.2 text-[6.5pt] font-extrabold text-slate-800 uppercase tracking-wide mb-0.5">
                Option Analysis / विकल्प विश्लेषण
              </span>
              <div className={cn("text-slate-800", containsDevanagari(expParts.elimination) && "font-hindi")}>
                {renderInlineMarkdown(expParts.elimination)}
              </div>
            </div>
          )}

          {/* Fallback Generic Explanation */}
          {expParts.generic && !expParts.concept && !expParts.elimination && (
            <div>
              <span className="inline-block rounded bg-slate-200/90 border border-slate-300 px-1.5 py-0.2 text-[6.5pt] font-extrabold text-slate-800 uppercase tracking-wide mb-0.5">
                Explanation / व्याख्या
              </span>
              <div className={cn("text-slate-900 font-medium", containsDevanagari(expParts.generic) && "font-hindi")}>
                {renderInlineMarkdown(expParts.generic)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
