"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { isUserAdmin } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import {
  Flag,
  AlertTriangle,
  Copy,
  GitCompare,
  Wrench,
  Check,
  Trash2,
  Edit3,
  Loader2,
} from "lucide-react";

export type AdminFlagType = "wrong_answer" | "duplicate" | "similar" | "formatting";

export interface AdminQuestionFlagMenuProps {
  questionId?: string;
  testSetId?: string;
  questionNumber?: number;
  questionText?: string;
  question?: any;
}

interface StoredFlagData {
  questionId: string;
  testSetId?: string;
  questionNumber?: number;
  flagType: AdminFlagType;
  note?: string;
  questionText?: string;
  answer?: string;
  flaggedAt: number;
}

const STORAGE_KEY = "quizzer_admin_flags";

const FLAG_CONFIG: Record<
  AdminFlagType,
  {
    label: string;
    fullLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    buttonClass: string;
    menuClass: string;
  }
> = {
  wrong_answer: {
    label: "गलत उत्तर",
    fullLabel: "गलत उत्तर / Wrong Answer",
    icon: AlertTriangle,
    buttonClass: "border-destructive/50 bg-destructive/15 text-destructive hover:bg-destructive/25",
    menuClass: "text-destructive focus:bg-destructive/15 focus:text-destructive",
  },
  duplicate: {
    label: "डुप्लीकेट",
    fullLabel: "डुप्लीकेट प्रश्न / Duplicate Question",
    icon: Copy,
    buttonClass: "border-amber-500/50 bg-amber-500/15 text-amber-500 hover:bg-amber-500/25",
    menuClass: "text-amber-500 focus:bg-amber-500/15 focus:text-amber-500",
  },
  similar: {
    label: "समान प्रश्न",
    fullLabel: "समान प्रश्न / Similar Question",
    icon: GitCompare,
    buttonClass: "border-sky-500/50 bg-sky-500/15 text-sky-400 hover:bg-sky-500/25",
    menuClass: "text-sky-400 focus:bg-sky-500/15 focus:text-sky-400",
  },
  formatting: {
    label: "फॉर्मेटिंग",
    fullLabel: "फॉर्मेटिंग त्रुटि / Glitch",
    icon: Wrench,
    buttonClass: "border-purple-500/50 bg-purple-500/15 text-purple-400 hover:bg-purple-500/25",
    menuClass: "text-purple-400 focus:bg-purple-500/15 focus:text-purple-400",
  },
};

function readLocalFlags(): Record<string, StoredFlagData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalFlags(flags: Record<string, StoredFlagData>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {}
}

