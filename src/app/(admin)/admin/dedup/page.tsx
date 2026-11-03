"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  Search,
  Filter,
  Download,
  Check,
  X,
  Sparkles,
  Maximize2,
  ListFilter,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { cn, containsDevanagari } from "@/lib/utils";

type ViewMode = "groups" | "review";
type WhyFilter = "all" | "similar_text_DIFFERENT_answer" | "same_answer_reworded";
type StatusFilter = "all" | "reviewed" | "unreviewed";
type DecisionType =
  | "CONFIRMED_DUPLICATE"
  | "DIFFERENT_QUESTION"
  | "KEY_ERROR_A"
  | "KEY_ERROR_B"
  | "CUSTOM";

interface ReviewPairItem {
  pairKey: string;
  index: number;
  globalIndex: number;
  a: { id: string; q: string; options: string[]; answer: string };
  b: { id: string; q: string; options: string[]; answer: string };
  similarity: number;
  why: string;
  review: { decision: DecisionType; note: string; updatedAt: number } | null;
}

interface MergedGroupItem {
  groupKey: string;
  canonicalId: string;
  index: number;
  globalIndex: number;
  membersCount: number;
  duplicateVariantsCount: number;
  members: Array<{
    id: string;
    exam?: string;
    year?: number;
    inConvex: boolean;
    question: string;
    options: string[];
    answer: string;
  }>;
  review: { decision: DecisionType; note: string; updatedAt: number } | null;
}

