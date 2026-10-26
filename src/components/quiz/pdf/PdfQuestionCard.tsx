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
function renderInlineMarkdown(text?: string | null): React.ReactNode[] {
  if (typeof text !== "string" || !text) return [];
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
function parseExplanationParts(explanation?: unknown, meta?: any) {
  const metaConcept = typeof meta?.concept === "string" ? meta.concept : null;
  const metaElim = typeof meta?.elimination_logic === "string" ? meta.elimination_logic : null;

  if (metaConcept || metaElim) {
    return {
      concept: metaConcept,
      elimination: metaElim,
      generic: null,
    };
  }

  if (typeof explanation !== "string" || !explanation.trim()) return null;

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
    (question.meta?.exam
      ? `${question.meta.exam}${question.meta.year ? ` (${question.meta.year})` : ""}`
      : null);

  const expParts = parseExplanationParts(question.explanation, question.meta);

  return (
    <div className="pdf-question-card flex flex-col justify-between rounded-md border border-slate-200 bg-white p-2 text-slate-900 break-inside-avoid page-break-inside-avoid shadow-none">
      <div>
        {/* ── Card Header: Number + Reference + Status ── */}
        <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-[7.5pt] font-black text-blue-700 uppercase tracking-wider">
              Q{String(number).padStart(2, "0")}
            </span>
            {examRef && (
              <span className="max-w-[110px] truncate rounded border border-slate-200 bg-slate-50 px-1 py-0.2 text-[6.2pt] font-medium text-slate-500">
                {examRef}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {status === "correct" && (
              <span className="inline-flex items-center gap-0.5 rounded border border-emerald-200 bg-emerald-50/80 px-1.5 py-0.2 text-[6.5pt] font-bold text-emerald-700 leading-none">
                ✓ CORRECT · +2.0
              </span>
            )}
            {status === "incorrect" && (
              <span className="inline-flex items-center gap-0.5 rounded border border-rose-200 bg-rose-50/80 px-1.5 py-0.2 text-[6.5pt] font-bold text-rose-600 leading-none">
                ✕ INCORRECT · -0.67
              </span>
            )}
            {status === "unanswered" && (
              <span className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.2 text-[6.5pt] font-bold text-slate-600 leading-none">
                ○ SKIPPED · 0.0
              </span>
            )}
          </div>
        </div>

        {/* ── Question Statement ── */}
        <div
          className={cn(
            "text-[8pt] font-bold text-slate-900 leading-snug mb-1.5 whitespace-pre-wrap",
            isHindi && "font-hindi"
          )}
        >
          {cleanedText || question.questionText}
        </div>

        {/* ── Options List ── */}
        {Array.isArray(question.options) && question.options.length > 0 && (
          <div className="space-y-0.5 mb-1.5">
            {question.options.filter(Boolean).map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isCorrect = Boolean(correctOptId && opt?.id === correctOptId);
              const isSelected = Boolean(userOptId && opt?.id === userOptId);

              let rowClasses = "border-transparent bg-slate-50/40 text-slate-700";
              let letterClasses = "border-slate-200 bg-slate-100 text-slate-600 font-semibold";
              let badge: React.ReactNode = null;

              if (isCorrect) {
                rowClasses =
                  "border-emerald-300 bg-emerald-50/80 text-emerald-950 font-semibold";
                letterClasses = "bg-emerald-600 text-white font-bold border-transparent";
                badge = (
                  <span className="ml-auto text-[6.2pt] font-extrabold uppercase text-emerald-700 tracking-wider shrink-0 pl-1">
                    ✓ Correct
                  </span>
                );
              } else if (isSelected && status === "incorrect") {
                rowClasses =
                  "border-rose-200 bg-rose-50/80 text-rose-950 font-medium";
                letterClasses = "bg-rose-600 text-white font-bold border-transparent";
                badge = (
                  <span className="ml-auto text-[6.2pt] font-extrabold uppercase text-rose-600 tracking-wider shrink-0 pl-1">
                    ✕ Your Choice
                  </span>
                );
              }

              return (
                <div
                  key={opt.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[7.5pt] leading-tight",
                    rowClasses
                  )}
                >
                  <span
                    className={cn(
                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded text-[6.5pt] leading-none border",
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

                  {badge}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Rule & Explanation Box ── */}
      {expParts && (expParts.concept || expParts.elimination || expParts.generic) && (
        <div className="mt-0.5 rounded border border-slate-200 bg-slate-50/90 p-1.5 text-[7pt] text-slate-700 leading-normal">
          <span className="block text-[6.2pt] font-extrabold text-slate-900 uppercase tracking-wider mb-0.5">
            RULE & EXPLANATION
          </span>

          {expParts.concept && (
            <div className={cn("text-slate-800 font-medium mb-0.5", containsDevanagari(expParts.concept) && "font-hindi")}>
              {renderInlineMarkdown(expParts.concept)}
            </div>
          )}

          {expParts.elimination && (
            <div
              className={cn(
                "text-slate-700",
                expParts.concept && "pt-0.5 border-t border-slate-200 mt-0.5",
                containsDevanagari(expParts.elimination) && "font-hindi"
              )}
            >
              {renderInlineMarkdown(expParts.elimination)}
            </div>
          )}

          {expParts.generic && !expParts.concept && !expParts.elimination && (
            <div className={cn("text-slate-800 font-medium", containsDevanagari(expParts.generic) && "font-hindi")}>
              {renderInlineMarkdown(expParts.generic)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