export function AdminQuestionFlagMenu({
  questionId,
  testSetId,
  questionNumber,
  questionText,
  question,
}: AdminQuestionFlagMenuProps) {
  const me = useQuery(api.users.me);
  const isAdmin = isUserAdmin(me);
  const { showToast } = useToast();

  const safeQuestionId = useMemo(() => {
    return (
      questionId ||
      question?.canonicalId ||
      question?.id ||
      question?.sourceQuestionId ||
      question?._id ||
      (testSetId && questionNumber ? `${testSetId}_q${questionNumber}` : "")
    );
  }, [questionId, question, testSetId, questionNumber]);

  // Convex live queries & mutations
  const convexFlag = useQuery(
    api.flaggedQuestions.getForQuestion,
    isAdmin && safeQuestionId ? { questionId: safeQuestionId } : "skip"
  );
  const flagMutation = useMutation(api.flaggedQuestions.flag);
  const removeFlagMutation = useMutation(api.flaggedQuestions.remove);

  const [activeFlag, setActiveFlag] = useState<StoredFlagData | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync flag state: live Convex source of truth with local cache fallback
  useEffect(() => {
    if (!isAdmin || !safeQuestionId) return;

    if (convexFlag !== undefined) {
      if (convexFlag) {
        const flagData: StoredFlagData = {
          questionId: convexFlag.questionId,
          testSetId: convexFlag.testSetId,
          questionNumber: convexFlag.questionNumber,
          flagType: convexFlag.flagType as AdminFlagType,
          note: convexFlag.note,
          flaggedAt: convexFlag.flaggedAt,
        };
        setActiveFlag(flagData);
        setNoteInput(convexFlag.note || "");
        const currentMap = readLocalFlags();
        currentMap[safeQuestionId] = flagData;
        writeLocalFlags(currentMap);
      } else {
        setActiveFlag(null);
        setNoteInput("");
        const currentMap = readLocalFlags();
        delete currentMap[safeQuestionId];
        writeLocalFlags(currentMap);
      }
    } else {
      // Convex still loading, read from local cache optimistically
      const allFlags = readLocalFlags();
      if (allFlags[safeQuestionId]) {
        setActiveFlag(allFlags[safeQuestionId]);
        setNoteInput(allFlags[safeQuestionId].note || "");
      }
    }
  }, [isAdmin, safeQuestionId, convexFlag]);

  // Handle setting a flag
  const handleSelectFlag = useCallback(
    async (flagType: AdminFlagType) => {
      if (!safeQuestionId) return;
      setIsSaving(true);

      const flagData: StoredFlagData = {
        questionId: safeQuestionId,
        testSetId,
        questionNumber,
        flagType,
        note: noteInput.trim() || activeFlag?.note || undefined,
        questionText: questionText || question?.questionText || question?.question,
        answer: question?.correctOption || question?.answer || question?.correctAnswer,
        flaggedAt: Date.now(),
      };

      // 1. Optimistic local update
      setActiveFlag(flagData);
      const currentMap = readLocalFlags();
      currentMap[safeQuestionId] = flagData;
      writeLocalFlags(currentMap);

      showToast(`🚩 Flagged: ${FLAG_CONFIG[flagType].label}`, "warning");

      // 2. Persist to Convex database (Production Realtime)
      try {
        await flagMutation({
          questionId: safeQuestionId,
          testSetId,
          questionNumber,
          flagType,
          note: flagData.note,
        });
      } catch (err) {
        console.error("Failed to sync flag to Convex:", err);
      }

      // 3. Persist to local JSON API as additional backup
      try {
        await fetch("/api/admin/flagged-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...flagData,
            options: question?.options,
            flaggedBy: me?.email || "admin",
          }),
        });
      } catch (e) {
        // Ignored on production if filesystem is read-only
      } finally {
        setIsSaving(false);
      }
    },
    [safeQuestionId, testSetId, questionNumber, noteInput, activeFlag, questionText, question, flagMutation, me?.email, showToast]
  );

  // Handle removing a flag
  const handleRemoveFlag = useCallback(async () => {
    if (!safeQuestionId) return;
    setIsSaving(true);

    // 1. Optimistic local update
    setActiveFlag(null);
    setNoteInput("");
    const currentMap = readLocalFlags();
    delete currentMap[safeQuestionId];
    writeLocalFlags(currentMap);

    showToast("फ्लैग हटाया गया / Flag removed", "info");

    // 2. Remove from Convex database
    try {
      await removeFlagMutation({ questionId: safeQuestionId });
    } catch (err) {
      console.error("Failed to remove flag from Convex:", err);
    }

    // 3. Remove from local JSON API
    try {
      await fetch(`/api/admin/flagged-questions?questionId=${encodeURIComponent(safeQuestionId)}`, {
        method: "DELETE",
      });
    } catch (e) {
      // Ignored
    } finally {
      setIsSaving(false);
    }
  }, [safeQuestionId, removeFlagMutation, showToast]);

  // Handle saving note
  const handleSaveNote = useCallback(async () => {
    if (!safeQuestionId || !activeFlag) {
      setIsNoteDialogOpen(false);
      return;
    }
    const updatedFlag: StoredFlagData = {
      ...activeFlag,
      note: noteInput.trim() || undefined,
      flaggedAt: Date.now(),
    };

    setActiveFlag(updatedFlag);
    const currentMap = readLocalFlags();
    currentMap[safeQuestionId] = updatedFlag;
    writeLocalFlags(currentMap);

    setIsNoteDialogOpen(false);
    showToast("नोट सुरक्षित किया गया / Note saved", "success");

    // 1. Update in Convex
    try {
      await flagMutation({
        questionId: safeQuestionId,
        testSetId,
        questionNumber,
        flagType: activeFlag.flagType,
        note: updatedFlag.note,
      });
    } catch (err) {
      console.error("Failed to update flag note in Convex:", err);
    }

    // 2. Update in JSON API
    try {
      await fetch("/api/admin/flagged-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedFlag,
          options: question?.options,
          flaggedBy: me?.email || "admin",
        }),
      });
    } catch (e) {
      // Ignored
    }
  }, [safeQuestionId, activeFlag, noteInput, flagMutation, testSetId, questionNumber, question, me?.email, showToast]);

  // Only admins can see and use this tool
  if (!isAdmin || !safeQuestionId) {
    return null;
  }

  const activeConfig = activeFlag ? FLAG_CONFIG[activeFlag.flagType] : null;
  const ActiveIcon = activeConfig?.icon || Flag;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Admin Flag Question"
            className={cn(
              "h-7 sm:h-8 shrink-0 items-center gap-1.5 rounded-lg text-[11px] sm:text-xs font-medium cursor-pointer transition-all",
              activeConfig
                ? cn(activeConfig.buttonClass, "font-semibold shadow-xs")
                : "border-border text-muted-foreground hover:border-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10"
            )}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ActiveIcon className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {activeConfig ? activeConfig.label : "Flag"}
            </span>
            {activeFlag?.note && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-current shrink-0"
                title={`Note: ${activeFlag.note}`}
              />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 p-1.5 z-50">
          <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Admin Flag (Quick Audit)
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* 1. Wrong Answer */}
          <DropdownMenuItem
            onClick={() => handleSelectFlag("wrong_answer")}
            className={cn(
              "flex items-center justify-between cursor-pointer text-xs py-2 px-2.5 rounded-md",
              FLAG_CONFIG.wrong_answer.menuClass
            )}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span>गलत उत्तर (Wrong Answer)</span>
            </div>
            {activeFlag?.flagType === "wrong_answer" && (
              <Check className="h-3.5 w-3.5 text-destructive" />
            )}
          </DropdownMenuItem>

          {/* 2. Duplicate Question */}
          <DropdownMenuItem
            onClick={() => handleSelectFlag("duplicate")}
            className={cn(
              "flex items-center justify-between cursor-pointer text-xs py-2 px-2.5 rounded-md",
              FLAG_CONFIG.duplicate.menuClass
            )}
          >
            <div className="flex items-center gap-2">
              <Copy className="h-3.5 w-3.5 text-amber-500" />
              <span>डुप्लीकेट प्रश्न (Duplicate)</span>
            </div>
            {activeFlag?.flagType === "duplicate" && (
              <Check className="h-3.5 w-3.5 text-amber-500" />
            )}
          </DropdownMenuItem>

          {/* 3. Similar Question */}
          <DropdownMenuItem
            onClick={() => handleSelectFlag("similar")}
            className={cn(
              "flex items-center justify-between cursor-pointer text-xs py-2 px-2.5 rounded-md",
              FLAG_CONFIG.similar.menuClass
            )}
          >
            <div className="flex items-center gap-2">
              <GitCompare className="h-3.5 w-3.5 text-sky-400" />
              <span>समान प्रश्न (Similar)</span>
            </div>
            {activeFlag?.flagType === "similar" && (
              <Check className="h-3.5 w-3.5 text-sky-400" />
            )}
          </DropdownMenuItem>

          {/* 4. Formatting Glitch */}
          <DropdownMenuItem
            onClick={() => handleSelectFlag("formatting")}
            className={cn(
              "flex items-center justify-between cursor-pointer text-xs py-2 px-2.5 rounded-md",
              FLAG_CONFIG.formatting.menuClass
            )}
          >
            <div className="flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 text-purple-400" />
              <span>फॉर्मेटिंग त्रुटि (UI Glitch)</span>
            </div>
            {activeFlag?.flagType === "formatting" && (
              <Check className="h-3.5 w-3.5 text-purple-400" />
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Note Option */}
          <DropdownMenuItem
            onClick={() => {
              setNoteInput(activeFlag?.note || "");
              setIsNoteDialogOpen(true);
            }}
            className="flex items-center gap-2 cursor-pointer text-xs py-2 px-2.5 text-foreground rounded-md"
          >
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{activeFlag?.note ? "नोट संपादित करें..." : "नोट जोड़ें (Add Note)..."}</span>
          </DropdownMenuItem>

          {/* Remove Flag Option */}
          {activeFlag && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleRemoveFlag}
                className="flex items-center gap-2 cursor-pointer text-xs py-2 px-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive rounded-md"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>फ्लैग हटाएं (Remove Flag)</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" />
              <span>Admin Note for Question {questionNumber ? `#${questionNumber}` : ""}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              यहाँ विवरण लिखें ताकि AI एजेंट या एडमिन तुरंत समझ सके (उदा. &quot;सही उत्तर C होना चाहिए&quot;, &quot;Set 2 Q5 जैसा समान है&quot;):
            </p>
            <Textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="e.g. सही उत्तर विकल्प (स) होना चाहिए क्योंकि..."
              rows={3}
              className="font-hindi text-sm"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNoteDialogOpen(false)}
            >
              रद्द करें (Cancel)
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveNote}
              disabled={isSaving}
            >
              सुरक्षित करें (Save Note)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

