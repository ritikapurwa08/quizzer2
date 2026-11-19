"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { QuestionImportEditor, ImportOptionsPayload } from "./QuestionImportEditor";
import { ImportJson } from "@/lib/validators/question";
import { Id } from "../../../convex/_generated/dataModel";
import { useToast } from "@/components/ui/Toast";
import { getTopicDisplayName } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";
import { calculateNextSetName, extractBaseTopicName, calculateBatchSetNames } from "@/lib/setNumbering";
import { calculateSubTopicNextPart } from "@/lib/pool/subTopicMatcher";
import { ImportConfirmationBanner, ImportConfirmationData } from "./import";

export function ImportWizard() {
  const searchParams = useSearchParams();
  const masterTopicIdParam = searchParams.get("masterTopicId");

  const [resetKey, setResetKey] = useState(0);
  const [parsed, setParsed] = useState<ImportJson | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const isImportingRef = useRef(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState<Id<"subjects"> | "">("");
  const [selectedTopicId, setSelectedTopicId] = useState<Id<"topics"> | "">("");
  const [selectedSubTopicId, setSelectedSubTopicId] = useState("");
  const [subtopicName, setSubtopicName] = useState("");
  const [confirmation, setConfirmation] = useState<ImportConfirmationData | null>(null);

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

  const [localSets, setLocalSets] = useState<Array<{ id: string; name: string }>>([]);
  const importTestSet = useMutation(api.testSets.importTestSet);
  const seedFixedSyllabus = useMutation(api.seed.seedFixedSyllabus);

  const urlMasterTopic = useMemo(() => {
    if (!masterTopicIdParam) return null;
    const num = parseInt(masterTopicIdParam, 10);
    return MASTER_TOPICS_LIST.find((mt) => mt.id === num) || null;
  }, [masterTopicIdParam]);

  const refreshLocalSets = useCallback(async () => {
    const targetQueryId = selectedTopicId || (urlMasterTopic ? String(urlMasterTopic.id) : "");
    if (!targetQueryId) {
      setLocalSets([]);
      return;
    }
    try {
      const res = await fetch(`/api/sets/by-topic/${encodeURIComponent(targetQueryId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.sets)) setLocalSets(data.sets);
    } catch (err) {
      console.error("Error loading local sets:", err);
    }
  }, [selectedTopicId, urlMasterTopic]);

  useEffect(() => {
    refreshLocalSets();
  }, [refreshLocalSets]);

  const allExistingSets = useMemo(() => {
    const merged: Array<{ name: string; _id?: string; id?: string }> = [...existingTestSets];
    const seenNames = new Set(merged.map((s) => s.name.trim().toLowerCase()));
    for (const ls of localSets) {
      const lower = ls.name.trim().toLowerCase();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        merged.push({ name: ls.name, id: ls.id, _id: ls.id });
      }
    }
    return merged;
  }, [existingTestSets, localSets]);

  useEffect(() => {
    if (subjects && subjects.length === 0) seedFixedSyllabus();
  }, [subjects, seedFixedSyllabus]);

  // Initial auto-selection from URL masterTopicId
  const urlInitRef = useRef(false);
  useEffect(() => {
    if (!urlInitRef.current && urlMasterTopic && subjects.length > 0) {
      const matchSub = subjects.find((s) => s.nameHindi === urlMasterTopic.subjectHindi || s.name === urlMasterTopic.subjectName);
      if (matchSub) setSelectedSubjectId(matchSub._id);
      urlInitRef.current = true;
    }
  }, [urlMasterTopic, subjects]);

  useEffect(() => {
    if (urlMasterTopic && topics.length > 0 && selectedSubjectId && !selectedTopicId) {
      const matchTop = topics.find((t) => t.nameHindi === urlMasterTopic.nameHindi || t.name === urlMasterTopic.nameEnglish);
      if (matchTop) setSelectedTopicId(matchTop._id);
    }
  }, [urlMasterTopic, topics, selectedSubjectId, selectedTopicId]);

  const activeTopic = topics.find((t) => t._id === selectedTopicId);
  const activeTopicDisplay = getTopicDisplayName(activeTopic);

  const userEditedSubtopicRef = useRef(false);
  useEffect(() => {
    const topicDisplayName = activeTopicDisplay || urlMasterTopic?.nameHindi || "";
    if (!userEditedSubtopicRef.current && selectedTopicId && topicDisplayName) {
      const { fullName } = calculateNextSetName(allExistingSets, topicDisplayName);
      setSubtopicName((prev) => (prev === fullName ? prev : fullName));
    } else if (!selectedTopicId) {
      setSubtopicName("");
    }
  }, [allExistingSets, selectedTopicId, activeTopicDisplay, urlMasterTopic]);

  // Clean URL parameter helper to prevent sticky stale state
  const clearUrlParam = () => {
    if (typeof window !== "undefined" && window.location.search.includes("masterTopicId")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("masterTopicId");
      window.history.replaceState({}, "", url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : ""));
    }
  };

  function handleSubjectChangeId(subjectId: string) {
    setSelectedSubjectId(subjectId as Id<"subjects">);
    setSelectedTopicId("");
    setSelectedSubTopicId("");
    setSubtopicName("");
    setConfirmation(null);
    userEditedSubtopicRef.current = false;
    clearUrlParam();
  }

  function handleTopicChangeId(topicId: string) {
    setSelectedTopicId(topicId as Id<"topics">);
    setSelectedSubTopicId("");
    setConfirmation(null);
    userEditedSubtopicRef.current = false;
    clearUrlParam();
  }

  const handleParsedChange = useCallback((parsedData: ImportJson | null) => {
    setParsed(parsedData);
  }, []);

  async function handleImport(options?: ImportOptionsPayload) {
    if (isImportingRef.current || isImporting) return;
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

    isImportingRef.current = true;
    setIsImporting(true);
    const totalQCount = parsed.questions.length;
    const isMultiSet = totalQCount > 20 && !options?.isFinalSet;
    const setsCount = isMultiSet ? Math.ceil(totalQCount / 20) : 1;

    const match = subtopicName.match(/(?:Part|भाग|Set|सेट)[\s\-–—:]*(\d+)/i) || subtopicName.match(/(\d+)/);
    const startSetNum = match ? parseInt(match[1], 10) : 1;
    const baseName = extractBaseTopicName(subtopicName) || activeTopicDisplay || "Set";
    const plannedNames = calculateBatchSetNames(baseName, startSetNum, setsCount);
    const createdNames: string[] = [];

    try {
      for (let sIdx = 0; sIdx < setsCount; sIdx++) {
        const chunkQs = setsCount > 1 ? parsed.questions.slice(sIdx * 20, (sIdx + 1) * 20) : parsed.questions;
        const chunkName = plannedNames[sIdx] || subtopicName.trim();
        await importTestSet({
          topicId: selectedTopicId as Id<"topics">,
          name: chunkName,
          negativeMarking: true,
          questions: chunkQs,
          isFinalSet: sIdx === setsCount - 1 ? options?.isFinalSet : false,
          masterTopicId: options?.masterTopicId,
          subTopicId: options?.subTopicId,
          subTopic: options?.subTopic,
        });
        createdNames.push(chunkName);
      }

      if (options?.masterTopicId) {
        try {
          const selectedQuestionIds = parsed.questions
            .map((q) => q.meta?.sourceQuestionId || (q as any).sourceQuestionId || (q as any).id)
            .filter(Boolean);
          await fetch("/api/admin/finalize-local-set", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              masterTopicId: options.masterTopicId,
              setNumber: startSetNum + setsCount - 1,
              startSetNumber: startSetNum,
              setCount: setsCount,
              setName: subtopicName.trim(),
              plannedNames,
              subTopicId: options.subTopicId,
              subTopic: options.subTopic,
              selectedQuestionIds,
              questions: parsed.questions,
            }),
          });
        } catch (syncErr) {
          console.error("Local pool state sync error:", syncErr);
        }
      }

      setConfirmation({
        addedCount: totalQCount,
        subjectName: subjects.find((s) => s._id === selectedSubjectId)?.nameHindi || "Rajasthan GK",
        topicName: activeTopicDisplay || "Topic",
        subTopicName: options?.subTopic,
        setNames: createdNames,
      });

      showToast(`✅ ${totalQCount} questions imported successfully across ${setsCount} set(s).`, "success");

      const nextSetName = `${baseName} भाग ${startSetNum + setsCount}`;
      userEditedSubtopicRef.current = false;
      setSubtopicName(nextSetName);
      setResetKey((k) => k + 1);
      setParsed(null);
      await refreshLocalSets();
    } catch (err: any) {
      showToast(err?.message || "Failed to import questions. Text preserved.", "warning");
    } finally {
      setIsImporting(false);
      isImportingRef.current = false;
    }
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Admin Overview</span>
        </Link>
      </div>

      <ImportConfirmationBanner
        confirmation={confirmation}
        onDismiss={() => setConfirmation(null)}
      />

      <QuestionImportEditor
        resetKey={resetKey}
        onParsedChange={handleParsedChange}
        subjectsList={subjects}
        topicsList={topics}
        selectedSubjectId={selectedSubjectId}
        selectedTopicId={selectedTopicId}
        onSubjectChangeId={handleSubjectChangeId}
        onTopicChangeId={handleTopicChangeId}
        selectedSubTopicId={selectedSubTopicId}
        onSubTopicChange={(subId) => {
          setSelectedSubTopicId(subId);
          userEditedSubtopicRef.current = false;
          if (subId) {
            const mInfo = MASTER_TOPICS_LIST.find((mt) => mt.id === (urlMasterTopic?.id || activeTopic?.masterTopicId));
            const sub = mInfo?.subTopics?.find((s) => s.id === subId);
            if (sub) setSubtopicName(`${sub.name} भाग ${calculateSubTopicNextPart(allExistingSets, subId, sub.name)}`);
          } else {
            const topicDisplayName = activeTopicDisplay || urlMasterTopic?.nameHindi || "";
            setSubtopicName(calculateNextSetName(allExistingSets, topicDisplayName).fullName);
          }
        }}
        subtopicName={subtopicName}
        onSubtopicNameChange={(val) => {
          userEditedSubtopicRef.current = true;
          setSubtopicName(val);
        }}
        isImporting={isImporting}
        onImportClick={handleImport}
        initialMasterTopicId={urlMasterTopic ? urlMasterTopic.id : undefined}
        existingTestSets={allExistingSets as any}
      />
    </div>
  );
}
