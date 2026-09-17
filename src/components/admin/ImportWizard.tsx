"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { QuestionImportEditor } from "./QuestionImportEditor";
import { ImportJson } from "@/lib/validators/question";
import { Id } from "../../../convex/_generated/dataModel";
import { useToast } from "@/components/ui/Toast";
import { getTopicDisplayName } from "@/lib/utils";
import { CheckCircle2, Play, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ImportWizard() {
  const [resetKey, setResetKey] = useState(0);
  const [parsed, setParsed] = useState<ImportJson | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState<Id<"subjects"> | "">("");
  const [selectedTopicId, setSelectedTopicId] = useState<Id<"topics"> | "">("");
  const [subtopicName, setSubtopicName] = useState("Part 1");
  const [negativeMarking, setNegativeMarking] = useState(true);

  const [lastImportedSet, setLastImportedSet] = useState<{ id: Id<"testSets">; count: number; timeSeconds: number } | null>(null);

  const { showToast } = useToast();

  const subjects = useQuery(api.subjects.list) ?? [];
  const topics = useQuery(
    api.topics.listBySubject,
    selectedSubjectId ? { subjectId: selectedSubjectId as Id<"subjects"> } : "skip"
  ) ?? [];

  const existingTestSets = useQuery(
    api.testSets.listByTopic,
    selectedTopicId ? { topicId: selectedTopicId as Id<"topics"> } : "skip"
  ) ?? [];

  const importTestSet = useMutation(api.questions.importTestSet);
  const seedFixedSyllabus = useMutation(api.seed.seedFixedSyllabus);

  // Auto-seed default syllabus if empty
  useEffect(() => {
    if (subjects && subjects.length === 0) seedFixedSyllabus();
  }, [subjects, seedFixedSyllabus]);

  // Default to first subject
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId && subjects[0]) {
      setSelectedSubjectId(subjects[0]._id);
    }
  }, [subjects, selectedSubjectId]);

  // Default to first topic when subject changes
  const lastSubjectRef = useRef<string>("");
  useEffect(() => {
    if (
      topics.length > 0 &&
      selectedSubjectId &&
      lastSubjectRef.current !== selectedSubjectId
    ) {
      lastSubjectRef.current = selectedSubjectId;
      setSelectedTopicId(topics[0]._id);
    }
  }, [topics, selectedSubjectId]);

  // Derive the active topic object for Hindi display
  const activeTopic = topics.find((t) => t._id === selectedTopicId);
  const activeTopicDisplay = getTopicDisplayName(activeTopic);
  const existingCount = existingTestSets.length;

  // Auto-increment / default subtopic name based on existing test sets under the topic
  // Uses Hindi topic name + भाग N
  const userEditedSubtopicRef = useRef(false);
  useEffect(() => {
    if (!userEditedSubtopicRef.current && selectedTopicId && activeTopicDisplay) {
      const nextPartNum = existingCount + 1;
      const expectedName = `${activeTopicDisplay} भाग ${nextPartNum}`;
      setSubtopicName((prev) => (prev === expectedName ? prev : expectedName));
    }
  }, [existingCount, selectedTopicId, activeTopicDisplay]);

  function handleSubjectChangeId(subjectId: string) {
    setSelectedSubjectId(subjectId as Id<"subjects">);
    setSelectedTopicId("");
    lastSubjectRef.current = "";
    userEditedSubtopicRef.current = false;
  }

  function handleTopicChangeId(topicId: string) {
    setSelectedTopicId(topicId as Id<"topics">);
    userEditedSubtopicRef.current = false;
  }

  function handleSubtopicNameChange(val: string) {
    userEditedSubtopicRef.current = true;
    setSubtopicName(val);
  }

  const handleParsedChange = useCallback((parsedData: ImportJson | null) => {
    setParsed(parsedData);
  }, []);

  async function handleImport() {
    if (!parsed || parsed.questions.length === 0) {
      showToast("No valid questions found to import.", "warning");
      return;
    }
    if (!selectedTopicId) {
      showToast("Please select a target Topic.", "warning");
      return;
    }
    if (!subtopicName.trim()) {
      showToast("Please provide a Subtopic / Set name.", "warning");
      return;
    }

    setIsImporting(true);
    const startTime = Date.now();

    try {
      // Import the selected set atomically.
      const result = await importTestSet({
        topicId: selectedTopicId as Id<"topics">,
        name: subtopicName.trim(),
        negativeMarking,
        questions: parsed.questions,
      });
      const testSetId = result.testSetId;
      const elapsed = Math.max(0.1, (Date.now() - startTime) / 1000);

      // Feedback
      showToast(`✅ ${result.imported} questions imported successfully.`, "success");

      setLastImportedSet({
        id: testSetId,
        count: result.imported,
        timeSeconds: parseFloat(elapsed.toFixed(1)),
      });

      // Clear the editor and auto-advance to next set
      setResetKey((k) => k + 1);
      setParsed(null);
      userEditedSubtopicRef.current = false;
    } catch (err: any) {
      showToast(err.message || "Failed to import questions. Your text has been preserved.", "warning");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Success Notification Banner */}
      {lastImportedSet && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-success/15 border border-success/30 text-success animate-in fade-in-0 slide-in-from-top-2 duration-200 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <div className="text-sm font-hindi">
              <span className="font-bold">✓ {lastImportedSet.count} प्रश्न सफलतापूर्वक आयात किए गए</span>{" "}
              <span className="text-xs opacity-80">({lastImportedSet.timeSeconds}s)</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Primary action: take the test now */}
            <Link
              href={`/quiz/${lastImportedSet.id}`}
              className="flex items-center justify-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl bg-success text-success-foreground hover:bg-success/90 transition-colors shadow-xs font-hindi"
            >
              <Play className="h-4 w-4 fill-current" /> अभी टेस्ट दें →
            </Link>
            {/* Secondary action: add next batch */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLastImportedSet(null)}
              className="h-10 text-xs font-semibold rounded-xl border-success/40 text-success hover:bg-success/10 font-hindi gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> अगला बैच जोड़ें
            </Button>
          </div>
        </div>
      )}

      {/* Streamlined Question Import Editor */}
      <QuestionImportEditor
        resetKey={resetKey}
        onParsedChange={handleParsedChange}
        subjectsList={subjects}
        topicsList={topics}
        selectedSubjectId={selectedSubjectId}
        selectedTopicId={selectedTopicId}
        onSubjectChangeId={handleSubjectChangeId}
        onTopicChangeId={handleTopicChangeId}
        subtopicName={subtopicName}
        onSubtopicNameChange={handleSubtopicNameChange}
        negativeMarking={negativeMarking}
        onNegativeMarkingChange={setNegativeMarking}
        isImporting={isImporting}
        onImportClick={handleImport}
      />
    </div>
  );
}
