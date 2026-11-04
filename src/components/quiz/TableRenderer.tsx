"use client";

import { OptionButton } from "./OptionButton";
import { QuestionRendererProps } from "@/types";
import { tryParseMarkdownTable } from "@/lib/validators/question";

interface TableMeta {
  headers?: string[];
  rows?: string[][];
  [key: string]: unknown;
}

export function TableRenderer({ question, selected, onSelect, mode }: QuestionRendererProps) {
  const isReview = mode === "review";
  const rawCorrect = String(question.correctAnswer || "").trim();
  const meta = (question.meta as TableMeta) || {};

  let headers = meta.headers;
  let rows = meta.rows;

  // Fallback: If headers/rows not in meta, try parsing from questionText
  if ((!headers || headers.length === 0) && question.questionText) {
    const parsed = tryParseMarkdownTable(question.questionText);
    if (parsed) {
      headers = parsed.headers;
      rows = parsed.rows;
    }
  }

  return (
    <div className="space-y-4">
      {headers && headers.length > 0 && rows && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card/60 shadow-2xs">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-3.5 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row: any, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  {Array.isArray(row) ? (
                    row.map((cell: any, j) => (
                      <td key={j} className="px-3.5 py-2.5 text-foreground font-normal font-hindi">
                        {String(cell ?? "")}
                      </td>
                    ))
                  ) : (
                    <td colSpan={headers?.length || 1} className="px-3.5 py-2.5 text-foreground font-normal font-hindi">
                      {String(row ?? "")}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-2">
        {(question.options || []).map((opt: any, i: number) => {
          const optId = typeof opt === "string" ? `opt${i + 1}` : opt?.id || `opt${i + 1}`;
          const optText = typeof opt === "string" ? opt : opt?.text || "";

          let correctness: "correct" | "incorrect" | "neutral" | undefined;
          if (isReview) {
            const isThisCorrect =
              rawCorrect === optId ||
              rawCorrect === optText ||
              (rawCorrect.toUpperCase() === "A" && i === 0) ||
              (rawCorrect.toUpperCase() === "B" && i === 1) ||
              (rawCorrect.toUpperCase() === "C" && i === 2) ||
              (rawCorrect.toUpperCase() === "D" && i === 3) ||
              (rawCorrect === "1" && i === 0) ||
              (rawCorrect === "2" && i === 1) ||
              (rawCorrect === "3" && i === 2) ||
              (rawCorrect === "4" && i === 3);

            if (isThisCorrect) correctness = "correct";
            else if (selected === optId || selected === optText) correctness = "incorrect";
          }

          return (
            <OptionButton
              key={optId}
              id={optId}
              text={optText}
              selected={selected === optId || selected === optText}
              onClick={() => !isReview && onSelect(optId)}
              disabled={isReview}
              correctness={correctness}
            />
          );
        })}
      </div>
    </div>
  );
}
