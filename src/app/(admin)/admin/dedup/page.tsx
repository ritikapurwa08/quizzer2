"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitCompare,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Download,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ViewMode,
  WhyFilter,
  StatusFilter,
  DecisionType,
  ReviewPairItem,
  MergedGroupItem,
  DedupStatsCards,
  DedupToolbar,
  GroupCard,
  PairReviewCard,
  ImportAiReviewDialog,
} from "@/components/admin/dedup";

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

  // Focus stepper mode: index within current fetched items chunk (0 .. items.length - 1)
  const [focusIndex, setFocusIndex] = useState(0);
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null);

  // Jump-to-index direct input
  const [jumpInput, setJumpInput] = useState("");

  // Review interaction state
  const [selectedDecision, setSelectedDecision] = useState<DecisionType | "">("");
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Fetch items based on current chunk & filters
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: viewMode,
        page: String(page),
        limit: String(pageSize),
      });

      if (viewMode === "review") {
        if (whyFilter !== "all") params.set("why", whyFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
      }

      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/dedup?${params.toString()}`);
      const data = await res.json();

      setItems(data.items || []);
      setTotal(data.total || 0);
      setStartIndex(data.startIndex || 0);
      setTotalPages(data.totalPages || 1);
      if (data.reviewedCount !== undefined) setReviewedCount(data.reviewedCount);
      if (data.totalDuplicatesCount !== undefined) {
        setTotalDuplicatesCount(data.totalDuplicatesCount);
      }

      if (pendingFocusIndex !== null) {
        setFocusIndex(Math.min(pendingFocusIndex, Math.max(0, (data.items?.length || 1) - 1)));
        setPendingFocusIndex(null);
      } else {
        setFocusIndex(0);
      }
    } catch (err) {
      console.error("Failed to load dedup data", err);
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
            <span>Reviews JSON ({reviewedCount})</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="rounded-xl text-xs font-semibold h-9 gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Import AI Reviews</span>
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      <DedupStatsCards
        viewMode={viewMode}
        onSelectViewMode={(mode) => {
          setViewMode(mode);
          setPage(0);
          setFocusIndex(0);
        }}
        mergedDuplicatesCount={totalDuplicatesCount}
      />

      {/* ── Main View Selector Toolbar ── */}
      <DedupToolbar
        viewMode={viewMode}
        onSelectViewMode={(mode) => {
          setViewMode(mode);
          setPage(0);
          setFocusIndex(0);
        }}
        whyFilter={whyFilter}
        onChangeWhyFilter={(why) => {
          setWhyFilter(why);
          setPage(0);
          setFocusIndex(0);
        }}
        search={search}
        onChangeSearch={(val) => {
          setSearch(val);
          setPage(0);
          setFocusIndex(0);
        }}
        displayStyle={displayStyle}
        onChangeDisplayStyle={(style) => setDisplayStyle(style)}
        pageSize={pageSize}
        onChangePageSize={(size) => {
          setPageSize(size);
          setPage(0);
          setFocusIndex(0);
        }}
      />

      {/* Status Notice Toast */}
      {statusNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* ════ VIEW MODE 1: AUTO-MERGED GROUPS ════ */}
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
                      className="h-8 px-2.5 gap-1 rounded-xl text-xs font-semibold cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <span>Next</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Group Card Details */}
              <GroupCard group={currentGroup} />

              {/* Bottom Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                <div>
                  Showing Group <strong className="text-foreground">#{currentGlobalNumber}</strong> of <strong className="text-foreground">{total.toLocaleString()}</strong> · Chunk {page + 1} of {totalPages}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0 && focusIndex === 0}
                    onClick={handlePrev}
                    className="rounded-xl text-xs h-8"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1 && focusIndex >= items.length - 1}
                    onClick={handleNext}
                    className="rounded-xl text-xs h-8"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((g) => (
                <GroupCard key={g.groupKey || g.canonicalId} group={g} />
              ))}

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

      {/* ════ VIEW MODE 2: MANUAL REVIEW PAIRS ════ */}
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

              {/* Pair Review Card */}
              <PairReviewCard
                pair={currentPair}
                selectedDecision={selectedDecision || null}
                onSelectDecision={(dec) => setSelectedDecision(dec)}
                reviewNote={reviewNote}
                onChangeReviewNote={(note) => setReviewNote(note)}
                onSubmitReview={handleSubmitReview}
                submitting={submitting}
              />

              {/* Bottom Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                <div>
                  Showing Pair <strong className="text-foreground">#{currentGlobalNumber}</strong> of <strong className="text-foreground">{total.toLocaleString()}</strong> · Chunk {page + 1} of {totalPages}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0 && focusIndex === 0}
                    onClick={handlePrev}
                    className="rounded-xl text-xs h-8"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1 && focusIndex >= items.length - 1}
                    onClick={handleNext}
                    className="rounded-xl text-xs h-8"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((p) => (
                <PairReviewCard
                  key={p.pairKey}
                  pair={p}
                  selectedDecision={p.review?.decision || null}
                  onSelectDecision={(dec) => handleSubmitReview(p.pairKey, dec, "")}
                  reviewNote={p.review?.note || ""}
                  onChangeReviewNote={() => {}}
                  onSubmitReview={handleSubmitReview}
                />
              ))}

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
      <ImportAiReviewDialog
        isOpen={isImportOpen}
        onOpenChange={(val) => setIsImportOpen(val)}
        importText={importText}
        onChangeImportText={(txt) => setImportText(txt)}
        detectedCount={detectedCount}
        importError={importError}
        importSuccessCount={importSuccessCount}
        importing={importing}
        onImport={handleImportAIReviews}
      />
    </div>
  );
}
