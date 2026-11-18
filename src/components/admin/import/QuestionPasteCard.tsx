"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, FileCode } from "lucide-react";
import { BatchValidationResult } from "@/lib/validators/question";
import { QualityGateChecklist } from "./QualityGateChecklist";
import { ImportErrorAlert } from "./ImportErrorAlert";

export interface QuestionPasteCardProps {
  code: string;
  onCodeChange: (code: string) => void;
  isFinalSet: boolean;
  onIsFinalSetChange: (isFinalSet: boolean) => void;
  detectedCount: number;
  isExact20: boolean;
  isMultipleOf20: boolean;
  setCountToCreate: number;
  isCountValid: boolean;
  canImport: boolean;
  batchValidation: BatchValidationResult | null;
  hasNoDbCollisions: boolean;
  isDuplicateSetName: boolean;
  selectedSubjectId: string;
  selectedTopicId: string;
  subtopicName: string;
  allErrors: string[];
  isImporting: boolean;
  onImportClick: () => void;
}

export function QuestionPasteCard({
  code,
  onCodeChange,
  isFinalSet,
  onIsFinalSetChange,
  detectedCount,
  isExact20,
  isMultipleOf20,
  setCountToCreate,
  isCountValid,
  canImport,
  batchValidation,
  hasNoDbCollisions,
  isDuplicateSetName,
  selectedSubjectId,
  selectedTopicId,
  subtopicName,
  allErrors,
  isImporting,
  onImportClick,
}: QuestionPasteCardProps) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-xs">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold tracking-tight">
              Question Import &amp; Quality Gate
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {code.trim().length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onCodeChange("")}
                className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear Text
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="relative rounded-xl border border-input bg-card shadow-2xs transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:border-ring overflow-hidden">
          <textarea
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder={`[\n  {\n    "id": "rg_004945",\n    "question": "राजस्थान में सफेद सीमेंट का प्रथम कारखाना कहाँ स्थापित हुआ?",\n    "options": ["गोटन", "खारिया खंगार", "ब्यावर", "चित्तौड़गढ़"],\n    "answer": 0,\n    "explanation": "राजस्थान में सफेद सीमेंट का पहला कारखाना 1984 में गोटन (नागौर) में स्थापित हुआ।",\n    "exam": "REET",\n    "year": 2021\n  }\n]`}
            spellCheck={false}
            className="w-full min-h-50 max-h-85 resize-y bg-transparent p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-hidden whitespace-pre overflow-x-auto"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-muted-foreground">Final Questions:</span>
            {detectedCount === 0 ? (
              <span className="text-muted-foreground font-semibold">0 questions</span>
            ) : isCountValid ? (
              <span className="text-success font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isExact20
                  ? "20 / 20 questions ready (1 Set)"
                  : isMultipleOf20
                    ? `${detectedCount} questions ready (${setCountToCreate} Sets × 20 questions)`
                    : `${detectedCount} questions ready (Final Set)`}
              </span>
            ) : (
              <span className="text-destructive font-semibold flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {detectedCount} questions (Must be 20, 40, 60... questions)
              </span>
            )}
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs">
            <input
              type="checkbox"
              checked={isFinalSet}
              onChange={(e) => onIsFinalSetChange(e.target.checked)}
              className="h-3.5 w-3.5 rounded-sm border-border text-primary"
            />
            <span>Allow Final Set &lt; 20 (Final Set Exception)</span>
          </label>
        </div>

        {/* Quality Gate display */}
        {code.trim().length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border/40">
            {canImport ? (
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-semibold animate-in fade-in-0 duration-150">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    All 8 Quality Gates Passed — {detectedCount} questions verified across {setCountToCreate} set(s) (structure, 4 unique options, answer, explanation, DB uniqueness).
                  </span>
                </div>
                <Badge className="bg-success/20 text-success border-success/40 text-[10px] uppercase tracking-wider shrink-0 font-bold">
                  Passed
                </Badge>
              </div>
            ) : (
              <>
                <QualityGateChecklist
                  isCountValid={isCountValid}
                  isFinalSet={isFinalSet}
                  isMultipleOf20={isMultipleOf20}
                  detectedCount={detectedCount}
                  setCountToCreate={setCountToCreate}
                  batchValidation={batchValidation}
                  hasNoDbCollisions={hasNoDbCollisions}
                  isDuplicateSetName={isDuplicateSetName}
                  selectedSubjectId={selectedSubjectId}
                  selectedTopicId={selectedTopicId}
                  subtopicName={subtopicName}
                />

                <ImportErrorAlert errors={allErrors} />
              </>
            )}
          </div>
        )}

        {/* Import Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
          {!canImport && code.trim().length > 0 ? (
            <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {!selectedSubjectId
                  ? "Step 1 incomplete: Please select a Subject above."
                  : !selectedTopicId
                    ? "Step 1 incomplete: Please select a Master Topic above."
                    : !subtopicName.trim()
                      ? "Step 1 incomplete: Please enter a Set / Part Name above."
                      : isDuplicateSetName
                        ? "Step 1 error: A test set with this name already exists under this topic."
                        : !isCountValid
                          ? `Set requires exactly 20 questions (${detectedCount}/20).`
                          : allErrors.length > 0
                            ? "Please fix the validation errors above."
                            : "Complete requirements above to import."}
              </span>
            </div>
          ) : (
            <div />
          )}
          <Button
            type="button"
            onClick={onImportClick}
            disabled={!canImport || isImporting}
            className="h-10 px-6 text-sm font-semibold rounded-xl min-w-[120px] shadow-xs sm:ml-auto w-full sm:w-auto cursor-pointer"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : setCountToCreate > 1 ? (
              `Import ${detectedCount} Questions (${setCountToCreate} Sets)`
            ) : (
              "Import Questions"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
