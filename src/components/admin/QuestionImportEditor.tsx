"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImportJson, importJsonSchema } from "@/lib/validators/question";
import { parsePlainTextQuestions } from "@/lib/importParser";

import { SyllabusSelect } from "@/components/shared/SyllabusSelect";
import { getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, Copy, AlertCircle, Loader2 } from "lucide-react";
import { generateAiQuestionPrompt } from "@/lib/prompts/aiQuestionPrompt";

interface Option { _id: string; name: string; nameHindi?: string }

interface Props {
  initialValue?: string;
  onChange: (value: string, parsed: ImportJson | null, errors: string[]) => void;
  subjectsList: Option[];
  topicsList: Option[];
  selectedSubjectId: string;
  selectedTopicId: string;
  onSubjectChangeId: (id: string) => void;
  onTopicChangeId: (id: string) => void;
  subtopicName: string;
  onSubtopicNameChange: (value: string) => void;
  negativeMarking: boolean;
  onNegativeMarkingChange: (value: boolean) => void;
  isImporting?: boolean;
  onImportClick?: () => void;
}

export function QuestionImportEditor({
  initialValue = "",
  onChange,
  subjectsList,
  topicsList,
  selectedSubjectId,
  selectedTopicId,
  onSubjectChangeId,
  onTopicChangeId,
  subtopicName,
  onSubtopicNameChange,
  negativeMarking,
  onNegativeMarkingChange,
  isImporting = false,
  onImportClick,
}: Props) {
  const [code, setCode] = useState(initialValue);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<ImportJson | null>(null);
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setCode(initialValue), [initialValue]);

  const subject = subjectsList.find((x) => x._id === selectedSubjectId);
  const topic = topicsList.find((x) => x._id === selectedTopicId);
  const prompt = useMemo(() => generateAiQuestionPrompt({
    subject: getSubjectDisplayName(subject) || "Subject",
    topic: getTopicDisplayName(topic) || "Topic",
    setName: subtopicName || "Set 1",
  }), [subject, topic, subtopicName]);

  function parse(value: string) {
    if (!value.trim()) {
      setParsed(null); setError(""); onChange(value, null, []); return;
    }
    try {
      const obj = JSON.parse(value);
      const result = importJsonSchema.safeParse(obj);
      if (!result.success) throw new Error(result.error.issues[0]?.message || "Invalid question data.");
      setParsed(result.data); setError(""); onChange(value, result.data, []);
      return;
    } catch {
      const plain = parsePlainTextQuestions(
        value,
        getSubjectDisplayName(subject) || "General Studies",
        getTopicDisplayName(topic) || "General Knowledge",
        subtopicName || "Set 1",
      );
      if (plain.data && plain.data.questions.length) {
        setParsed(plain.data); setError(""); onChange(value, plain.data, []); return;
      }
      setParsed(null); setError(plain.error || "Questions could not be parsed."); onChange(value, null, [plain.error || "Invalid questions."]);
    }
  }

  function copyPrompt() {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="space-y-4">
      <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2">
        <div><Label>Subject</Label><SyllabusSelect options={subjectsList} value={selectedSubjectId} onValueChange={onSubjectChangeId} /></div>
        <div><Label>Topic</Label><SyllabusSelect options={topicsList} value={selectedTopicId} onValueChange={onTopicChangeId} disabled={!selectedSubjectId} /></div>
        <div><Label>Set</Label><input value={subtopicName} onChange={(e) => onSubtopicNameChange(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={negativeMarking} onChange={(e) => onNegativeMarkingChange(e.target.checked)} /> Negative marking</label>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2"><Badge>Gemini prompt</Badge><Button type="button" variant="outline" size="sm" onClick={copyPrompt}><Copy className="mr-1 h-4 w-4" />{copied ? "Copied" : "Copy"}</Button></div>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs">{prompt}</pre>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <textarea ref={textRef} value={code} onChange={(e) => { setCode(e.target.value); parse(e.target.value); }} placeholder="Paste Gemini Markdown response here…" spellCheck={false} className="min-h-[420px] w-full resize-y rounded-xl bg-card p-4 font-mono text-sm outline-none" />
      </CardContent></Card>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Import data is invalid</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {parsed && <Badge className="gap-1"><Check className="h-4 w-4" /> {parsed.questions.length} questions ready</Badge>}

      <Button type="button" onClick={onImportClick} disabled={!parsed?.questions.length || !selectedTopicId || !subtopicName.trim() || isImporting} className="w-full">
        {isImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing…</> : "Import questions"}
      </Button>
    </div>
  );
}
