"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { autoFixJson, extractYouTubeReferencesFromLlmOutput } from "@/lib/importParser";
import { importJsonSchema, ImportJson, validateGeminiComposition } from "@/lib/validators/question";
import { generateAiQuestionPrompt } from "@/lib/prompts/aiQuestionPrompt";
import { PyqRetrievalResult, formatPyqsForPrompt } from "@/lib/pyqTypes";
import { PromptPreviewDialog } from "./PromptPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/Toast";
import {
  AlertCircle,
  CheckCircle2,
  AlignLeft,
  Copy,
  Sparkles,
  Eye,
  Check,
  FileCode2,
  Loader2,
  BookOpen,
  RotateCw,
  RefreshCw,
  FileText,
  Database,
} from "lucide-react";
import { SyllabusSelect } from "@/components/shared/SyllabusSelect";
import { getSubjectDisplayName, getTopicDisplayName, cn } from "@/lib/utils";

interface SubjectOption {
  _id: string;
  name: string;
  nameHindi?: string;
}

interface TopicOption {
  _id: string;
  name: string;
  nameHindi?: string;
}

interface QuestionImportEditorProps {
  initialValue?: string;
  onChange: (value: string, parsed: ImportJson | null, errors: string[]) => void;
  subjectsList?: SubjectOption[];
  topicsList?: TopicOption[];
  selectedSubjectId?: string;
  selectedTopicId?: string;
  onSubjectChangeId?: (id: string) => void;
  onTopicChangeId?: (id: string) => void;
  subtopicName: string;
  onSubtopicNameChange: (val: string) => void;
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  negativeMarking: boolean;
  onNegativeMarkingChange: (enabled: boolean) => void;
  isImporting?: boolean;
  onImportClick?: () => void;
}

