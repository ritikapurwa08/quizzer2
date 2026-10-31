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
  isFullWidth?: boolean;
  isCompact?: boolean;
  className?: string;
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
      <strong key={`b-${match.index}`} className="font-bold" style={{ color: "var(--pdf-text)" }}>
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
  isFullWidth = false,
  isCompact = false,
  className,
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
    <article
      className={cn(
        "pdf-question-card rounded-xl border p-3 break-inside-avoid box-border flex flex-col justify-between",
        className
      )}
      style={{
        background: "var(--pdf-surface)",
        borderColor: "var(--pdf-border)",
        color: "var(--pdf-text)",
      }}
      lang={isHindi ? "hi" : "en"}
    >
      {/* ── Card Top: Header, Question & Options ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* ── Card Header: Number chip, source chip, status chip ── */}
        <div
          className="flex items-center justify-between pb-1.5 mb-2 border-b shrink-0"
          style={{ borderColor: "var(--pdf-border)" }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9pt] font-black tracking-wider uppercase px-1.5 py-0.5 rounded"
              style={{
                background: "var(--pdf-surface-2)",
                color: "var(--pdf-text)",
              }}
            >
              Q {String(number).padStart(2, "0")}
            </span>
            {examRef && (
              <span
                className="max-w-[130px] truncate rounded border px-1.5 py-0.5 text-[6.8pt] font-semibold"
                style={{
                  background: "var(--pdf-surface-2)",
                  borderColor: "var(--pdf-border)",
                  color: "var(--pdf-muted)",
                }}
              >
                {examRef}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {status === "correct" && (
              <span
                className="inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[7pt] font-extrabold leading-none"
                style={{
                  background: "var(--pdf-ok-bg)",
                  borderColor: "var(--pdf-ok-border)",
                  color: "var(--pdf-ok)",
                }}
              >
                ✓ CORRECT · +2.0
              </span>
            )}
            {status === "incorrect" && (
              <span
                className="inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[7pt] font-extrabold leading-none"
                style={{
                  background: "var(--pdf-bad-bg)",
                  borderColor: "var(--pdf-bad-border)",
                  color: "var(--pdf-bad)",
                }}
              >
                ✕ INCORRECT · -0.67
              </span>
            )}
            {status === "unanswered" && (
              <span
                className="inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[7pt] font-extrabold leading-none"
                style={{
                  background: "var(--pdf-surface-2)",
                  borderColor: "var(--pdf-border)",
                  color: "var(--pdf-muted)",
                }}
              >
                ○ SKIPPED · 0.0
              </span>
            )}
          </div>
        </div>

        {/* ── Question Statement (9pt font, 1.6 line-height for Devanagari) ── */}
        <div
          className={cn(
            "text-[9pt] font-bold leading-snug mb-2 whitespace-pre-wrap shrink-0",
            isHindi && "font-hindi leading-[1.6]"
          )}
          style={{ color: "var(--pdf-text)" }}
        >
          {cleanedText || question.questionText}
        </div>

        {/* ── 4 Options List (8.5pt font, rounded rows, circular letter badges) ── */}
        {Array.isArray(question.options) && question.options.length > 0 && (
          <div
            className={cn(
              "gap-1.5 mb-2 flex-1",
              isFullWidth ? "grid grid-cols-2" : "flex flex-col space-y-1.5"
            )}
          >
            {question.options.filter(Boolean).map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isCorrect = Boolean(correctOptId && opt?.id === correctOptId);
              const isUserWrong = Boolean(userOptId && opt?.id === userOptId && !isCorrect);
              const optIsHindi = containsDevanagari(opt.text);

              let rowStyle: React.CSSProperties = {
                background: "var(--pdf-surface-2)",
                borderColor: "var(--pdf-border)",
                color: "var(--pdf-text)",
              };
              let letterStyle: React.CSSProperties = {
                background: "var(--pdf-surface)",
                borderColor: "var(--pdf-border)",
                color: "var(--pdf-muted)",
              };

              if (isCorrect) {
                rowStyle = {
                  background: "var(--pdf-ok-bg)",
                  borderColor: "var(--pdf-ok-border)",
                  color: "var(--pdf-ok)",
                };
                letterStyle = {
                  background: "var(--pdf-ok)",
                  borderColor: "transparent",
                  color: "var(--pdf-ok-bg)",
                  fontWeight: "bold",
                };
              } else if (isUserWrong) {
                rowStyle = {
                  background: "var(--pdf-bad-bg)",
                  borderColor: "var(--pdf-bad-border)",
                  color: "var(--pdf-bad)",
                };
                letterStyle = {
                  background: "var(--pdf-bad)",
                  borderColor: "transparent",
                  color: "var(--pdf-bad-bg)",
                  fontWeight: "bold",
                };
              }

              return (
                <div
                  key={opt.id}
                  className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[8.5pt] leading-tight"
                  style={rowStyle}
                  lang={optIsHindi ? "hi" : "en"}
                >
                  <span
                    className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[7.5pt] leading-none border font-bold"
                    style={letterStyle}
                  >
                    {letter}
                  </span>

                  <span
                    className={cn(
                      "flex-1 min-w-0 leading-normal",
                      optIsHindi && "font-hindi leading-[1.5]"
                    )}
                  >
                    {opt.text}
                  </span>

                  {isUserWrong && (
                    <span
                      className="text-[6.5pt] font-extrabold uppercase tracking-wider px-1 py-0.5 rounded shrink-0 ml-1"
                      style={{
                        background: "var(--pdf-bad)",
                        color: "var(--pdf-bad-bg)",
                      }}
                    >
                      Your choice
                    </span>
                  )}
                  {isCorrect && (
                    <span
                      className="text-[6.5pt] font-extrabold uppercase tracking-wider px-1 py-0.5 rounded shrink-0 ml-1"
                      style={{
                        background: "var(--pdf-ok)",
                        color: "var(--pdf-ok-bg)",
                      }}
                    >
                      Correct
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Rule & Explanation Box (Surface-2, 2px left accent border, min 7.8pt, 1.6 line-height) ── */}
      {expParts && (expParts.concept || expParts.elimination || expParts.generic) && (
        <div
          className={cn(
            "mt-2 rounded-lg border border-l-2 p-2 shrink-0 leading-relaxed",
            isCompact ? "text-[7.5pt]" : "text-[7.8pt]"
          )}
          style={{
            background: "var(--pdf-surface-2)",
            borderColor: "var(--pdf-border)",
            borderLeftColor: "var(--pdf-accent)",
          }}
        >
          <span
            className="block text-[6.8pt] font-black uppercase tracking-wider mb-1"
            style={{ color: "var(--pdf-muted)" }}
          >
            RULE &amp; EXPLANATION
          </span>

          {expParts.concept && (
            <div
              className={cn("font-medium mb-1", containsDevanagari(expParts.concept) && "font-hindi leading-[1.6]")}
              style={{ color: "var(--pdf-text)" }}
              lang={containsDevanagari(expParts.concept) ? "hi" : "en"}
            >
              {renderInlineMarkdown(expParts.concept)}
            </div>
          )}

          {expParts.elimination && (
            <div
              className={cn(
                "pt-1 border-t mt-1",
                containsDevanagari(expParts.elimination) && "font-hindi leading-[1.6]"
              )}
              style={{
                borderColor: "var(--pdf-border)",
                color: "var(--pdf-muted)",
              }}
              lang={containsDevanagari(expParts.elimination) ? "hi" : "en"}
            >
              {renderInlineMarkdown(expParts.elimination)}
            </div>
          )}

          {expParts.generic && !expParts.concept && !expParts.elimination && (
            <div
              className={cn("font-medium", containsDevanagari(expParts.generic) && "font-hindi leading-[1.6]")}
              style={{ color: "var(--pdf-text)" }}
              lang={containsDevanagari(expParts.generic) ? "hi" : "en"}
            >
              {renderInlineMarkdown(expParts.generic)}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
