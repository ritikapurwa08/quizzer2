"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { QuestionImportEditor } from "./QuestionImportEditor";
import { ImportJson } from "@/lib/validators/question";
import { Id } from "../../../convex/_generated/dataModel";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle2, Play } from "lucide-react";
import Link from "next/link";

export function ImportWizard() {
  const [editorCode, setEditorCode] = useState("");
  const [parsed, setParsed] = useState<ImportJson | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState<Id<"subjects"> | "">("");
  const [selectedTopicId, setSelectedTopicId] = useState<Id<"topics"> | "">("");
  const [subtopicName, setSubtopicName] = useState("Part 1");
  const [questionCount, setQuestionCount] = useState(10);
  const [negativeMarking, setNegativeMarking] = useState(true);

  const [lastImportedSet, setLastImportedSet] = useState<{
    id: Id<"testSets">;
    name: string;
    count: number;
    timeSeconds: number;
  } | null>(null);

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

  const createTestSet = useMutation(api.testSets.create);
  const bulkImport = useMutation(api.questions.bulkImport);
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

  // Auto-increment / default subtopic name based on existing test sets under the topic
  const userEditedSubtopicRef = useRef(false);
  useEffect(() => {
    if (!userEditedSubtopicRef.current && existingTestSets) {
      const nextPartNum = existingTestSets.length + 1;
      setSubtopicName(`Part ${nextPartNum}`);
    }
  }, [existingTestSets, selectedTopicId]);

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

  const handleEditorChange = useCallback(
    (code: string, parsedData: ImportJson | null, errs: string[]) => {
      setParsed(parsedData);
      setErrors(errs);
    },
    []
  );

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
      // 1. Create Test Set with user's subtopic name & negative marking setting
      const testSetId = await createTestSet({
        topicId: selectedTopicId as Id<"topics">,
        name: subtopicName.trim(),
        negativeMarking,
      });

      // 2. Bulk insert questions
      const result = await bulkImport({ testSetId, questions: parsed.questions });
      const elapsed = Math.max(0.1, (Date.now() - startTime) / 1000);

      // 3. User feedback
      const skippedNote = errors.length > 0 ? ` (${errors.length} malformed question(s) skipped)` : "";
      showToast(`✅ ${result.imported} Questions Imported Successfully!${skippedNote}`, "success");

      setLastImportedSet({
        id: testSetId,
        name: subtopicName.trim(),
        count: result.imported,
        timeSeconds: parseFloat(elapsed.toFixed(1)),
      });

      // 4. Auto-advance to next part and clear editor for next batch
      const currentMatch = subtopicName.match(/^(?:Part|भाग)\s*(\d+)$/i);
      if (currentMatch && currentMatch[1]) {
        const nextNum = parseInt(currentMatch[1], 10) + 1;
        setSubtopicName(`Part ${nextNum}`);
      } else {
        const nextCount = (existingTestSets?.length ?? 0) + 2;
        setSubtopicName(`Part ${nextCount}`);
      }

      setEditorCode("");
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-success/15 border border-success/30 text-success animate-in fade-in-0 slide-in-from-top-2 duration-200 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <div className="text-xs font-hindi">
              <span className="font-bold">{lastImportedSet.count} प्रश्न</span> सफलतापूर्वक{" "}
              <span className="font-semibold underline underline-offset-2">"{lastImportedSet.name}"</span> में जोड़े गए ({lastImportedSet.timeSeconds}s)!
            </div>
          </div>
          <Link
            href={`/quiz/${lastImportedSet.id}`}
            className="flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-success text-success-foreground hover:bg-success/90 transition-colors shrink-0 shadow-xs font-hindi"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> अभी टेस्ट दें →
          </Link>
        </div>
      )}

      {/* Streamlined Question Import Editor */}
      <QuestionImportEditor
        initialValue={editorCode}
        onChange={handleEditorChange}
        subjectsList={subjects}
        topicsList={topics}
        selectedSubjectId={selectedSubjectId}
        selectedTopicId={selectedTopicId}
        onSubjectChangeId={handleSubjectChangeId}
        onTopicChangeId={handleTopicChangeId}
        subtopicName={subtopicName}
        onSubtopicNameChange={handleSubtopicNameChange}
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
        negativeMarking={negativeMarking}
        onNegativeMarkingChange={setNegativeMarking}
        isImporting={isImporting}
        onImportClick={handleImport}
      />
    </div>
  );
}
