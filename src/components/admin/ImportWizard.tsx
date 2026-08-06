"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuestionImportEditor } from "./QuestionImportEditor";
import { importJsonSchema, ImportJson } from "@/lib/validators/question";
import { slugify } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { AlertTriangle, CheckCircle2, FileText, Layers, ArrowRight } from "lucide-react";

type Step = "editor" | "preview" | "done";
type DuplicateStrategy = "skip" | "replace" | "keep";

export function ImportWizard() {
  const [step, setStep] = useState<Step>("editor");
  const [editorCode, setEditorCode] = useState("");
  const [parsed, setParsed] = useState<ImportJson | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<Id<"subjects"> | "">("");
  const [selectedTopicId, setSelectedTopicId] = useState<Id<"topics"> | "">("");
  const [testSetName, setTestSetName] = useState("");
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>("skip");

  // Completion Report state
  const [report, setReport] = useState<{
    found: number;
    imported: number;
    duplicates: number;
    invalid: number;
    timeSeconds: number;
  } | null>(null);

  const subjects = useQuery(api.subjects.list) ?? [];
  const topics = useQuery(
    api.topics.listBySubject,
    selectedSubjectId ? { subjectId: selectedSubjectId as Id<"subjects"> } : "skip"
  ) ?? [];

  const createTestSet = useMutation(api.testSets.create);
  const bulkImport = useMutation(api.questions.bulkImport);
  const seedFixedSyllabus = useMutation(api.seed.seedFixedSyllabus);

  // Auto-seed fixed syllabus if no subjects exist yet
  useEffect(() => {
    if (subjects && subjects.length === 0) {
      seedFixedSyllabus();
    }
  }, [subjects, seedFixedSyllabus]);

  // Auto-select first subject if none selected
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId && subjects[0]) {
      setSelectedSubjectId(subjects[0]._id);
    }
  }, [subjects, selectedSubjectId]);

  // Auto-select first topic if none selected for current subject
  useEffect(() => {
    if (topics.length > 0 && !selectedTopicId && topics[0]) {
      setSelectedTopicId(topics[0]._id);
    }
  }, [topics, selectedTopicId]);

  // Auto-match topic when topics list loads and parsed payload is available
  useEffect(() => {
    if (parsed && parsed.topic && topics.length > 0 && !selectedTopicId) {
      const topicStr = parsed.topic;
      const matchedTopic = topics.find(
        (t) =>
          t.slug === slugify(topicStr) ||
          t.name.toLowerCase().includes(topicStr.toLowerCase()) ||
          topicStr.toLowerCase().includes(t.name.toLowerCase())
      );
      if (matchedTopic) {
        setSelectedTopicId(matchedTopic._id);
      }
    }
  }, [topics, parsed, selectedTopicId]);

  function handleSubjectChange(subjectId: Id<"subjects">) {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId("");
  }

  function handleProceedToPreview() {
    if (!parsed) return;
    setTestSetName(parsed.testSet || "Practice Set 1");

    // Auto match subject if possible
    if (parsed.subject) {
      const subjStr = parsed.subject;
      const matchedSubject = subjects.find(
        (s) =>
          s.slug === slugify(subjStr) ||
          s.name.toLowerCase().includes(subjStr.toLowerCase()) ||
          subjStr.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matchedSubject) {
        setSelectedSubjectId(matchedSubject._id);
      }
    }

    setStep("preview");
  }

  async function handleImport() {
    if (!parsed) return;
    if (!selectedTopicId) {
      setErrors(["Please select a fixed Topic before importing."]);
      return;
    }
    if (!testSetName.trim()) {
      setErrors(["Please enter a Question Set Name."]);
      return;
    }

    const startTime = Date.now();

    try {
      const testSetId = await createTestSet({
        topicId: selectedTopicId as Id<"topics">,
        name: testSetName.trim(),
        negativeMarking,
      });

      const result = await bulkImport({ testSetId, questions: parsed.questions });
      const elapsed = (Date.now() - startTime) / 1000;

      setReport({
        found: parsed.questions.length,
        imported: result.imported,
        duplicates: parsed.questions.length - result.imported,
        invalid: errors.length,
        timeSeconds: parseFloat(elapsed.toFixed(2)),
      });

      setStep("done");
    } catch (err: any) {
      setErrors([err.message || "Failed to import questions."]);
    }
  }

  // Calculate difficulty distribution
  const difficultyCounts = parsed
    ? parsed.questions.reduce(
        (acc, q) => {
          acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
          return acc;
        },
        { easy: 0, medium: 0, hard: 0 } as Record<string, number>
      )
    : { easy: 0, medium: 0, hard: 0 };

  const handleEditorChange = useCallback((code: string, parsedData: ImportJson | null, errs: string[]) => {
    setEditorCode(code);
    setParsed(parsedData);
    setErrors(errs);
  }, []);

  const selectedSubject = subjects.find((s) => s._id === selectedSubjectId);
  const selectedTopic = topics.find((t) => t._id === selectedTopicId);

  function handleSubjectChangeName(name: string) {
    const found = subjects.find((s) => s.name === name);
    if (found) {
      setSelectedSubjectId(found._id);
      setSelectedTopicId("");
    }
  }

  function handleTopicChangeName(name: string) {
    const found = topics.find((t) => t.name === name);
    if (found) {
      setSelectedTopicId(found._id);
    }
  }

  // Step 1: Full-Screen Question Import Editor Workspace
  if (step === "editor") {
    return (
      <div className="space-y-4">
        <QuestionImportEditor
          initialValue={editorCode}
          onChange={handleEditorChange}
          subjectsList={subjects}
          topicsList={topics}
          selectedSubjectName={selectedSubject?.name || ""}
          selectedTopicName={selectedTopic?.name || ""}
          onSubjectChangeName={handleSubjectChangeName}
          onTopicChangeName={handleTopicChangeName}
        />

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleProceedToPreview}
            disabled={!parsed || errors.length > 0}
            className="w-full sm:w-auto font-semibold px-8 py-3 text-sm flex items-center justify-center gap-2"
          >
            <span>Proceed to Preview ({parsed?.questions.length ?? 0} Questions)</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Destination & Preview Step
  if (step === "preview") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl tracking-tight">Question Set Target & Preview</h2>
          <Button variant="ghost" size="sm" onClick={() => setStep("editor")} className="text-xs">
            ← Back to Full-Screen Editor
          </Button>
        </div>

        {errors.length > 0 && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-2 font-medium text-destructive mb-1 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {errors.length} error(s) must be resolved
            </div>
            <ul className="text-xs space-y-1 list-disc pl-5">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {parsed && (
          <div className="grid gap-4 rounded-xl border border-border p-5 bg-card shadow-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject-select" className="font-semibold text-sm">Target Syllabus Subject</Label>
                <select
                  id="subject-select"
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value as Id<"subjects">)}
                  className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>Select Fixed Subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="topic-select" className="font-semibold text-sm">Target Fixed Topic</Label>
                <select
                  id="topic-select"
                  disabled={!selectedSubjectId}
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value as Id<"topics">)}
                  className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm font-medium disabled:opacity-50 focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>
                    {!selectedSubjectId ? "Select a Subject first" : "Select Topic"}
                  </option>
                  {topics.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="set-name" className="font-semibold text-sm">Question Set Name</Label>
                <Input
                  id="set-name"
                  value={testSetName}
                  onChange={(e) => setTestSetName(e.target.value)}
                  placeholder="Practice Set 1 / Set A"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={negativeMarking}
                    onChange={(e) => setNegativeMarking(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  Enable Negative Marking (-0.25)
                </label>
              </div>
            </div>

            {/* Duplicate Strategy */}
            <div className="space-y-2 pt-2 border-t border-border mt-2">
              <Label className="font-semibold text-sm">Duplicate Handling Strategy</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDuplicateStrategy("skip")}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                    duplicateStrategy === "skip"
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-sm"
                      : "border-input bg-background hover:bg-muted"
                  }`}
                >
                  Skip Duplicates
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateStrategy("replace")}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                    duplicateStrategy === "replace"
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-sm"
                      : "border-input bg-background hover:bg-muted"
                  }`}
                >
                  Replace Duplicates
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateStrategy("keep")}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                    duplicateStrategy === "keep"
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-sm"
                      : "border-input bg-background hover:bg-muted"
                  }`}
                >
                  Keep Both
                </button>
              </div>
            </div>

            {/* Stats Breakdown Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border mt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm">{parsed.questions.length} Total Questions</span>
                <span className="px-2.5 py-1 rounded-full bg-success/15 text-success font-bold">
                  Easy: {difficultyCounts.easy}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary font-bold">
                  Medium: {difficultyCounts.medium}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-destructive/15 text-destructive font-bold">
                  Hard: {difficultyCounts.hard}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* First 5 Preview Cards */}
        {parsed && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Questions Preview (Showing first 5 of {parsed.questions.length})
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {parsed.questions.slice(0, 5).map((q, i) => (
                <div key={i} className="rounded-xl border border-border p-4 text-sm bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>Q{i + 1} · TYPE: {q.type.toUpperCase()}</span>
                    <span className="capitalize font-bold text-foreground">{q.difficulty}</span>
                  </div>
                  <p className="font-semibold whitespace-pre-line leading-relaxed">{q.questionText}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-lg border ${
                          opt.id === q.correctAnswer
                            ? "border-success bg-success/15 font-bold text-success"
                            : "border-border bg-card"
                        }`}
                      >
                        <span className="mr-1.5 font-mono">{opt.id}:</span> {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setStep("editor")}>
            Back to Full-Screen Editor
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsed || !selectedTopicId || !testSetName.trim()}
            className="flex-1 font-bold text-sm py-3"
          >
            Confirm & Import {parsed?.questions.length ?? 0} Questions
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Completion Report View
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 py-10 text-center bg-card rounded-xl border border-border shadow-sm">
        <div className="p-4 rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Questions Imported Successfully!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Question Set "{testSetName}" is live under the selected topic.
          </p>
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card text-center shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold">Total Found</p>
            <p className="text-3xl font-bold mt-1">{report.found}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold">Successfully Imported</p>
            <p className="text-3xl font-bold text-success mt-1">{report.imported}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold">Duplicates Handled</p>
            <p className="text-3xl font-bold text-primary mt-1">{report.duplicates}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold">Time Elapsed</p>
            <p className="text-3xl font-bold mt-1">{report.timeSeconds}s</p>
          </div>
        </div>
      )}

      <Button
        onClick={() => {
          setStep("editor");
          setParsed(null);
          setEditorCode("");
          setSelectedSubjectId("");
          setSelectedTopicId("");
          setTestSetName("");
          setReport(null);
        }}
        className="w-full font-semibold py-3"
      >
        Import Another Question Set
      </Button>
    </div>
  );
}