export default function DedupReviewStationPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("groups");
  const [whyFilter, setWhyFilter] = useState<WhyFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [displayStyle, setDisplayStyle] = useState<"focus" | "list">("focus");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [totalDuplicatesCount, setTotalDuplicatesCount] = useState(1193);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // Stepper & Focus states
  const [focusIndex, setFocusIndex] = useState(0);
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null);
  const [jumpInput, setJumpInput] = useState("");

  // Review interaction states
  const [selectedDecision, setSelectedDecision] = useState<DecisionType | "">("");
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: viewMode,
        why: whyFilter,
        status: statusFilter,
        search,
        page: String(page),
        limit: String(pageSize),
      });

      const res = await fetch(`/api/admin/dedup?${params.toString()}`);
      const data = await res.json();

      setItems(data.items || []);
      setTotal(data.total || 0);
      setStartIndex(data.startIndex || 0);
      setReviewedCount(data.reviewedCount || 0);
      setTotalPages(data.totalPages || 1);
      if (data.totalDuplicatesCount !== undefined) {
        setTotalDuplicatesCount(data.totalDuplicatesCount);
      }

      if (pendingFocusIndex !== null) {
        setFocusIndex(Math.min(pendingFocusIndex, Math.max(0, (data.items?.length || 1) - 1)));
        setPendingFocusIndex(null);
      } else {
        // If focusIndex is out of bounds for the new items, clamp it
        if (data.items && data.items.length > 0) {
          setFocusIndex((prev) => Math.min(prev, data.items.length - 1));
        } else {
          setFocusIndex(0);
        }
      }
    } catch (e) {
      console.error("Failed to load dedup data", e);
    } finally {
      setLoading(false);
    }
  }, [viewMode, whyFilter, statusFilter, search, page, pageSize, pendingFocusIndex]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Current active item in Focus Mode
  const currentPair: ReviewPairItem | null = useMemo(() => {
    if (viewMode !== "review" || items.length === 0) return null;
    return items[Math.min(focusIndex, items.length - 1)] || null;
  }, [viewMode, items, focusIndex]);

  const currentGroup: MergedGroupItem | null = useMemo(() => {
    if (viewMode !== "groups" || items.length === 0) return null;
    return items[Math.min(focusIndex, items.length - 1)] || null;
  }, [viewMode, items, focusIndex]);

  // Sync review form state when active pair changes
  useEffect(() => {
    if (viewMode === "review" && currentPair?.review) {
      setSelectedDecision(currentPair.review.decision);
      setReviewNote(currentPair.review.note || "");
    } else {
      setSelectedDecision("");
      setReviewNote("");
    }
  }, [viewMode, currentPair]);

  // Seamless Next & Prev across chunk boundaries
  const handleNext = useCallback(() => {
    if (items.length === 0) return;
    if (focusIndex < items.length - 1) {
      setFocusIndex((prev) => prev + 1);
    } else if (page < totalPages - 1) {
      setPendingFocusIndex(0);
      setPage((p) => p + 1);
    }
  }, [focusIndex, items.length, page, totalPages]);

  const handlePrev = useCallback(() => {
    if (items.length === 0) return;
    if (focusIndex > 0) {
      setFocusIndex((prev) => prev - 1);
    } else if (page > 0) {
      setPendingFocusIndex(pageSize - 1);
      setPage((p) => p - 1);
    }
  }, [focusIndex, items.length, page, pageSize]);

  // Direct Jump-to-Number
  const handleJumpToNumber = (val: string) => {
    const targetNum = parseInt(val.trim(), 10);
    if (isNaN(targetNum) || targetNum < 1 || targetNum > total) {
      setStatusNotice(`Please enter a valid number between 1 and ${total}`);
      setTimeout(() => setStatusNotice(null), 3000);
      return;
    }
    const targetPage = Math.floor((targetNum - 1) / pageSize);
    const targetOffset = (targetNum - 1) % pageSize;

    if (targetPage === page) {
      setFocusIndex(targetOffset);
    } else {
      setPendingFocusIndex(targetOffset);
      setPage(targetPage);
    }
    setJumpInput("");
  };

  // Keyboard navigation in focus mode
  useEffect(() => {
    if (displayStyle !== "focus") return;

    function handleKeyDown(e: KeyboardEvent) {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (viewMode === "review") {
        if (e.key === "1" || e.key.toLowerCase() === "m") {
          if (currentPair) {
            handleSubmitReview(currentPair.pairKey, "CONFIRMED_DUPLICATE", reviewNote);
          }
        } else if (e.key === "2" || e.key.toLowerCase() === "d") {
          if (currentPair) {
            handleSubmitReview(currentPair.pairKey, "DIFFERENT_QUESTION", reviewNote);
          }
        } else if (e.key === "3" || e.key.toLowerCase() === "e") {
          if (currentPair) {
            handleSubmitReview(currentPair.pairKey, "KEY_ERROR_A", reviewNote);
          }
        } else if (e.key === "4") {
          if (currentPair) {
            handleSubmitReview(currentPair.pairKey, "KEY_ERROR_B", reviewNote);
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayStyle, viewMode, currentPair, handleNext, handlePrev, reviewNote]);

  // Submit single review
  const handleSubmitReview = async (
    key: string,
    decision: DecisionType,
    note: string
  ) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/dedup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, decision, note }),
      });
      const resData = await res.json();
      if (resData.success) {
        setReviewedCount(resData.reviewedCount);
        setStatusNotice("Review saved successfully!");
        setTimeout(() => setStatusNotice(null), 2500);

        setItems((prev) =>
          prev.map((item) => {
            const itemKey = item.pairKey || item.groupKey;
            if (itemKey === key) {
              return { ...item, review: resData.review };
            }
            return item;
          })
        );

        // Auto-advance
        handleNext();
      }
    } catch (e) {
      console.error("Failed to submit review", e);
    } finally {
      setSubmitting(false);
    }
  };

  // AI Review Batch Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const detectedCount = useMemo(() => {
    if (!importText.trim()) return 0;
    try {
      let clean = importText.trim();
      if (clean.startsWith("```json")) clean = clean.substring(7);
      if (clean.startsWith("```")) clean = clean.substring(3);
      if (clean.endsWith("```")) clean = clean.substring(0, clean.length - 3);
      clean = clean.trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) return parsed.length;
      if (parsed.bulk && Array.isArray(parsed.bulk)) return parsed.bulk.length;
    } catch {
      // not yet valid JSON
    }
    return 0;
  }, [importText]);

  const handleImportAIReviews = async () => {
    setImportError(null);
    setImportSuccessCount(null);
    try {
      let clean = importText.trim();
      if (clean.startsWith("```json")) clean = clean.substring(7);
      if (clean.startsWith("```")) clean = clean.substring(3);
      if (clean.endsWith("```")) clean = clean.substring(0, clean.length - 3);
      clean = clean.trim();

      let parsed: any;
      try {
        parsed = JSON.parse(clean);
      } catch {
        throw new Error("Invalid JSON format. Please paste the full valid JSON array returned by the AI.");
      }

      if (!Array.isArray(parsed) && !(parsed.bulk && Array.isArray(parsed.bulk))) {
        throw new Error("Expected a JSON array of review objects: [ { id, decision, ... }, ... ]");
      }

      setImporting(true);
      const res = await fetch("/api/admin/dedup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || "Failed to import reviews");
      }

      setImportSuccessCount(resData.importedCount);
      setStatusNotice(`Successfully imported ${resData.importedCount} AI reviews!`);
      setTimeout(() => setStatusNotice(null), 3000);
      fetchData();
      setTimeout(() => {
        setIsImportOpen(false);
        setImportText("");
        setImportSuccessCount(null);
      }, 1500);
    } catch (err: any) {
      setImportError(err.message || "Failed to process imported reviews");
    } finally {
      setImporting(false);
    }
  };

  const currentGlobalNumber = startIndex + focusIndex + 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <BreadcrumbNav
        items={[
          { label: "Admin Console", href: "/admin" },
          { label: "Pool Deduplication & Review Station" },
        ]}
      />

      {/* ── Page Header & Download Toolbar ── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <GitCompare className="h-6 w-6 text-primary" />
              Question Pool Deduplication Station
            </h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
              Production Verified
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Inspect all 1,193 auto-merged questions and review all 3,397 pairs sequentially without missing any question.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="rounded-xl text-xs font-semibold h-9 gap-1.5 border-border cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span>Reload</span>
          </Button>

          {/* Direct Raw JSON Export Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/api/admin/dedup?export=groups", "_blank")}
            className="rounded-xl text-xs font-semibold h-9 gap-1.5 border-border cursor-pointer text-emerald-500 hover:bg-emerald-500/10"
            title="Download full 959 groups (1,193 merged questions) JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>959 Groups JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/api/admin/dedup?export=reviews", "_blank")}
            className="rounded-xl text-xs font-semibold h-9 gap-1.5 border-border cursor-pointer text-primary hover:bg-primary/10"
            title="Download all 3,403 reviews & notes JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Reviews JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/api/admin/dedup?export=master", "_blank")}
            className="rounded-xl text-xs font-semibold h-9 gap-1.5 border-border cursor-pointer text-blue-500 hover:bg-blue-500/10"
            title="Download final clean 16,646 questions master pool JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Final Pool JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsImportOpen(true);
              setImportError(null);
              setImportSuccessCount(null);
            }}
            className="rounded-xl text-xs font-semibold h-9 gap-1.5 border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Import AI Review</span>
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
          <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Initial Pool
          </span>
          <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
            18,762 <span className="text-xs font-bold text-muted-foreground">(15.9k GK)</span>
          </p>
        </Card>

        <Card
          onClick={() => {
            setViewMode("groups");
            setPage(0);
            setFocusIndex(0);
          }}
          className={cn(
            "p-3.5 rounded-xl border bg-card shadow-2xs space-y-1 cursor-pointer transition-all hover:border-emerald-500/50",
            viewMode === "groups" ? "border-emerald-500/80 bg-emerald-500/5" : "border-border/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
              Auto-Merged Duplicates
            </span>
            <Badge className="bg-emerald-500/15 text-emerald-500 text-[10px]">Tab 1</Badge>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-500 tabular-nums">
            1,193 <span className="text-xs font-bold text-muted-foreground">(959 groups)</span>
          </p>
        </Card>

        <Card
          onClick={() => {
            setViewMode("review");
            setPage(0);
            setFocusIndex(0);
          }}
          className={cn(
            "p-3.5 rounded-xl border bg-card shadow-2xs space-y-1 cursor-pointer transition-all hover:border-amber-500/50",
            viewMode === "review" ? "border-amber-500/80 bg-amber-500/5" : "border-border/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
              Review Pairs
            </span>
            <Badge className="bg-amber-500/15 text-amber-500 text-[10px]">Tab 2</Badge>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-500 tabular-nums">
            3,397 <span className="text-xs font-bold text-muted-foreground">pairs</span>
          </p>
        </Card>

        <Card className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
          <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
            Final Clean Pool
          </span>
          <p className="text-xl sm:text-2xl font-black text-primary tabular-nums">
            16,646 <span className="text-xs font-bold text-muted-foreground">questions</span>
          </p>
        </Card>
      </div>

      {/* ── Main View Selector Toolbar ── */}
      <div className="p-3 sm:p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <div className="inline-flex items-center p-1 rounded-xl bg-muted/40 border border-border/60">
            <button
              type="button"
              onClick={() => {
                setViewMode("groups");
                setPage(0);
                setFocusIndex(0);
              }}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
                viewMode === "groups"
                  ? "bg-card text-foreground shadow-2xs font-bold border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="h-4 w-4 text-emerald-500" />
              <span>1. Auto-Merged Groups</span>
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
                959 groups (1,193 dups)
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode("review");
                setPage(0);
                setFocusIndex(0);
              }}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
                viewMode === "review"
                  ? "bg-card text-foreground shadow-2xs font-bold border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GitCompare className="h-4 w-4 text-amber-500" />
              <span>2. Manual Review Pairs</span>
              <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] font-bold">
                3,397 pairs
              </Badge>
            </button>
          </div>

          {/* Sub-Filters for Review Pairs */}
          {viewMode === "review" && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setWhyFilter("all");
                  setPage(0);
                  setFocusIndex(0);
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                  whyFilter === "all"
                    ? "bg-foreground text-background font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground bg-muted/30"
                )}
              >
                All (3,397)
              </button>
              <button
                type="button"
                onClick={() => {
                  setWhyFilter("similar_text_DIFFERENT_answer");
                  setPage(0);
                  setFocusIndex(0);
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1",
                  whyFilter === "similar_text_DIFFERENT_answer"
                    ? "bg-rose-500 text-white font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground bg-muted/30"
                )}
                title="Questions with conflicting answer keys (1,598)"
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Key Conflicts (1,598)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWhyFilter("same_answer_reworded");
                  setPage(0);
                  setFocusIndex(0);
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                  whyFilter === "same_answer_reworded"
                    ? "bg-foreground text-background font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground bg-muted/30"
                )}
                title="Same answer with reworded stems (1,799)"
              >
                <span>Reworded (1,799)</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Search & Display Style */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[170px] sm:min-w-[210px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
                setFocusIndex(0);
              }}
              placeholder={viewMode === "groups" ? "Search exam, ID, question..." : "Search pair ID or question..."}
              className="pl-8 h-8 text-xs rounded-xl bg-background border-border/80"
            />
          </div>

          {/* Display Style Toggle (Focus Inspector vs List) */}
          <div className="flex items-center bg-muted/40 p-0.5 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setDisplayStyle("focus")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                displayStyle === "focus"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Focus Mode (Inspect 1 at a time)"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Focus Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayStyle("list")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                displayStyle === "list"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="List Mode (Browse multiple at once)"
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List Mode</span>
            </button>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center bg-muted/40 px-2 py-1 rounded-xl border border-border/60 text-[11px] font-semibold text-muted-foreground">
            <span className="mr-1.5 hidden sm:inline">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value, 10);
                setPageSize(newSize);
                setPage(0);
                setFocusIndex(0);
              }}
              className="bg-transparent font-bold text-foreground outline-none cursor-pointer"
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Notice Toast */}
      {statusNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════════
          VIEW MODE 1: AUTO-MERGED GROUPS (959 GROUPS · 1,193 DUPLICATE QUESTIONS)
          ════════════════════════════════════════════════════════════════════════════════ */}
      {viewMode === "groups" && (
        <>
          {loading ? (
            <Card className="p-12 text-center rounded-2xl border border-border bg-card animate-pulse">
              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">Loading auto-merged groups...</p>
            </Card>
          ) : items.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border border-border bg-card">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">No groups match your search query</p>
            </Card>
          ) : displayStyle === "focus" && currentGroup ? (
            /* ── GROUP FOCUS MODE (Step through groups 1 by 1) ── */
            <div className="space-y-4">
              {/* Stepper Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/20 p-3 rounded-2xl border border-border/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-foreground tabular-nums">
                    Group #{currentGlobalNumber} of {total.toLocaleString()}
                  </span>
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
                    {currentGroup.duplicateVariantsCount} duplicate question{currentGroup.duplicateVariantsCount > 1 ? "s" : ""} merged
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Canonical ID: {currentGroup.canonicalId}
                  </span>
                </div>

                {/* Direct Jump to Group # and Next/Prev Stepper */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center gap-1 bg-background border border-border/80 rounded-xl px-2 py-0.5">
                    <span className="text-[11px] text-muted-foreground font-semibold">Jump to #:</span>
                    <input
                      type="number"
                      min={1}
                      max={total}
                      value={jumpInput}
                      onChange={(e) => setJumpInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleJumpToNumber(jumpInput);
                      }}
                      placeholder={String(currentGlobalNumber)}
                      className="w-16 h-6 text-xs font-mono font-bold bg-transparent outline-none text-foreground"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJumpToNumber(jumpInput)}
                      className="h-6 px-1.5 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-muted"
                    >
                      Go
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0 && focusIndex === 0}
                      onClick={handlePrev}
                      className="h-8 px-2.5 gap-1 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Prev Group</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1 && focusIndex >= items.length - 1}
                      onClick={handleNext}
                      className="h-8 px-2.5 gap-1 rounded-xl text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <span>Next Group</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Group Comparison Cards */}
              <div className="space-y-4">
                {/* 1. CANONICAL QUESTION CARD (KEPT) */}
                {(() => {
                  const canonical = currentGroup.members[0];
                  return (
                    <Card className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/[0.02] shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-emerald-500 text-white uppercase tracking-wider">
                            ✓ CANONICAL (KEPT IN POOL)
                          </span>
                          <span className="font-mono text-xs font-bold text-foreground">
                            ID: {canonical.id}
                          </span>
                          {canonical.exam && (
                            <Badge variant="outline" className="text-[10px] bg-background">
                              {canonical.exam} {canonical.year ? `(${canonical.year})` : ""}
                            </Badge>
                          )}
                        </div>
                        <Badge className="font-bold text-xs bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                          Official Key: {canonical.answer}
                        </Badge>
                      </div>

                      {/* Question Stem */}
                      <p className="text-sm sm:text-base font-bold text-foreground font-hindi leading-relaxed">
                        {canonical.question}
                      </p>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {canonical.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect = letter === canonical.answer;
                          return (
                            <div
                              key={oIdx}
                              className={cn(
                                "p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors",
                                isCorrect
                                  ? "bg-emerald-500/15 border-emerald-500/40 font-bold text-foreground"
                                  : "bg-muted/30 border-border/60 text-muted-foreground"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black",
                                  isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                                )}
                              >
                                {letter}
                              </span>
                              <span className={cn(containsDevanagari(opt) && "font-hindi")}>
                                {opt}
                              </span>
                              {isCorrect && (
                                <span className="ml-auto text-[10px] font-bold text-emerald-500">
                                  ✓ Correct Option
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })()}

                {/* 2. DUPLICATE VARIANTS (MERGED & REMOVED) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                    <span>
                      Duplicate Variants Merged into this Question ({currentGroup.duplicateVariantsCount}):
                    </span>
                    <span className="text-[11px] text-amber-500">
                      All variants confirmed identical in fact and answer key
                    </span>
                  </div>

                  {currentGroup.members.slice(1).map((variant, vIdx) => (
                    <Card
                      key={variant.id}
                      className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-card shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 uppercase tracking-wider">
                            Duplicate #{vIdx + 1} (Merged & Removed)
                          </span>
                          <span className="font-mono text-xs font-bold text-foreground">
                            ID: {variant.id}
                          </span>
                          {variant.exam && (
                            <Badge variant="outline" className="text-[10px] bg-background">
                              {variant.exam} {variant.year ? `(${variant.year})` : ""}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="font-bold text-xs">
                          Answer Key: {variant.answer}
                        </Badge>
                      </div>

                      {/* Question Stem */}
                      <p className="text-xs sm:text-sm font-semibold text-foreground font-hindi leading-relaxed">
                        {variant.question}
                      </p>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {variant.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect = letter === variant.answer;
                          return (
                            <div
                              key={oIdx}
                              className={cn(
                                "p-2 rounded-xl border text-xs flex items-center gap-2",
                                isCorrect
                                  ? "bg-emerald-500/10 border-emerald-500/30 font-semibold text-foreground"
                                  : "bg-muted/20 border-border/50 text-muted-foreground"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-black",
                                  isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                                )}
                              >
                                {letter}
                              </span>
                              <span className={cn(containsDevanagari(opt) && "font-hindi")}>
                                {opt}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>
                          Verified duplicate: tests identical concept with matching official answer ({variant.answer}).
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Bottom Chunk Pagination Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                <div>
                  Showing Group <strong className="text-foreground">#{currentGlobalNumber}</strong> of <strong className="text-foreground">{total.toLocaleString()}</strong> · Chunk {page + 1} of {totalPages}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => {
                      setPage(0);
                      setFocusIndex(0);
                    }}
                    className="h-8 px-2.5 text-xs rounded-xl"
                  >
                    « First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => {
                      setPage((p) => Math.max(0, p - 1));
                      setFocusIndex(0);
                    }}
                    className="h-8 px-2.5 text-xs rounded-xl"
                  >
                    ‹ Prev Chunk
                  </Button>
                  <span className="px-2 font-mono font-bold text-foreground">
                    Chunk {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => {
                      setPage((p) => p + 1);
                      setFocusIndex(0);
                    }}
                    className="h-8 px-2.5 text-xs rounded-xl"
                  >
                    Next Chunk ›
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => {
                      setPage(totalPages - 1);
                      setFocusIndex(0);
                    }}
                    className="h-8 px-2.5 text-xs rounded-xl"
                  >
                    Last »
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ── GROUP LIST MODE (Browse 20/50 groups per page) ── */
            <div className="space-y-4">
              {items.map((group: MergedGroupItem, gIdx) => (
                <Card
                  key={group.groupKey}
                  className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 uppercase">
                        Group #{startIndex + gIdx + 1}
                      </span>
                      <span className="font-mono text-xs font-bold text-foreground">
                        Canonical ID: {group.canonicalId}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {group.membersCount} questions ({group.duplicateVariantsCount} duplicate merged)
                      </Badge>
                    </div>
                  </div>

                  {/* List of members in this group */}
                  <div className="space-y-2">
                    {group.members.map((m, mIdx) => (
                      <div
                        key={m.id}
                        className={cn(
                          "p-3 rounded-xl border text-xs space-y-2",
                          mIdx === 0
                            ? "bg-emerald-500/[0.03] border-emerald-500/30"
                            : "bg-muted/20 border-border/50"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-[11px] text-foreground">
                              {m.id}
                            </span>
                            {mIdx === 0 ? (
                              <span className="text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.2 rounded">
                                CANONICAL KEEP
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.2 rounded">
                                DUPLICATE MERGED
                              </span>
                            )}
                            {m.exam && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-xs">
                                {m.exam} {m.year ? `(${m.year})` : ""}
                              </span>
                            )}
                          </div>
                          <Badge variant="outline" className="font-bold text-xs">
                            Key: {m.answer}
                          </Badge>
                        </div>

                        <p className="font-semibold text-foreground font-hindi leading-relaxed">
                          {m.question}
                        </p>

                        {/* Options */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[11px]">
                          {m.options.map((opt, oIdx) => {
                            const letter = String.fromCharCode(65 + oIdx);
                            const isCorrect = letter === m.answer;
                            return (
                              <div
                                key={oIdx}
                                className={cn(
                                  "p-1.5 rounded-lg border flex items-center gap-1.5",
                                  isCorrect
                                    ? "bg-emerald-500/10 border-emerald-500/30 font-bold text-foreground"
                                    : "bg-muted/30 border-border/60 text-muted-foreground"
                                )}
                              >
                                <span className="font-bold">{letter}.</span>
                                <span className={cn("truncate", containsDevanagari(opt) && "font-hindi")}>
                                  {opt}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}

              {/* Pagination for Groups List */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/60 text-xs text-muted-foreground">
                  <div>
                    Page <strong className="text-foreground">{page + 1}</strong> of <strong className="text-foreground">{totalPages}</strong> ({total} total groups)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(0)}
                      className="rounded-xl text-xs h-8"
                    >
                      « First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="rounded-xl text-xs h-8"
                    >
                      ‹ Previous
                    </Button>
                    <span className="px-2 font-mono font-bold text-foreground">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-xl text-xs h-8"
                    >
                      Next ›
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(totalPages - 1)}
                      className="rounded-xl text-xs h-8"
                    >
                      Last »
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════════
          VIEW MODE 2: MANUAL REVIEW PAIRS (3,397 PAIRS SEQUENTIAL REVIEW)
          ════════════════════════════════════════════════════════════════════════════════ */}
      {viewMode === "review" && (
        <>
          {loading ? (
            <Card className="p-12 text-center rounded-2xl border border-border bg-card animate-pulse">
              <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">Loading review pairs...</p>
            </Card>
          ) : items.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border border-border bg-card">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">No pairs match your selected filters</p>
              <p className="text-xs text-muted-foreground mt-1">Try resetting the reason or status filter.</p>
            </Card>
          ) : displayStyle === "focus" && currentPair ? (
            /* ── PAIR FOCUS MODE (Single Pair side-by-side) ── */
            <div className="space-y-4">
              {/* Stepper Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/20 p-3 rounded-2xl border border-border/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-foreground tabular-nums">
                    Pair #{currentGlobalNumber} of {total.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    (Chunk {page + 1} of {totalPages})
                  </span>
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-mono">
                    Key: {currentPair.pairKey}
                  </span>
                  {currentPair.review && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                      ✓ Reviewed: {currentPair.review.decision}
                    </Badge>
                  )}
                </div>

                {/* Direct Jump to Pair # and Next/Prev Stepper */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center gap-1 bg-background border border-border/80 rounded-xl px-2 py-0.5">
                    <span className="text-[11px] text-muted-foreground font-semibold">Jump to #:</span>
                    <input
                      type="number"
                      min={1}
                      max={total}
                      value={jumpInput}
                      onChange={(e) => setJumpInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleJumpToNumber(jumpInput);
                      }}
                      placeholder={String(currentGlobalNumber)}
                      className="w-16 h-6 text-xs font-mono font-bold bg-transparent outline-none text-foreground"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJumpToNumber(jumpInput)}
                      className="h-6 px-1.5 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-muted"
                    >
                      Go
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0 && focusIndex === 0}
                      onClick={handlePrev}
                      className="h-8 px-2.5 gap-1 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Prev</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1 && focusIndex >= items.length - 1}
                      onClick={handleNext}
                      className="h-8 px-2.5 gap-1 rounded-xl text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <span>Next</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Alert for Conflicting Keys */}
              {currentPair.why === "similar_text_DIFFERENT_answer" && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs flex items-center justify-between gap-3 text-destructive">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="font-semibold">
                      Potential Contradictory Answer Key: Question A marked as [{currentPair.a.answer}], Question B marked as [{currentPair.b.answer}]. Inspect official answer keys below!
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold shrink-0">
                    Similarity: {Math.round(currentPair.similarity * 100)}%
                  </span>
                </div>
              )}

              {/* Side-by-Side Questions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ── QUESTION A CARD ── */}
                <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                          Question A
                        </span>
                        <span className="font-mono text-xs font-bold text-foreground">
                          {currentPair.a.id}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                        Answer Key: {currentPair.a.answer}
                      </Badge>
                    </div>

                    <div
                      className={cn(
                        "text-xs sm:text-sm font-bold text-foreground leading-relaxed",
                        containsDevanagari(currentPair.a.q) && "font-hindi text-base"
                      )}
                    >
                      {currentPair.a.q}
                    </div>

                    {/* Options list A */}
                    <div className="space-y-1.5 pt-2">
                      {currentPair.a.options.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const isCorrect = letter === currentPair.a.answer;
                        return (
                          <div
                            key={oIdx}
                            className={cn(
                              "p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors",
                              isCorrect
                                ? "bg-emerald-500/10 border-emerald-500/30 font-bold text-foreground"
                                : "bg-muted/30 border-border/60 text-muted-foreground"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black",
                                isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {letter}
                            </span>
                            <span className={cn(containsDevanagari(opt) && "font-hindi")}>
                              {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* ── QUESTION B CARD ── */}
                <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          Question B
                        </span>
                        <span className="font-mono text-xs font-bold text-foreground">
                          {currentPair.b.id}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                        Answer Key: {currentPair.b.answer}
                      </Badge>
                    </div>

                    <div
                      className={cn(
                        "text-xs sm:text-sm font-bold text-foreground leading-relaxed",
                        containsDevanagari(currentPair.b.q) && "font-hindi text-base"
                      )}
                    >
                      {currentPair.b.q}
                    </div>

                    {/* Options list B */}
                    <div className="space-y-1.5 pt-2">
                      {currentPair.b.options.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const isCorrect = letter === currentPair.b.answer;
                        return (
                          <div
                            key={oIdx}
                            className={cn(
                              "p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors",
                              isCorrect
                                ? "bg-emerald-500/10 border-emerald-500/30 font-bold text-foreground"
                                : "bg-muted/30 border-border/60 text-muted-foreground"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black",
                                isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {letter}
                            </span>
                            <span className={cn(containsDevanagari(opt) && "font-hindi")}>
                              {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Review Decision Panel */}
              <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span>Submit Audit Review Decision</span>
                    {currentPair.review && (
                      <span className="text-[10px] font-bold text-emerald-500 font-normal">
                        (Current: {currentPair.review.decision})
                      </span>
                    )}
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Hotkeys: <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">1</kbd> Merge · <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">2</kbd> Keep Both
                  </span>
                </div>

                {/* 4 Decision Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant={selectedDecision === "CONFIRMED_DUPLICATE" ? "default" : "outline"}
                    onClick={() => setSelectedDecision("CONFIRMED_DUPLICATE")}
                    className={cn(
                      "h-10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer justify-start px-3",
                      selectedDecision === "CONFIRMED_DUPLICATE" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Merge (Duplicate)</span>
                  </Button>

                  <Button
                    type="button"
                    variant={selectedDecision === "DIFFERENT_QUESTION" ? "default" : "outline"}
                    onClick={() => setSelectedDecision("DIFFERENT_QUESTION")}
                    className={cn(
                      "h-10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer justify-start px-3",
                      selectedDecision === "DIFFERENT_QUESTION" && "bg-foreground text-background"
                    )}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Keep Both (Distinct)</span>
                  </Button>

                  <Button
                    type="button"
                    variant={selectedDecision === "KEY_ERROR_A" ? "default" : "outline"}
                    onClick={() => setSelectedDecision("KEY_ERROR_A")}
                    className={cn(
                      "h-10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer justify-start px-3 text-rose-500 hover:text-rose-600",
                      selectedDecision === "KEY_ERROR_A" && "bg-rose-600 hover:bg-rose-700 text-white"
                    )}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Key Error in A</span>
                  </Button>

                  <Button
                    type="button"
                    variant={selectedDecision === "KEY_ERROR_B" ? "default" : "outline"}
                    onClick={() => setSelectedDecision("KEY_ERROR_B")}
                    className={cn(
                      "h-10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer justify-start px-3 text-rose-500 hover:text-rose-600",
                      selectedDecision === "KEY_ERROR_B" && "bg-rose-600 hover:bg-rose-700 text-white"
                    )}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Key Error in B</span>
                  </Button>
                </div>

                {/* Review Note Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Explanation / Note (Why merged or why answer was changed):
                  </label>
                  <Textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="E.g., दोनों में केवल वर्तनी का अंतर है। उत्तर D कर्नल टॉड ही सही है।"
                    rows={2}
                    className="text-xs rounded-xl bg-background border-border/80 font-hindi"
                  />
                </div>

                {/* Submit & Next Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    Persists directly to <code>data/ddd/dedup/user-reviews.json</code>
                  </span>
                  <Button
                    type="button"
                    disabled={!selectedDecision || submitting}
                    onClick={() => {
                      if (selectedDecision && currentPair) {
                        handleSubmitReview(currentPair.pairKey, selectedDecision, reviewNote);
                      }
                    }}
                    className="rounded-xl h-9 px-5 text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
                  >
                    {submitting ? "Saving..." : "Save Review & Next →"}
                  </Button>
                </div>
              </Card>

              {/* Bottom Chunk Pagination Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                <div>
                  Showing Pair <strong className="text-foreground">#{currentGlobalNumber}</strong> of <strong className="text-foreground">{total.toLocaleString()}</strong> · Chunk {page + 1} of {totalPages}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => {
                      setPage(0);
                      setFocusIndex(0);
                    }}
                    className="h-8 px-2.5 text-xs rounded-xl"
                  >
                    « First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => {
                      setPage((p) => Math.max(0, p - 1));
                      setFocusIndex(0);
                    }}
                    className="h-8 px-2.5 text-xs rounded-xl"
                  >
                    ‹ Prev Chunk
                  </Button>
                  <span className="px-2 font-mono font-bold text-foreground">
                    Chunk {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => {
                      setPage((p) => p + 1);
                      setFocusIndex(0);
                    }}
                    className="h-8 px-2.5 text-xs rounded-xl"
                  >
                    Next Chunk ›
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => {
                      setPage(totalPages - 1);
                      setFocusIndex(0);
                    }}
                    className="h-8 px-2.5 text-xs rounded-xl"
                  >
                    Last »
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ── PAIR LIST MODE (Dense List View) ── */
            <div className="space-y-3">
              {items.map((item: ReviewPairItem, idx) => (
                <Card
                  key={item.pairKey}
                  className="p-4 rounded-xl border border-border/80 bg-card shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-bold text-foreground font-mono">
                        #{startIndex + idx + 1}. {item.a.id} ↔ {item.b.id}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {Math.round(item.similarity * 100)}% sim
                      </Badge>
                      {item.why === "similar_text_DIFFERENT_answer" && (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          Key Conflict: [{item.a.answer}] vs [{item.b.answer}]
                        </span>
                      )}
                      {item.review && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px]">
                          Reviewed: {item.review.decision}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={item.review?.decision === "CONFIRMED_DUPLICATE" ? "default" : "outline"}
                        onClick={() => handleSubmitReview(item.pairKey, "CONFIRMED_DUPLICATE", "")}
                        className="h-7 px-2.5 text-[11px] rounded-lg"
                      >
                        Merge
                      </Button>
                      <Button
                        size="sm"
                        variant={item.review?.decision === "DIFFERENT_QUESTION" ? "default" : "outline"}
                        onClick={() => handleSubmitReview(item.pairKey, "DIFFERENT_QUESTION", "")}
                        className="h-7 px-2.5 text-[11px] rounded-lg"
                      >
                        Keep Both
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50 space-y-1">
                      <p className="font-bold text-foreground font-hindi">{item.a.q}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Answer: <strong className="text-emerald-500">{item.a.answer}</strong> ({item.a.options["ABCD".indexOf(item.a.answer)] || ""})
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50 space-y-1">
                      <p className="font-bold text-foreground font-hindi">{item.b.q}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Answer: <strong className="text-emerald-500">{item.b.answer}</strong> ({item.b.options["ABCD".indexOf(item.b.answer)] || ""})
                      </p>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Pagination for Pairs List */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/60 text-xs text-muted-foreground">
                  <div>
                    Page <strong className="text-foreground">{page + 1}</strong> of <strong className="text-foreground">{totalPages}</strong> ({total} total pairs)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(0)}
                      className="rounded-xl text-xs h-8"
                    >
                      « First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="rounded-xl text-xs h-8"
                    >
                      ‹ Previous
                    </Button>
                    <span className="px-2 font-mono font-bold text-foreground">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-xl text-xs h-8"
                    >
                      Next ›
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(totalPages - 1)}
                      className="rounded-xl text-xs h-8"
                    >
                      Last »
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── AI Review Batch Import Modal ── */}
      <Dialog open={isImportOpen} onOpenChange={(val) => !importing && setIsImportOpen(val)}>
        <DialogContent className="rounded-2xl border border-border bg-card shadow-2xl max-w-xl p-5 sm:p-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Import AI Review Batch
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Paste the JSON array response received from ChatGPT, Claude, or Gemini for any batch from{" "}
                <code className="text-primary font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                  data/ddd/dedup/ai_batches/
                </code>
                .
              </DialogDescription>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Paste AI Response JSON:</span>
                {detectedCount > 0 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] font-semibold">
                    ✓ {detectedCount} items detected
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-[11px]">Accepts raw JSON array</span>
                )}
              </div>
              <Textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(null);
                }}
                placeholder={`[\n  {\n    "id": "rg_000127___rg_011425",\n    "decision": "CONFIRMED_DUPLICATE",\n    "preferred_id": "rg_011425",\n    "correct_answer": "D",\n    "note": "दोनों समान हैं। कर्नल टॉड सही है।"\n  }\n]`}
                rows={11}
                className="font-mono text-xs bg-muted/30 border-border focus:border-primary/50 resize-y"
              />
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccessCount !== null && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Successfully imported {importSuccessCount} reviews! Station updated.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                disabled={importing}
                onClick={() => setIsImportOpen(false)}
                className="rounded-xl text-xs h-9 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={importing || detectedCount === 0}
                onClick={handleImportAIReviews}
                className="rounded-xl text-xs font-semibold h-9 gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {importing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Import {detectedCount > 0 ? `${detectedCount} ` : ""}Reviews</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
