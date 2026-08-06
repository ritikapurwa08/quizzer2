"use client";

import { useState, useEffect, useRef } from "react";
import { autoFixJson } from "@/lib/importParser";
import { importJsonSchema, ImportJson } from "@/lib/validators/question";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Wand2 } from "lucide-react";

interface LiveJsonEditorProps {
  initialValue?: string;
  onChange: (value: string, parsed: ImportJson | null, errors: string[]) => void;
}

export function LiveJsonEditor({ initialValue = "", onChange }: LiveJsonEditorProps) {
  const [code, setCode] = useState(initialValue);
  const [lineCount, setLineCount] = useState(1);
  const [syntaxError, setSyntaxError] = useState<{ line: number | null; message: string } | null>(null);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<ImportJson | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const lines = code.split("\n").length;
    setLineCount(lines);

    if (!code.trim()) {
      setSyntaxError(null);
      setSchemaErrors([]);
      setParsedData(null);
      onChange(code, null, []);
      return;
    }

    try {
      const obj = JSON.parse(code);
      setSyntaxError(null);

      const result = importJsonSchema.safeParse(obj);
      if (!result.success) {
        const errs = result.error.issues.map(
          (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`
        );
        setSchemaErrors(errs);
        setParsedData(null);
        onChange(code, null, errs);
      } else {
        setSchemaErrors([]);
        setParsedData(result.data);
        onChange(code, result.data, []);
      }
    } catch (err: any) {
      let line: number | null = null;
      // Try extracting line number from JSON parse error message if available
      const match = err.message?.match(/at line (\d+) column (\d+)/i) || err.message?.match(/line (\d+)/i);
      if (match && match[1]) {
        line = parseInt(match[1], 10);
      }

      const errMsg = err.message || "Invalid JSON syntax.";
      setSyntaxError({ line, message: errMsg });
      setSchemaErrors([]);
      setParsedData(null);
      onChange(code, null, [errMsg]);
    }
  }, [code, onChange]);

  function handleAutoFix() {
    const { fixedText, success } = autoFixJson(code);
    setCode(fixedText);
  }

  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/60 p-2.5 rounded-t-lg border border-border">
        <div className="flex items-center gap-2 text-xs font-semibold">
          {syntaxError || schemaErrors.length > 0 ? (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-4 w-4" />
              {syntaxError ? "JSON Syntax Error" : `${schemaErrors.length} Schema Error(s)`}
            </span>
          ) : parsedData ? (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 className="h-4 w-4" />
              JSON Valid ({parsedData.questions.length} Questions)
            </span>
          ) : (
            <span className="text-muted-foreground">Type or paste JSON below</span>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAutoFix}
          className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Auto Fix JSON
        </Button>
      </div>

      <div className="relative flex rounded-b-lg border border-t-0 border-border bg-card font-mono text-xs overflow-hidden">
        {/* Line Numbers Sidebar */}
        <div className="select-none py-3 px-2 bg-muted/40 text-muted-foreground text-right border-r border-border min-w-[40px] space-y-0.5">
          {lineNumbers.map((n) => (
            <div
              key={n}
              className={
                syntaxError?.line === n
                  ? "text-destructive font-bold bg-destructive/10 px-1 rounded"
                  : ""
              }
            >
              {n}
            </div>
          ))}
        </div>

        {/* Textarea Code Input ok s */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`{\n  "subject": "Rajasthan Geography",\n  "topic": "Physical Features",\n  "testSet": "Set 1",\n  "negativeMarking": true,\n  "questions": [...]\n}`}
          rows={14}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent font-mono text-xs focus:outline-none resize-y leading-relaxed"
        />
      </div>

      {/* Live Error Messages */}
      {syntaxError && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium space-y-1">
          <p className="font-bold">Syntax Error {syntaxError.line ? `on Line ${syntaxError.line}` : ""}</p>
          <p>{syntaxError.message}</p>
        </div>
      )}

      {schemaErrors.length > 0 && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium space-y-1 max-h-36 overflow-y-auto">
          <p className="font-bold">{schemaErrors.length} Schema Validation Issues:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {schemaErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
