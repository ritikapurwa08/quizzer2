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
    <div className="pdf-question-card rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-900 break-inside-avoid page-break-inside-avoid shadow-xs box-border flex flex-col justify-between h-full">
      {/* ── Card Top: Header, Question & Options ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* ── Card Header: QUESTION NUMBER + Status Badge (Matching Image 2) ── */}
        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 shrink-0">
          <span className="text-[9.5pt] font-black text-blue-600 uppercase tracking-wider">
            QUESTION {String(number).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-1.5">
            {examRef && (
              <span className="max-w-[140px] truncate rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[6.8pt] font-semibold text-slate-500">
                {examRef}
              </span>
            )}
            {status === "correct" && (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50/90 px-2 py-0.5 text-[7pt] font-extrabold text-emerald-600 leading-none">
                ✓ CORRECT · +2.0
              </span>
            )}
            {status === "incorrect" && (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-rose-200 bg-rose-50/90 px-2 py-0.5 text-[7pt] font-extrabold text-rose-600 leading-none">
                ✕ INCORRECT · -0.67
              </span>
            )}
            {status === "unanswered" && (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[7pt] font-extrabold text-slate-600 leading-none">
                ○ SKIPPED · 0.0
              </span>
            )}
          </div>
        </div>

        {/* ── Question Statement ── */}
        <div
          className={cn(
            "text-[9.2pt] font-bold text-slate-900 leading-snug mb-2 whitespace-pre-wrap shrink-0",
            isHindi && "font-hindi"
          )}
        >
          {cleanedText || question.questionText}
        </div>

        {/* ── 4 Options List (Clean Circular Letter Badge Matching Image 2) ── */}
        {Array.isArray(question.options) && question.options.length > 0 && (
          <div className="space-y-1.5 mb-2 flex-1">
            {question.options.filter(Boolean).map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isCorrect = Boolean(correctOptId && opt?.id === correctOptId);
              const isUserWrong = Boolean(userOptId && opt?.id === userOptId && !isCorrect);

              let rowClasses = "border-slate-200 bg-white text-slate-800";
              let letterClasses = "border-slate-200 bg-slate-100 text-slate-600 font-bold";

              if (isCorrect) {
                rowClasses = "border-emerald-400 bg-emerald-50/70 text-emerald-950 font-medium";
                letterClasses = "bg-emerald-600 text-white font-bold border-transparent";
              } else if (isUserWrong) {
                rowClasses = "border-rose-300 bg-rose-50/70 text-rose-950 font-medium";
                letterClasses = "bg-rose-600 text-white font-bold border-transparent";
              }

              return (
                <div
                  key={opt.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-[8.5pt] leading-tight",
                    rowClasses
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[7.5pt] leading-none border",
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Rule & Explanation Box (Pinned to Bottom of Card) ── */}
      {expParts && (expParts.concept || expParts.elimination || expParts.generic) && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/90 p-2.5 text-[7.6pt] text-slate-700 leading-relaxed shrink-0">
          <span className="block text-[6.8pt] font-black text-slate-500 uppercase tracking-wider mb-1">
            RULE & EXPLANATION
          </span>

          {expParts.concept && (
            <div className={cn("text-slate-800 font-medium mb-1", containsDevanagari(expParts.concept) && "font-hindi")}>
              {renderInlineMarkdown(expParts.concept)}
            </div>
          )}

          {expParts.elimination && (
            <div
              className={cn(
                "text-slate-700",
                expParts.concept && "pt-1 border-t border-slate-200 mt-1",
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
