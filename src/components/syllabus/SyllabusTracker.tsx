"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  SENIOR_TEACHER_SYLLABUS,
  CET_SYLLABUS,
  getSubTopicsForTopic,
  SyllabusTopicItem,
} from "@/lib/syllabus-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Circle,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Target,
  RotateCcw,
  Layers,
  ArrowRight,
  Filter,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

type ExamTab = "senior-teacher" | "cet";
type StatusFilter = "all" | "completed" | "pending";

interface SyllabusTrackerProps {
  initialTab?: ExamTab;
  isStandalonePage?: boolean;
}

const STORAGE_KEY = "quizzer_syllabus_completed_v1";

export function SyllabusTracker({
  initialTab = "senior-teacher",
  isStandalonePage = true,
}: SyllabusTrackerProps) {
  const [activeTab, setActiveTab] = useState<ExamTab>(initialTab);
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isClient, setIsClient] = useState(false);

  // Load completed topics from localStorage
  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCompletedTopicIds(new Set(parsed));
        }
      }
    } catch (e) {
      console.error("Failed to load syllabus progress from localStorage", e);
    }
  }, []);

  // Toggle completion of a single topic reliably
  const toggleTopic = (id: string) => {
    setCompletedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error("Failed to persist syllabus progress", e);
      }
      return next;
    });
  };

  const resetAllProgress = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Are you sure you want to reset all tracked syllabus progress?");
      if (!confirmed) return;
    }
    setCompletedTopicIds(new Set());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear syllabus progress", e);
    }
  };

  const toggleExpandTopic = (id: string) => {
    setExpandedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSectionCollapse = (sectionName: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Active dataset based on chosen tab
  const activeDataset = useMemo(() => {
    if (activeTab === "senior-teacher") return SENIOR_TEACHER_SYLLABUS;
    return CET_SYLLABUS;
  }, [activeTab]);

  // Available sections for filtering
  const availableSections = useMemo(() => {
    return Array.from(new Set(activeDataset.map((t) => t.section)));
  }, [activeDataset]);

  // Overall statistics
  const totalCount = activeDataset.length;
  const completedCount = useMemo(() => {
    return activeDataset.filter((t) => completedTopicIds.has(t.id)).length;
  }, [activeDataset, completedTopicIds]);
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingCount = totalCount - completedCount;

  // Filtered dataset
  const filteredDataset = useMemo(() => {
    return activeDataset.filter((topic) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitleHindi = topic.titleHindi?.toLowerCase().includes(query);
        const matchTitleEng = topic.titleEnglish?.toLowerCase().includes(query);
        const matchSection = topic.section?.toLowerCase().includes(query);
        const matchSubSection = topic.subSection?.toLowerCase().includes(query);
        if (!matchTitleHindi && !matchTitleEng && !matchSection && !matchSubSection) {
          return false;
        }
      }

      // 2. Section Filter
      if (selectedSection !== "all" && topic.section !== selectedSection) {
        return false;
      }

      // 3. Status Filter
      const isDone = completedTopicIds.has(topic.id);
      if (statusFilter === "completed" && !isDone) return false;
      if (statusFilter === "pending" && isDone) return false;

      return true;
    });
  }, [activeDataset, searchQuery, selectedSection, statusFilter, completedTopicIds]);

  // Group filtered dataset by section
  const groupedSections = useMemo(() => {
    const map = new Map<string, SyllabusTopicItem[]>();
    for (const item of filteredDataset) {
      const section = item.section || "General";
      if (!map.has(section)) {
        map.set(section, []);
      }
      map.get(section)!.push(item);
    }
    return Array.from(map.entries());
  }, [filteredDataset]);

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumbs & Title */}
      {isStandalonePage && (
        <div className="space-y-2">
          <BreadcrumbNav
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Syllabus Tracker" },
            ]}
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Syllabus Tracker
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Official RPSC Senior Teacher (2nd Grade) Paper-1 competitive exam syllabus coverage.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={resetAllProgress}
              className="rounded-xl text-xs font-semibold h-8.5 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset Progress
            </Button>
          </div>
        </div>
      )}

      {/* 2. Exam Selector Segmented Tabs */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("senior-teacher");
            setSelectedSection("all");
          }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none",
            activeTab === "senior-teacher"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          Senior Teacher (2nd Grade)
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("cet");
            setSelectedSection("all");
          }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none",
            activeTab === "cet"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          RSMSSB CET (Optional)
        </button>
      </div>

      {/* 3. Preparation Progress Banner */}
      <Card className="p-4 sm:p-5 rounded-2xl border border-border shadow-xs bg-card">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Topics
            </span>
            <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
              {totalCount}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Completed
            </span>
            <p className="text-xl sm:text-2xl font-bold text-success tabular-nums">
              {isClient ? completedCount : "—"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Pending
            </span>
            <p className="text-xl sm:text-2xl font-bold text-warning tabular-nums">
              {isClient ? pendingCount : "—"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Overall Coverage
            </span>
            <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
              {isClient ? `${progressPercent}%` : "—"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Syllabus Completion</span>
            <span className="font-bold text-foreground tabular-nums">
              {isClient ? `${progressPercent}%` : "0%"}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${isClient ? progressPercent : 0}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 4. Filter and Search Bar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-2xs">
        {/* Search input */}
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics by keyword..."
            className="pl-9 h-9 text-xs rounded-xl bg-background border-border/80"
          />
        </div>

        {/* Section and Status Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Section dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline" />
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              aria-label="Filter by section"
              className="h-9 px-2.5 rounded-xl border border-border/80 bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
            >
              <option value="all">All Sections ({totalCount})</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter toggle pills */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/60">
            {(["all", "completed", "pending"] as StatusFilter[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer select-none",
                  statusFilter === st
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Grouped Syllabus Topic Accordions */}
      {groupedSections.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border border-border bg-card">
          <BookOpen className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">No matching topics found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search keyword or clearing the status filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedSections.map(([sectionTitle, topics]) => {
            const isCollapsed = Boolean(collapsedSections[sectionTitle]);
            const sectionCompleted = topics.filter((t) => completedTopicIds.has(t.id)).length;
            const sectionTotal = topics.length;
            const sectionPercent = Math.round((sectionCompleted / sectionTotal) * 100);

            return (
              <div
                key={sectionTitle}
                className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden"
              >
                {/* Section Header */}
                <div
                  onClick={() => toggleSectionCollapse(sectionTitle)}
                  className="flex items-center justify-between p-3.5 sm:p-4 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer select-none border-b border-border/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                      <Layers className="h-3.5 w-3.5" />
                    </span>
                    <h2 className="text-xs sm:text-sm font-bold text-foreground truncate font-hindi">
                      {sectionTitle}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      <strong className="text-foreground">{sectionCompleted}</strong>/{sectionTotal}
                      <span className="hidden sm:inline text-muted-foreground/70 ml-1">
                        ({sectionPercent}%)
                      </span>
                    </span>
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Section Topic Checklist Items */}
                {!isCollapsed && (
                  <div className="divide-y divide-border/50">
                    {topics.map((topic, idx) => {
                      const isDone = completedTopicIds.has(topic.id);
                      const subTopics = getSubTopicsForTopic(topic);
                      const isExpanded = expandedTopicIds.has(topic.id);

                      return (
                        <div
                          key={topic.id}
                          className={cn(
                            "p-3 sm:p-3.5 transition-colors",
                            isDone ? "bg-success/5" : "hover:bg-muted/20"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Checkbox & Topic Title */}
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => toggleTopic(topic.id)}
                                aria-label={isDone ? "Mark pending" : "Mark completed"}
                                className={cn(
                                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer",
                                  isDone
                                    ? "border-success bg-success text-success-foreground shadow-2xs"
                                    : "border-border hover:border-foreground/50 bg-background"
                                )}
                              >
                                {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-semibold text-muted-foreground font-mono">
                                    {String(idx + 1).padStart(2, "0")}
                                  </span>
                                  <h3
                                    onClick={() => toggleTopic(topic.id)}
                                    className={cn(
                                      "text-xs sm:text-sm font-semibold transition-colors cursor-pointer font-hindi",
                                      isDone
                                        ? "text-muted-foreground line-through decoration-muted-foreground/40"
                                        : "text-foreground hover:text-primary"
                                    )}
                                  >
                                    {topic.titleHindi}
                                  </h3>
                                  {topic.subSection && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground"
                                    >
                                      {topic.subSection}
                                    </Badge>
                                  )}
                                </div>

                                {topic.titleEnglish && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {topic.titleEnglish}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Subtopics expander or practice link */}
                            <div className="flex items-center gap-2 shrink-0">
                              {subTopics.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandTopic(topic.id)}
                                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-colors cursor-pointer select-none"
                                >
                                  <span>{subTopics.length} headings</span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </button>
                              )}

                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                              >
                                <Link href="/subjects">
                                  Practice <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                              </Button>
                            </div>
                          </div>

                          {/* Sub-headings expansion */}
                          {isExpanded && subTopics.length > 0 && (
                            <div className="mt-2.5 ml-8 pl-3 border-l-2 border-primary/20 space-y-1.5 py-1">
                              {subTopics.map((st) => (
                                <div
                                  key={st.id}
                                  className="text-[11px] text-muted-foreground font-hindi flex items-center gap-2"
                                >
                                  <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                                  <span>{st.titleHindi}</span>
                                  {st.titleEnglish && (
                                    <span className="text-[10px] text-muted-foreground/70 font-sans">
                                      ({st.titleEnglish})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