export function QuestionImportEditor({
  initialValue = "",
  onChange,
  subjectsList = [],
  topicsList = [],
  selectedSubjectId = "",
  selectedTopicId = "",
  onSubjectChangeId,
  onTopicChangeId,
  subtopicName,
  onSubtopicNameChange,
  questionCount: _questionCount,
  onQuestionCountChange: _onQuestionCountChange,
  negativeMarking,
  onNegativeMarkingChange,
  isImporting = false,
  onImportClick,
}: QuestionImportEditorProps) {
  const [code, setCode] = useState(initialValue);
  const [syntaxError, setSyntaxError] = useState<{ line: number | null; message: string } | null>(null);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<ImportJson | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [pyqCopied, setPyqCopied] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [isResettingTracker, setIsResettingTracker] = useState(false);

  // ── Permanent Convex-backed Used PYQ Tracking ──
  const convexUsedIds = useQuery(
    api.usedPyqs.getUsedSourceQuestionIds,
    selectedTopicId ? { topicId: selectedTopicId as Id<"topics"> } : "skip"
  );
  const clearTopicUsage = useMutation(api.usedPyqs.clearTopicUsage);

  const usedIdsList = useMemo(() => {
    return Array.isArray(convexUsedIds) ? convexUsedIds : [];
  }, [convexUsedIds]);

  // ── Selected YouTube videos tracking (per topic in localStorage: exactly 5 references selected once) ──
  const [selectedYouTubeVideos, setSelectedYouTubeVideos] = useState<string[]>([]);

  const loadYouTubeVideos = useCallback(() => {
    if (!selectedTopicId) {
      setSelectedYouTubeVideos([]);
      return;
    }
    try {
      const stored = localStorage.getItem(`quizzer2_youtube_refs_${selectedTopicId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedYouTubeVideos(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setSelectedYouTubeVideos([]);
  }, [selectedTopicId]);

  useEffect(() => {
    loadYouTubeVideos();
    window.addEventListener("storage", loadYouTubeVideos);
    return () => {
      window.removeEventListener("storage", loadYouTubeVideos);
    };
  }, [loadYouTubeVideos]);

  const saveYouTubeVideos = useCallback((videos: string[]) => {
    setSelectedYouTubeVideos(videos);
    if (selectedTopicId) {
      try {
        localStorage.setItem(`quizzer2_youtube_refs_${selectedTopicId}`, JSON.stringify(videos));
      } catch {
        // ignore
      }
    }
  }, [selectedTopicId]);

  // Auto-collect YouTube video references as soon as raw response is pasted for a topic without saved videos
  useEffect(() => {
    if (!code.trim() || !selectedTopicId || selectedYouTubeVideos.length > 0) return;
    const extracted = extractYouTubeReferencesFromLlmOutput(code);
    if (extracted && extracted.length > 0) {
      saveYouTubeVideos(extracted);
    }
  }, [code, selectedTopicId, selectedYouTubeVideos.length, saveYouTubeVideos]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Keep internal code synced when initialValue is cleared from outside
  useEffect(() => {
    setCode(initialValue);
  }, [initialValue]);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Derived: line numbers
  const lines = code.split("\n").length;
  const lineCount = Math.max(lines, 16);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Sync line-number scroll with textarea scroll
  const syncScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Validate JSON on every code change
  useEffect(() => {
    if (!code.trim()) {
      setSyntaxError(null);
      setSchemaErrors([]);
      setParsedData(null);
      onChangeRef.current(code, null, []);
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
        onChangeRef.current(code, null, errs);
      } else {
        setSchemaErrors([]);
        setParsedData(result.data);
        onChangeRef.current(code, result.data, []);
      }
    } catch (err: any) {
      let line: number | null = null;
      const match =
        err.message?.match(/at line (\d+) column (\d+)/i) ||
        err.message?.match(/line (\d+)/i);
      if (match && match[1]) line = parseInt(match[1], 10);

      const errMsg = err.message || "Invalid JSON syntax.";
      setSyntaxError({ line, message: errMsg });
      setSchemaErrors([]);
      setParsedData(null);
      onChangeRef.current(code, null, [errMsg]);
    }
  }, [code]);

  // Selected subject & topic objects for prompt generation
  const activeSubject = subjectsList.find((s) => s._id === selectedSubjectId);
  const activeTopic = topicsList.find((t) => t._id === selectedTopicId);

  // ── PYQ Retrieval (Fetch ALL Unused from Master 26k Corpus via /api/admin/pyq) ─────────
  const [pyqResult, setPyqResult] = useState<PyqRetrievalResult | null>(null);
  const [isLoadingPyq, setIsLoadingPyq] = useState(false);

  const fetchPyqBatch = useCallback(
    async () => {
      const topicName = getTopicDisplayName(activeTopic);
      if (!topicName) {
        setPyqResult(null);
        return;
      }
      const subjectName = getSubjectDisplayName(activeSubject);

      setIsLoadingPyq(true);

      try {
        const res = await fetch("/api/admin/pyq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: subjectName || undefined,
            topic: topicName,
            subtopic: subtopicName.trim() || undefined,
            allUnused: true,
            usedQuestionIds: usedIdsList,
          }),
        });

        if (res.ok) {
          const data: PyqRetrievalResult = await res.json();
          setPyqResult(data);
        }
      } catch (err) {
        console.error("Failed to fetch PYQ batch:", err);
      } finally {
        setIsLoadingPyq(false);
      }
    },
    [activeTopic, activeSubject, subtopicName, usedIdsList]
  );

  useEffect(() => {
    fetchPyqBatch();
  }, [fetchPyqBatch]);

  // Reset permanent Convex used PYQ list for this topic
  async function handleResetUsed() {
    if (!selectedTopicId) return;
    try {
      setIsResettingTracker(true);
      const res = await clearTopicUsage({ topicId: selectedTopicId as Id<"topics"> });
      saveYouTubeVideos([]);
      showToast(`🔄 इस टॉपिक का प्रयुक्त PYQs ट्रैकर रीसेट किया गया (${res.cleared} रिकॉर्ड हटाए गए)`, "info");
      await fetchPyqBatch();
    } catch (err: any) {
      showToast(err.message || "रीसेट करने में त्रुटि हुई", "warning");
    } finally {
      setIsResettingTracker(false);
    }
  }

  // 1. Prompt Instructions Only (zero questions interpolated)
  const currentPromptOnly = useMemo(() => {
    return generateAiQuestionPrompt({
      subject: getSubjectDisplayName(activeSubject) || "Rajasthan General Knowledge",
      topic: getTopicDisplayName(activeTopic) || "General Topic",
      subtopic: subtopicName.trim() || undefined,
      count: 20, // Generation set size is ALWAYS exactly 20
      promptOnly: true,
      pyqReferences: pyqResult?.questions,
      pyqStats: pyqResult
        ? {
            totalFound: pyqResult.totalFound,
            sent: pyqResult.questions.length,
            usedCount: usedIdsList.length,
            remainingCount: pyqResult.unusedPoolCount ?? pyqResult.questions.length,
          }
        : undefined,
      usedQuestionIds: usedIdsList,
      selectedYouTubeVideos,
    });
  }, [activeSubject, activeTopic, subtopicName, pyqResult, usedIdsList, selectedYouTubeVideos]);

  // 2. All Available Unused PYQs (Formatted plain text block)
  const currentPyqData = useMemo(() => {
    if (!pyqResult?.questions || pyqResult.questions.length === 0) return "";
    return `============================================================
ALL AVAILABLE UNUSED PYQ QUESTIONS FOR: ${getTopicDisplayName(activeTopic) || "TOPIC"}
Subject: ${getSubjectDisplayName(activeSubject) || "Rajasthan GK"}
Total Available Unused PYQs: ${pyqResult.questions.length}
============================================================

${formatPyqsForPrompt(pyqResult.questions)}

============================================================
END AVAILABLE UNUSED PYQ DATA POOL
============================================================`;
  }, [pyqResult, activeTopic, activeSubject]);

  // Set of valid sourceQuestionIds from currently available unused PYQ pool
  const validSourceQuestionIds = useMemo(() => {
    if (!pyqResult?.questions || pyqResult.questions.length === 0) return undefined;
    return new Set(pyqResult.questions.map((q) => q.id));
  }, [pyqResult]);

  // Question Composition validation for 20-question rule (14 PYQ + 4 Modified + 2 AI)
  const composition = useMemo(() => {
    if (!parsedData || !parsedData.questions) return null;
    return validateGeminiComposition(parsedData.questions, validSourceQuestionIds);
  }, [parsedData, validSourceQuestionIds]);

  function handleCopyPrompt() {
    navigator.clipboard.writeText(currentPromptOnly);
    setPromptCopied(true);
    showToast("📋 Gemini Prompt (Instructions Only) copied to clipboard!", "success");
    setTimeout(() => setPromptCopied(false), 2500);
  }

  function handleCopyPyqs() {
    if (!pyqResult?.questions || pyqResult.questions.length === 0) {
      showToast("इस टॉपिक के लिए कोई अप्रयुक्त (unused) PYQ उपलब्ध नहीं है।", "warning");
      return;
    }
    navigator.clipboard.writeText(currentPyqData);
    setPyqCopied(true);
    showToast(`📚 ${pyqResult.questions.length} Available Unused PYQs copied to clipboard!`, "success");
    setTimeout(() => setPyqCopied(false), 2500);
  }

  function handleFormat() {
    if (!code.trim()) return;
    const { fixedText, success } = autoFixJson(code);
    if (success) {
      setCode(fixedText);
      showToast("✨ JSON formatted and validated cleanly!", "success");
    } else {
      try {
        const parsed = JSON.parse(code);
        setCode(JSON.stringify(parsed, null, 2));
        showToast("✨ JSON formatted successfully!", "success");
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Cannot format invalid JSON.", "warning");
      }
    }
  }

  const isValid =
    parsedData !== null &&
    !syntaxError &&
    schemaErrors.length === 0 &&
    composition !== null &&
    composition.isValid === true;

  const totalPyqs = pyqResult?.totalFound ?? 0;
  const usedPyqs = usedIdsList.length;
  const availablePyqs = pyqResult?.unusedPoolCount ?? Math.max(0, totalPyqs - usedPyqs);

  return (
    <div className="space-y-4">
      {/* ── 1. Target Syllabus & AI Prompt Form ── */}
      <Card className="rounded-2xl border border-border shadow-xs overflow-hidden bg-card">
        <div className="px-5 py-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm tracking-tight text-foreground font-hindi">
              लक्षित पाठ्यक्रम एवं AI प्रॉम्प्ट
            </span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground font-hindi">
            चरण 1: प्रॉम्प्ट एवं PYQ कॉपी करें
          </span>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi">
                Subject (विषय)
              </Label>
              <SyllabusSelect
                options={subjectsList}
                value={selectedSubjectId}
                onValueChange={(v) => onSubjectChangeId?.(v)}
                placeholder="विषय चुनें…"
              />
            </div>

            {/* Canonical Topic */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi">
                Topic (प्रामाणिक टॉपिक)
              </Label>
              <SyllabusSelect
                options={topicsList}
                value={selectedTopicId}
                onValueChange={(v) => onTopicChangeId?.(v)}
                placeholder={topicsList.length === 0 ? "पहले विषय चुनें" : "टॉपिक चुनें…"}
                disabled={topicsList.length === 0}
              />
            </div>

            {/* Subtopic / Test Set Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi">
                उप-टॉपिक / भाग
              </Label>
              <Input
                value={subtopicName}
                onChange={(e) => onSubtopicNameChange(e.target.value)}
                placeholder="उदा. Part 1, प्रजामंडल..."
                className="h-10 text-xs font-semibold px-3 font-hindi"
              />
            </div>
          </div>

          {/* Sizing & Pool Specification (Fixed 20 Generation / Convex-Tracked Pool) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-border/60">
            {/* Generation Set Size (Strictly Fixed at 20) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi">
                  Generation Set Size
                </Label>
                <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/40 bg-primary/5 font-hindi">
                  Fixed: 20
                </Badge>
              </div>
              <div
                className="h-10 flex items-center justify-between px-3 rounded-md border border-input bg-muted/40 text-xs font-bold text-foreground cursor-not-allowed"
                title="Gemini जनरेशन इकाई ठीक 20 प्रश्न निर्धारित है (14 PYQ + 4 Modified + 2 AI)"
              >
                <span>20 प्रश्न (Fixed)</span>
                <span className="text-[11px] font-normal text-muted-foreground font-hindi">
                  14 PYQ · 4 Modified · 2 AI
                </span>
              </div>
            </div>

            {/* PYQ Pool Mode (Convex Tracking: All Available Unused) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi">
                  PYQ Retrieval Pool
                </Label>
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 font-hindi">
                  Convex-Tracked
                </Badge>
              </div>
              <div
                className="h-10 flex items-center justify-between px-3 rounded-md border border-input bg-muted/40 text-xs font-bold text-foreground"
                title="सभी अप्रयुक्त PYQ उपलब्ध रहते हैं (कोई 200/300/500 की कृत्रिम सीमा नहीं)"
              >
                <span className="truncate">सम्पूर्ण अप्रयुक्त पूल (All Unused)</span>
                <span className="text-[11px] font-normal text-muted-foreground font-hindi shrink-0">
                  बिना सीमा
                </span>
              </div>
            </div>
          </div>

          {/* PYQ Retrieval Status & Usage Stats (Total: X | Used: Y | Available: Z) */}
          {selectedTopicId && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-bold text-xs text-foreground font-hindi">
                    Convex PYQ उपयोग ट्रैकिंग (Usage & Pool Status)
                  </span>
                </div>
                {usedPyqs > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetUsed}
                    disabled={isResettingTracker}
                    className="h-7 px-2 text-[11px] font-hindi text-muted-foreground hover:text-foreground self-start sm:self-auto"
                    title="Convex में इस टॉपिक के प्रयुक्त PYQs को रीसेट करें"
                  >
                    {isResettingTracker ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    रीसेट प्रयुक्त ट्रैकर ({usedPyqs})
                  </Button>
                )}
              </div>

              {/* Stats Cards: Total, Used, Available */}
              <div className="grid grid-cols-3 gap-2.5 text-xs font-hindi">
                <div className="p-2.5 rounded-lg bg-card border border-border/80 text-center">
                  <div className="text-[11px] text-muted-foreground font-medium">Total PYQ (कुल)</div>
                  <div className="font-bold text-foreground text-base tabular-nums mt-0.5">
                    {totalPyqs}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border/80 text-center">
                  <div className="text-[11px] text-muted-foreground font-medium">Used (प्रयुक्त)</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400 text-base tabular-nums mt-0.5">
                    {usedPyqs}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border/80 text-center">
                  <div className="text-[11px] text-muted-foreground font-medium">Available (उपलब्ध)</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base tabular-nums mt-0.5">
                    {availablePyqs}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-hindi pt-1 border-t border-border/60">
                <span className="text-muted-foreground">
                  कॉपी हेतु तैयार PYQ पूल:
                </span>
                <span className="font-bold text-foreground tabular-nums">
                  {isLoadingPyq ? "लोड हो रहा है..." : `${pyqResult?.questions?.length ?? 0} अप्रयुक्त PYQs`}
                </span>
              </div>
            </div>
          )}

          {/* Negative Marking & Dual Copy Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-3.5 border-t border-border/80">
            <div className="flex items-center gap-2.5">
              <Switch
                id="neg-marking"
                checked={negativeMarking}
                onCheckedChange={onNegativeMarkingChange}
              />
              <Label htmlFor="neg-marking" className="text-xs font-medium cursor-pointer text-muted-foreground font-hindi">
                ऋणात्मक अंकन (Negative Marking) <span className="text-[11px] font-normal text-muted-foreground/70">(-0.33 प्रति गलत)</span>
              </Label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fetchPyqBatch()}
                disabled={isLoadingPyq || !selectedTopicId}
                className="w-full sm:w-auto h-9 gap-1.5 text-xs font-semibold rounded-xl font-hindi shadow-2xs"
                title="पूल पुनः सिंक करें"
              >
                {isLoadingPyq ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCw className="h-3.5 w-3.5" />
                )}
                सिंक पूल
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPromptModal(true)}
                className="w-full sm:w-auto h-9 gap-1.5 text-xs font-semibold rounded-xl active:scale-[0.98] transition-transform font-hindi"
              >
                <Eye className="h-3.5 w-3.5" />
                प्रॉम्प्ट देखें
              </Button>

              {/* 1. Copy Prompt Button (Instructions Only) */}
              <Button
                type="button"
                size="sm"
                onClick={handleCopyPrompt}
                className="w-full sm:w-auto h-9 gap-1.5 text-xs font-bold px-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-[0.98] transition-transform font-hindi"
                title="केवल प्रॉम्प्ट निर्देश कॉपी करें (14/4/2 संरचना, बिना PYQ डेटा)"
              >
                {promptCopied ? <Check className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                {promptCopied ? "प्रॉम्प्ट कॉपी!" : "Copy Prompt"}
              </Button>

              {/* 2. Copy PYQ Button (All Available Unused PYQs) */}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleCopyPyqs}
                disabled={availablePyqs === 0 || isLoadingPyq || !selectedTopicId}
                className="w-full sm:w-auto h-9 gap-1.5 text-xs font-bold px-3.5 rounded-xl border border-border shadow-xs active:scale-[0.98] transition-transform font-hindi"
                title="सभी उपलब्ध अप्रयुक्त PYQs कॉपी करें"
              >
                {pyqCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {pyqCopied ? "PYQ कॉपी!" : `Copy PYQ (${availablePyqs})`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Direct JSON Paste Code Editor ── */}
      <div className="flex flex-col rounded-2xl border border-border overflow-hidden shadow-xs bg-card">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between gap-2.5 bg-muted/60 px-3.5 sm:px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileCode2 className="h-4 w-4 text-muted-foreground shrink-0" />
            {syntaxError || schemaErrors.length > 0 ? (
              <Badge variant="destructive" className="gap-1 text-[11px] px-2.5 py-0.5 rounded-md font-semibold shrink-0">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {syntaxError ? "JSON Syntax Error" : `${schemaErrors.length} Issue(s)`}
              </Badge>
            ) : parsedData ? (
              <div className="flex items-center gap-2 flex-wrap">
                {composition && composition.isValid ? (
                  <Badge className="gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold shrink-0 font-hindi">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    तैयार · ठीक 20 प्रश्न (14 PYQ · 4 Modified · 2 AI)
                  </Badge>
                ) : composition ? (
                  <Badge variant="destructive" className="gap-1 text-[11px] px-2 py-0.5 font-semibold shrink-0 font-hindi">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    ब्लॉक · {composition.total} प्रश्न ({composition.pyqCount} PYQ, {composition.pyqModifiedCount} Mod, {composition.aiNewCount} AI)
                  </Badge>
                ) : (
                  <Badge className="gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold shrink-0 font-hindi">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    तैयार · {parsedData.questions.length} प्रश्न
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs truncate font-hindi">
                Gemini से प्राप्त JSON (या सम्पूर्ण रिस्पॉन्स) यहाँ पेस्ट करें
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFormat}
              className="h-8 gap-1.5 text-xs font-semibold rounded-lg shrink-0 active:scale-95 transition-transform"
              title="Beautify & Auto-Fix JSON"
            >
              <AlignLeft className="h-3.5 w-3.5" />
              Format JSON
            </Button>
          </div>
        </div>

        {/* Textarea Code Workspace */}
        <div className="relative flex h-[380px] bg-card font-mono text-xs overflow-hidden">
          {/* Line Numbers */}
          <div
            ref={lineNumbersRef}
            aria-hidden="true"
            className="w-11 shrink-0 select-none bg-muted/30 border-r border-border/60 py-3.5 text-right font-mono text-[11px] text-muted-foreground/60 overflow-hidden leading-[1.625rem]"
          >
            {lineNumbers.map((num) => (
              <div
                key={num}
                className={`pr-2.5 ${syntaxError?.line === num ? "bg-destructive/20 text-destructive font-bold" : ""}`}
              >
                {num}
              </div>
            ))}
          </div>

          {/* Code Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onScroll={syncScroll}
            placeholder={`[\n  {\n    "q": "प्रश्न यहाँ लिखें...",\n    "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"],\n    "a": 0,\n    "e": "विस्तृत व्याख्या...",\n    "t": "mcq"\n  }\n]`}
            spellCheck={false}
            className="flex-1 resize-none bg-transparent p-3.5 font-mono text-xs sm:text-[13px] leading-[1.625rem] text-foreground focus:outline-none placeholder:text-muted-foreground/40 overflow-y-auto"
          />
        </div>

        {/* ── 3. Bottom Action Bar: Target Info + Direct "Import" Button ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 px-4 sm:px-5 py-3 border-t border-border">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0 font-hindi">
            <span className="font-bold text-foreground shrink-0">लक्ष्य:</span>
            <span className="truncate">
              {getSubjectDisplayName(activeSubject) || "विषय"} &rarr; {getTopicDisplayName(activeTopic) || "टॉपिक"} &rarr; <span className="font-bold text-foreground">{subtopicName || "Part 1"}</span>
            </span>
          </div>

          <Button
            type="button"
            onClick={onImportClick}
            disabled={!isValid || !selectedTopicId || !subtopicName.trim() || isImporting}
            className={cn(
              "w-full sm:w-auto h-10 px-6 font-bold text-sm rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-95 transition-all shrink-0 font-hindi relative overflow-hidden",
              isImporting ? "cursor-wait opacity-90" : "cursor-pointer"
            )}
          >
            {isImporting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-primary-foreground" />
                <span className="inline-flex items-center">
                  <span>प्रश्न आयात हो रहे हैं</span>
                  <span className="inline-flex tracking-widest animate-pulse ml-0.5">…</span>
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 stroke-[3]" />
                <span>प्रश्न आयात करें (Import)</span>
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Schema / Syntax Errors Display */}
      {syntaxError && (
        <Alert variant="destructive" className="rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold font-hindi">JSON में सिंटैक्स त्रुटि (Syntax Error)</AlertTitle>
          <AlertDescription className="text-xs mt-0.5">
            {syntaxError.line ? `पंक्ति ${syntaxError.line}: ` : ""}
            {syntaxError.message}
          </AlertDescription>
        </Alert>
      )}

      {schemaErrors.length > 0 && (
        <Alert variant="destructive" className="rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold font-hindi">
            JSON में {schemaErrors.length} त्रुटि(याँ) मिलीं (Schema Validation)
          </AlertTitle>
          <AlertDescription className="text-xs mt-1">
            <ul className="list-disc pl-4 space-y-0.5 font-mono text-xs">
              {schemaErrors.slice(0, 5).map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
              {schemaErrors.length > 5 && (
                <li className="italic text-muted-foreground font-hindi">...और {schemaErrors.length - 5} अन्य त्रुटियाँ</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Composition & Provenance Error Display (Blocking: import disabled unless 14 PYQ + 4 Modified + 2 AI with valid batch IDs) */}
      {composition && !composition.isValid && schemaErrors.length === 0 && !syntaxError && (
        <Alert variant="destructive" className="rounded-xl border border-destructive/40 bg-destructive/10 text-destructive dark:text-destructive-foreground">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold font-hindi flex items-center justify-between">
            <span>अमान्य प्रश्न संरचना (Invalid Question Composition — Import Blocked)</span>
            <span className="text-[11px] font-mono font-normal">
              कुल: {composition.total}/20 (PYQ: {composition.pyqCount}/14, Mod: {composition.pyqModifiedCount}/4, AI: {composition.aiNewCount}/2)
            </span>
          </AlertTitle>
          <AlertDescription className="text-xs mt-1">
            <div className="font-semibold text-xs mb-1 font-mono">
              {composition.errorMessage || `Invalid question composition. Expected: 14 PYQ + 4 PYQ_MODIFIED + 2 AI_NEW. Received: ${composition.pyqCount} PYQ + ${composition.pyqModifiedCount} PYQ_MODIFIED + ${composition.aiNewCount} AI_NEW.`}
            </div>
            {composition.errors.length > 1 && (
              <ul className="list-disc pl-4 space-y-0.5 text-xs font-mono">
                {composition.errors.slice(1, 6).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
                {composition.errors.length > 6 && (
                  <li className="italic">...and {composition.errors.length - 6} more issue(s)</li>
                )}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* AI Prompt Preview Modal */}
      <PromptPreviewDialog
        open={showPromptModal}
        onOpenChange={setShowPromptModal}
        promptText={currentPromptOnly}
        onCopySuccess={handleCopyPrompt}
      />
    </div>
  );
}
