"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ImportJson,
  QuestionInput,
  validateImportBatch,
  BatchValidationResult,
} from "@/lib/validators/question";
import {
  validateAndIsolateQuestions,
  parsePlainTextQuestions,
} from "@/lib/importParser";

import { SyllabusSelect } from "@/components/shared/SyllabusSelect";
import { getSubjectDisplayName, getTopicDisplayName, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Layers,
  FileCode,
  ShieldCheck,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Eye,
  Hash,
  Award,
} from "lucide-react";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";

interface Option {
  _id: string;
  name: string;
  nameHindi?: string;
}

export interface ImportOptionsPayload {
  isFinalSet?: boolean;
  masterTopicId?: number;
  requeuedSourceIds?: Array<string | number>;
  sessionId?: string;
}

interface Props {
  initialValue?: string;
  resetKey?: number;
  onParsedChange?: (parsed: ImportJson | null) => void;
  onChange?: (value: string, parsed: ImportJson | null, errors: string[]) => void;
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
  onImportClick?: (options?: ImportOptionsPayload) => void;
  initialMasterTopicId?: number;
  existingTestSets?: Array<{ _id: string; name: string }>;
}

export function QuestionImportEditor({
  initialValue = "",
  resetKey,
  onParsedChange,
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
  initialMasterTopicId,
  existingTestSets = [],
}: Props) {
  const [code, setCode] = useState(initialValue);
  const [isFinalSet, setIsFinalSet] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const subject = subjectsList.find((x) => x._id === selectedSubjectId);
  const topic = topicsList.find((x) => x._id === selectedTopicId);
  const subjectName = getSubjectDisplayName(subject) || "";
  const topicName = getTopicDisplayName(topic) || "";

  // Derive masterTopicId from topic name or initial prop
  const masterTopicInfo = useMemo(() => {
    if (initialMasterTopicId) {
      return MASTER_TOPICS_LIST.find((mt) => mt.id === initialMasterTopicId) || null;
    }
    if (!topicName) return null;
    return (
      MASTER_TOPICS_LIST.find(
        (mt) =>
          mt.nameHindi === topicName ||
          topicName.includes(mt.nameHindi) ||
          mt.nameHindi.includes(topicName)
      ) || null
    );
  }, [topicName, initialMasterTopicId]);

  const activeMasterTopicId = initialMasterTopicId || masterTopicInfo?.id;

  // Reset editor text on resetKey change
  const lastResetKeyRef = useRef(resetKey ?? 0);
  useEffect(() => {
    if (resetKey !== undefined && resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey;
      setCode("");
      setIsFinalSet(false);
    }
  }, [resetKey]);

  useEffect(() => {
    if (initialValue !== undefined && initialValue === "" && code !== "") {
      setCode("");
    }
  }, [initialValue]);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setCode(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Parse and validate pasted or uploaded input
  const parseResult = useMemo(() => {
    const trimmed = code.trim();
    if (!trimmed) {
      return {
        questions: [] as QuestionInput[],
        parseError: "",
        isolationErrors: [] as string[],
        requeuedSourceIds: [] as Array<string | number>,
        rawParsedObj: null as any,
      };
    }

    try {
      const isolation = validateAndIsolateQuestions(trimmed);
      if (isolation.validQuestions.length > 0) {
        let rawParsedObj: any = null;
        try {
          rawParsedObj = JSON.parse(trimmed);
        } catch {
          // Plain text fallback or partial
        }
        return {
          questions: isolation.validQuestions,
          parseError: "",
          isolationErrors: isolation.invalidQuestions.map((iq) => iq.reason),
          requeuedSourceIds: isolation.requeuedSourceIds || [],
          rawParsedObj,
        };
      }
    } catch {
      // Fall through to plain text parser
    }

    // Fallback: Plain text question format
    const plain = parsePlainTextQuestions(
      trimmed,
      subjectName || "Rajasthan General Knowledge",
      topicName || "General Topic",
      subtopicName || "Set 1"
    );

    if (plain.data && plain.data.questions.length > 0) {
      return {
        questions: plain.data.questions,
        parseError: "",
        isolationErrors: [],
        requeuedSourceIds: [],
        rawParsedObj: null,
      };
    }

    return {
      questions: [] as QuestionInput[],
      parseError: plain.error || "प्रश्न पार्स नहीं हो सके। कृपया मान्य JSON पेस्ट करें या फ़ाइल चुनें।",
      isolationErrors: [],
      requeuedSourceIds: [],
      rawParsedObj: null,
    };
  }, [code, subjectName, topicName, subtopicName]);

  // Auto-detect Subject, Topic, and Set Name if present in the final set payload
  const autoConfiguredRef = useRef<string>("");
  useEffect(() => {
    const raw = parseResult.rawParsedObj;
    if (!raw) return;

    // Detect masterTopicId in top-level payload or first question
    const detectedTopicId: number | undefined =
      raw.masterTopicId ??
      raw.questions?.[0]?.masterTopicId ??
      raw.questions?.[0]?.meta?.masterTopicId;

    if (detectedTopicId && typeof detectedTopicId === "number") {
      const mtInfo = MASTER_TOPICS_LIST.find((mt) => mt.id === detectedTopicId);
      if (mtInfo) {
        const configKey = `${detectedTopicId}_${raw.setNumber || ""}`;
        if (autoConfiguredRef.current !== configKey) {
          autoConfiguredRef.current = configKey;

          // Auto-select matching subject if not yet matched
          const matchedSubject = subjectsList.find(
            (s) =>
              s.nameHindi === mtInfo.subjectHindi ||
              s.name === mtInfo.subjectName
          );
          if (matchedSubject && matchedSubject._id !== selectedSubjectId) {
            onSubjectChangeId(matchedSubject._id);
          }

          // Auto-select matching topic
          const matchedTopic = topicsList.find(
            (t) =>
              t.nameHindi === mtInfo.nameHindi ||
              (t.nameHindi && mtInfo.nameHindi.includes(t.nameHindi))
          );
          if (matchedTopic && matchedTopic._id !== selectedTopicId) {
            onTopicChangeId(matchedTopic._id);
          }

          // Auto-populate set name if setNumber is present
          if (raw.setNumber && typeof raw.setNumber === "number") {
            const topicLabel = mtInfo.nameHindi;
            const expectedName = `${topicLabel} भाग ${raw.setNumber}`;
            if (subtopicName !== expectedName) {
              onSubtopicNameChange(expectedName);
            }
          }
        }
      }
    }
  }, [
    parseResult.rawParsedObj,
    subjectsList,
    topicsList,
    selectedSubjectId,
    selectedTopicId,
    subtopicName,
    onSubjectChangeId,
    onTopicChangeId,
    onSubtopicNameChange,
  ]);

  // Quality gate checklist and structure validation
  const batchValidation: BatchValidationResult | null = useMemo(() => {
    if (!code.trim() || parseResult.questions.length === 0) return null;
    return validateImportBatch(parseResult.questions, {
      allowFinalBelow20: isFinalSet,
      isFinalSet,
    });
  }, [code, parseResult.questions, isFinalSet]);

  // Server-side duplicate provenance check (query Convex)
  const sourceIdsForDbCheck = useMemo(() => {
    return batchValidation?.sourceQuestionIds ?? [];
  }, [batchValidation]);

  const provenanceCheck = useQuery(
    api.questions.checkExistingProvenance,
    sourceIdsForDbCheck.length > 0 ? { sourceQuestionIds: sourceIdsForDbCheck } : "skip"
  );

  const existingInDbIds = provenanceCheck?.existingSourceIds ?? [];

  // Duplicate Set Name check in Convex under target topic
  const isDuplicateSetName = useMemo(() => {
    if (!subtopicName.trim() || !existingTestSets.length) return false;
    const cleanCurrent = subtopicName.trim().toLowerCase();
    return existingTestSets.some(
      (s) => s.name.trim().toLowerCase() === cleanCurrent
    );
  }, [subtopicName, existingTestSets]);

  // Combined error list
  const allErrors = useMemo(() => {
    const errs: string[] = [];
    if (parseResult.parseError) {
      errs.push(parseResult.parseError);
    }
    if (parseResult.isolationErrors.length > 0) {
      errs.push(...parseResult.isolationErrors);
    }
    if (batchValidation) {
      errs.push(...batchValidation.errors);
    }
    if (existingInDbIds.length > 0) {
      for (const id of existingInDbIds) {
        errs.push(`यह प्रश्न पहले से Quizzer में imported है (sourceQuestionId: ${id})।`);
      }
    }
    if (isDuplicateSetName) {
      errs.push(`इस टॉपिक में '${subtopicName.trim()}' नाम का टेस्ट सेट पहले से मौजूद है। कृपया दूसरा नाम या भाग संख्या चुनें।`);
    }
    return errs;
  }, [parseResult, batchValidation, existingInDbIds, isDuplicateSetName, subtopicName]);

  const isExact20 = parseResult.questions.length === 20;
  const isCountValid = isExact20 || (isFinalSet && parseResult.questions.length > 0);
  const hasNoDbCollisions = existingInDbIds.length === 0;

  const canImport =
    isCountValid &&
    batchValidation?.isValid === true &&
    allErrors.length === 0 &&
    !isDuplicateSetName &&
    Boolean(selectedTopicId) &&
    Boolean(subtopicName.trim()) &&
    !isImporting;

  // Propagate parsed payload to parent
  const lastEmittedRef = useRef<string>("");
  useEffect(() => {
    let currentPayload: ImportJson | null = null;
    let signature = "empty";

    if (code.trim() && canImport && isCountValid) {
      currentPayload = {
        subject: subjectName,
        topic: topicName,
        testSet: subtopicName.trim(),
        negativeMarking,
        questions: parseResult.questions,
      };
      signature = `valid::${selectedTopicId}::${subtopicName.trim()}::${parseResult.questions.length}`;
    } else if (code.trim()) {
      signature = `invalid::${allErrors.length}::${allErrors[0] ?? ""}`;
    }

    if (lastEmittedRef.current !== signature) {
      lastEmittedRef.current = signature;
      onParsedChange?.(currentPayload);
      onChange?.(code, currentPayload, allErrors);
    }
  }, [
    code,
    canImport,
    isCountValid,
    parseResult.questions,
    allErrors,
    subjectName,
    topicName,
    selectedTopicId,
    subtopicName,
    negativeMarking,
    onParsedChange,
    onChange,
  ]);

  const detectedCount = parseResult.questions.length;

  return (
    <div className="space-y-6">
      {/* 1. Target Configuration */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold tracking-tight">
                1. Target Configuration / विषय एवं सेट चयन
              </CardTitle>
            </div>
            {activeMasterTopicId && (
              <Badge variant="outline" className="text-[11px] font-hindi font-medium">
                Master Topic #{activeMasterTopicId}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-3.5 p-4 sm:p-6 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Subject (विषय)
            </Label>
            <SyllabusSelect
              options={subjectsList}
              value={selectedSubjectId}
              onValueChange={onSubjectChangeId}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Master Topic (शीर्षक)
            </Label>
            <SyllabusSelect
              options={topicsList}
              value={selectedTopicId}
              onValueChange={onTopicChangeId}
              disabled={!selectedSubjectId}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Set / Part Name (भाग / सेट नाम)
            </Label>
            <input
              value={subtopicName}
              onChange={(e) => onSubtopicNameChange(e.target.value)}
              placeholder="उदा. राजस्थान के प्रमुख उद्योग भाग 1"
              className={cn(
                "mt-0.5 h-10 w-full rounded-xl border bg-card px-3.5 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-ring transition-colors",
                isDuplicateSetName
                  ? "border-destructive text-destructive focus:ring-destructive"
                  : "border-input"
              )}
            />
            {isDuplicateSetName && (
              <p className="text-[11px] font-medium text-destructive mt-1">
                ⚠️ यह सेट नाम इस टॉपिक में पहले से मौजूद है।
              </p>
            )}
          </div>
          <div className="flex items-center sm:pt-6">
            <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => onNegativeMarkingChange(e.target.checked)}
                className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
              />
              <span>Negative Marking (-0.33 RPSC Standard)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 2. Final Approved JSON Input */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold tracking-tight">
                  2. Approved Set Input (अंतिम अनुमोदित सेट)
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                स्थानीय रूप से तैयार किया गया 20 प्रश्नों का अंतिम JSON सेट पेस्ट करें या फ़ाइल चुनें।
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs font-semibold rounded-xl gap-1.5 shadow-2xs"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Choose JSON File</span>
              </Button>
              {code.trim().length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCode("")}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="relative rounded-xl border border-input bg-card shadow-2xs transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:border-ring overflow-hidden">
            <textarea
              ref={textRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`{\n  "setId": "topic-17-set-001",\n  "masterTopicId": 17,\n  "masterTopic": "राजस्थान के प्रमुख उद्योग",\n  "setNumber": 1,\n  "questions": [\n    {\n      "id": "rg_004945",\n      "question": "राजस्थान में सफेद सीमेंट का प्रथम कारखाना कहाँ स्थापित हुआ?",\n      "options": ["गोटन", "खारिया खंगार", "ब्यावर", "चित्तौड़गढ़"],\n      "answer": 0,\n      "explanation": "राजस्थान में सफेद सीमेंट का पहला कारखाना 1984 में गोटन (नागौर) में जेके व्हाइट सीमेंट द्वारा स्थापित किया गया था।",\n      "exam": "REET",\n      "year": 2021\n    }\n  ]\n}`}
              spellCheck={false}
              className="w-full min-h-[220px] max-h-[400px] resize-y bg-transparent p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-hidden whitespace-pre overflow-x-auto"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {detectedCount === 0 ? (
                "कोई प्रश्न नहीं मिला"
              ) : isCountValid ? (
                <span className="text-success font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {detectedCount} प्रश्न पार्स हुए
                </span>
              ) : (
                <span className="text-destructive font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {detectedCount} / 20 प्रश्न
                </span>
              )}
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px]">
              <input
                type="checkbox"
                checked={isFinalSet}
                onChange={(e) => setIsFinalSet(e.target.checked)}
                className="h-3.5 w-3.5 rounded-sm border-border text-primary"
              />
              <span>Allow Final Set &lt; 20 (अंतिम सेट छूट)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 3. Interactive Question-by-Question PREVIEW */}
      {parseResult.questions.length > 0 && (
        <Card className="rounded-2xl border-border/70 shadow-xs overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold tracking-tight">
                  3. Set Preview (प्रश्नों का पूर्वावलोकन — कुल {detectedCount} प्रश्न)
                </CardTitle>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewExpanded(!previewExpanded)}
                className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
              >
                {previewExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    <span>Collapse All</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span>Expand All</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          {previewExpanded && (
            <CardContent className="p-4 sm:p-6 space-y-4 max-h-[600px] overflow-y-auto divide-y divide-border/40">
              {parseResult.questions.map((q, idx) => {
                const qNum = idx + 1;
                const sourceId =
                  q.meta?.sourceQuestionId ??
                  (q as any).sourceQuestionId ??
                  (q as any).id;
                const exam = q.meta?.exam ?? (q as any).exam;
                const year = q.meta?.year ?? (q as any).year;
                const correctOptId = q.correctAnswer;

                return (
                  <div key={idx} className={cn("space-y-2.5", idx > 0 && "pt-4")}>
                    {/* Header: Number, Source ID, Exam, Difficulty */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary font-bold text-xs">
                          {qNum}
                        </span>
                        {sourceId && (
                          <Badge variant="outline" className="text-[10.5px] font-mono gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            {String(sourceId)}
                          </Badge>
                        )}
                        {exam && (
                          <Badge variant="secondary" className="text-[10px] font-hindi">
                            <Award className="h-3 w-3 mr-0.5 text-warning" />
                            {String(exam)} {year ? `(${year})` : ""}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {q.type} · {q.difficulty}
                      </Badge>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm font-hindi font-medium text-foreground leading-relaxed">
                      {q.questionText}
                    </p>

                    {/* 4 Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect =
                          opt.id === correctOptId ||
                          (typeof correctOptId === "string" &&
                            correctOptId.toLowerCase() === opt.id.toLowerCase());

                        return (
                          <div
                            key={opt.id || oIdx}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-hindi transition-colors border",
                              isCorrect
                                ? "bg-success/15 border-success/40 text-success-foreground font-semibold"
                                : "bg-muted/40 border-border/60 text-foreground"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                  isCorrect
                                    ? "bg-success text-success-foreground"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {oIdx + 1}
                              </span>
                              <span>{opt.text}</span>
                            </span>
                            {isCorrect && (
                              <Badge className="bg-success text-success-foreground text-[10px] px-1.5 py-0.2 rounded-md font-hindi ml-2 shrink-0">
                                सही उत्तर ✓
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="mt-2 p-2.5 rounded-xl bg-muted/50 border border-border/50 text-xs font-hindi text-muted-foreground leading-relaxed">
                        <span className="font-bold text-foreground">व्याख्या: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      )}

      {/* 4. Import Quality Gate & Checklist */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold tracking-tight">
              4. Import Quality Gate / पूर्व-सत्यापन
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-medium">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {isCountValid ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>
                {isFinalSet
                  ? `अंतिम सेट स्वीकार्य (मिले: ${detectedCount} प्रश्न)`
                  : `ठीक 20 प्रश्न आवश्यक (मिले: ${detectedCount} / 20)`}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.validStructure ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>मान्य प्रश्न एवं विकल्प संरचना (4 विकल्प)</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.uniqueOptions ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>प्रत्येक प्रश्न के विकल्प अद्वितीय</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.validAnswers ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>मान्य सही उत्तर (Correct Answer Verified)</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.explanationsPresent ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>प्रमाणिक व्याख्या अनिवार्य (Explanations)</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.noDuplicateQuestions ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>सेट के भीतर कोई दोहराव नहीं</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.noDuplicateSourceIds ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>सेट के भीतर Source ID अद्वितीय</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {hasNoDbCollisions && !isDuplicateSetName ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>Convex में कोई पुराना दोहराव नहीं</span>
            </div>
          </div>

          {/* Validation Failure Reasons */}
          {allErrors.length > 0 && code.trim().length > 0 && (
            <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm font-bold">
                Import नहीं किया जा सकता — निम्नलिखित त्रुटियाँ सुधारें:
              </AlertTitle>
              <AlertDescription className="mt-2 text-xs space-y-1">
                <ul className="list-disc pl-4 space-y-1">
                  {allErrors.slice(0, 8).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {allErrors.length > 8 && (
                    <li>...तथा {allErrors.length - 8} अन्य त्रुटियाँ।</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {canImport && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                सभी {detectedCount} प्रश्न गुणवत्ता एवं अद्वितीयता मानकों पर खरे उतरे हैं।
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Two-Step Confirmation Trigger Button */}
      <div className="space-y-2">
        <Button
          type="button"
          onClick={() => setConfirmModalOpen(true)}
          disabled={!canImport}
          className="h-12 w-full rounded-xl text-sm font-bold shadow-xs transition-all"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Convex में प्रश्न सेट प्रकाशित हो रहा है…
            </>
          ) : (
            `✓ Review & Import ${detectedCount} Questions (${subtopicName || "Current Set"})`
          )}
        </Button>
        {!canImport && code.trim().length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground">
            सभी validation checks (ठीक 20 प्रश्न, 4 विकल्प, अद्वितीय Source ID, अद्वितीय सेट नाम) पास होने पर ही Import बटन सक्रिय होगा।
          </p>
        )}
      </div>

      {/* Confirmation Modal before Convex Mutation */}
      <ConfirmDialog
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title="प्रश्न सेट प्रकाशित करें (Publish Question Set)?"
        description={`विषय: ${subjectName}\nटॉपिक: ${topicName}\nसेट: ${subtopicName.trim()}\nकुल प्रश्न: ${detectedCount}\n\nयह क्रिया Convex डेटाबेस में 1 नया टेस्ट सेट और ${detectedCount} प्रश्न स्थायी रूप से जोड़ेगी। क्या आप आगे बढ़ना चाहते हैं?`}
        confirmLabel="पुष्टि करें एवं Convex में आयात करें"
        variant="default"
        isLoading={isImporting}
        loadingLabel="Convex में सेव हो रहा है…"
        onConfirm={async () => {
          setConfirmModalOpen(false);
          onImportClick?.({
            isFinalSet,
            masterTopicId: activeMasterTopicId,
          });
        }}
      />
    </div>
  );
}
