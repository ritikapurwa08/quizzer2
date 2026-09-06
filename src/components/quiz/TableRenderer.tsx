"use client";

import { OptionButton } from "./OptionButton";
import { QuestionRendererProps } from "@/types";

interface TableMeta {
  headers: string[];
  rows: string[][];
}

export function TableRenderer({ question, selected, onSelect, mode }: QuestionRendererProps) {
  const isReview = mode === "review";
  const correctAnswer = question.correctAnswer as string;
  const meta = question.meta as TableMeta | undefined;

  return (
    <div className="space-y-4">
      {meta?.headers && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card/60 shadow-2xs">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {meta.headers.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {meta.rows.map((row, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3.5 py-2.5 text-foreground font-normal font-hindi">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-2">
        {question.options.map((opt) => {
          let correctness: "correct" | "incorrect" | undefined;
          if (isReview) {
            if (opt.id === correctAnswer) correctness = "correct";
            else if (opt.id === selected) correctness = "incorrect";
          }
          return (
            <OptionButton
              key={opt.id}
              id={opt.id}
              text={opt.text}
              selected={selected === opt.id}
              onClick={() => !isReview && onSelect(opt.id)}
              disabled={isReview}
              correctness={correctness}
            />
          );
        })}
      </div>
    </div>
  );
}
