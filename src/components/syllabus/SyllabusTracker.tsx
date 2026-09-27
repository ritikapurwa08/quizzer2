"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  SENIOR_TEACHER_SYLLABUS,
  CET_SYLLABUS,
  getMergedCommonTopics,
  getSubTopicsForTopic,
  SyllabusTopicItem,
  MergedCommonTopic,
  StaticSubTopic,
} from "@/lib/syllabus-data";
import { CANONICAL_SUBJECTS, CANONICAL_TOPICS } from "@/lib/static-syllabus";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Circle,
  Search,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
  Flame,
  AlertTriangle,
  RotateCcw,
  Layers,
  ChevronRight,
  BookmarkCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ExamTab = "senior-teacher" | "cet" | "merged" | "master-75";
type StatusFilter = "all" | "completed" | "pending" | "weak";

interface SyllabusTrackerProps {
  initialTab?: ExamTab;
  isStandalonePage?: boolean;
}

const STORAGE_KEY = "quizzer_syllabus_completed_v1";
const SUBTOPIC_STORAGE_KEY = "quizzer_syllabus_subtopics_v1";

export function SyllabusTracker({
  initialTab = "senior-teacher",
  isStandalonePage = false,
}: SyllabusTrackerProps) {
  const [activeTab, setActiveTab] = useState<ExamTab>(initialTab);
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());
  const [completedSubTopicIds, setCompletedSubTopicIds] = useState<Set<string>>(new Set());
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isClient, setIsClient] = useState(false);

  // Load completed topics & subtopics from localStorage
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
      const storedSubs = localStorage.getItem(SUBTOPIC_STORAGE_KEY);
      if (storedSubs) {
        const parsedSubs = JSON.parse(storedSubs);
        if (Array.isArray(parsedSubs)) {
          setCompletedSubTopicIds(new Set(parsedSubs));
        }
      }
    } catch (e) {
      console.error("Failed to load syllabus progress from localStorage", e);
    }
  }, []);

  // Save to localStorage when completed topics change
  const toggleTopic = (id: string, commonKey?: string, subTopics?: StaticSubTopic[]) => {
    setCompletedTopicIds((prev) => {
      const next = new Set(prev);
      const isCurrentlyDone = next.has(id);

      if (isCurrentlyDone) {
        next.delete(id);
        if (commonKey) {
          SENIOR_TEACHER_SYLLABUS.forEach((t) => {
            if (t.commonKey === commonKey) next.delete(t.id);
          });
          CET_SYLLABUS.forEach((t) => {
            if (t.commonKey === commonKey) next.delete(t.id);
          });
        }
      } else {
        next.add(id);
        if (commonKey) {
          SENIOR_TEACHER_SYLLABUS.forEach((t) => {
            if (t.commonKey === commonKey) next.add(t.id);
          });
          CET_SYLLABUS.forEach((t) => {
            if (t.commonKey === commonKey) next.add(t.id);
          });
        }
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error("Failed to persist syllabus progress", e);
      }
      return next;
    });

    // Also toggle all child subtopics if provided
    if (subTopics && subTopics.length > 0) {
      setCompletedSubTopicIds((prevSubs) => {
        const nextSubs = new Set(prevSubs);
        const shouldCheck = !completedTopicIds.has(id);
        subTopics.forEach((st) => {
          if (shouldCheck) nextSubs.add(st.id);
          else nextSubs.delete(st.id);
        });
        try {
          localStorage.setItem(SUBTOPIC_STORAGE_KEY, JSON.stringify(Array.from(nextSubs)));
        } catch (e) {
          console.error("Failed to persist subtopics progress", e);
        }
        return nextSubs;
      });
    }
  };

  // Toggle individual subtopic
  const toggleSubTopic = (subTopicId: string, parentTopicId: string, allSubTopics: StaticSubTopic[]) => {
    setCompletedSubTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(subTopicId)) {
        next.delete(subTopicId);
      } else {
        next.add(subTopicId);
      }

      try {
        localStorage.setItem(SUBTOPIC_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error("Failed to persist subtopic progress", e);
      }

      // Check if all subtopics are now done
      const allDone = allSubTopics.every((st) => next.has(st.id));
      setCompletedTopicIds((prevTopics) => {
        const nextTopics = new Set(prevTopics);
        if (allDone) {
          nextTopics.add(parentTopicId);
        } else {
          nextTopics.delete(parentTopicId);
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(nextTopics)));
        } catch (e) {
          console.error("Failed to persist topic progress", e);
        }
        return nextTopics;
      });

      return next;
    });
  };

  const toggleExpandTopic = (topicId: string) => {
    setExpandedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  const resetAllProgress = () => {
    if (window.confirm("क्या आप वाकई सभी टिक किए गए टॉपिक्स को रीसेट करना चाहते हैं?")) {
      setCompletedTopicIds(new Set());
      setCompletedSubTopicIds(new Set());
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SUBTOPIC_STORAGE_KEY);
      } catch (e) {
        console.error("Failed to clear syllabus progress", e);
      }
    }
  };

  const toggleSectionCollapse = (sectionName: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Pre-calculate merged list
  const mergedList = useMemo(() => getMergedCommonTopics(), []);

  // Stats for Senior Teacher
  const stTotal = SENIOR_TEACHER_SYLLABUS.length;
  const stCompleted = useMemo(() => {
    return SENIOR_TEACHER_SYLLABUS.filter((t) => completedTopicIds.has(t.id)).length;
  }, [completedTopicIds]);
  const stPercent = stTotal > 0 ? Math.round((stCompleted / stTotal) * 100) : 0;

  // Stats for CET
  const cetTotal = CET_SYLLABUS.length;
  const cetCompleted = useMemo(() => {
    return CET_SYLLABUS.filter((t) => completedTopicIds.has(t.id)).length;
  }, [completedTopicIds]);
  const cetPercent = cetTotal > 0 ? Math.round((cetCompleted / cetTotal) * 100) : 0;

  // Stats for Merged
  const mergedTotal = mergedList.length;
  const mergedCompleted = useMemo(() => {
    return mergedList.filter(
      (m) => completedTopicIds.has(m.seniorTeacherTopic.id) || completedTopicIds.has(m.cetTopic.id)
    ).length;
  }, [mergedList, completedTopicIds]);
  const mergedPercent = mergedTotal > 0 ? Math.round((mergedCompleted / mergedTotal) * 100) : 0;

  // Active dataset
  const activeDataset = useMemo(() => {
    if (activeTab === "senior-teacher") return SENIOR_TEACHER_SYLLABUS;
    if (activeTab === "cet") return CET_SYLLABUS;
    return [];
  }, [activeTab]);

  // Available sections for filtering in active tab
  const availableSections = useMemo(() => {
    if (activeTab === "merged") {
      return Array.from(new Set(mergedList.map((m) => m.categoryHindi)));
    }
    return Array.from(new Set(activeDataset.map((t) => t.section)));
  }, [activeTab, activeDataset, mergedList]);

  // Calculate topic progress helper
  const getTopicProgress = (topic: SyllabusTopicItem) => {
    const subTopics = getSubTopicsForTopic(topic);
    if (completedTopicIds.has(topic.id)) {
      return { total: subTopics.length, done: subTopics.length, percent: 100, isDone: true, isWeak: false };
    }
    const doneCount = subTopics.filter((st) => completedSubTopicIds.has(st.id)).length;
    const percent = subTopics.length > 0 ? Math.round((doneCount / subTopics.length) * 100) : 0;
    const isDone = doneCount === subTopics.length && subTopics.length > 0;
    const isWeak = percent < 60; // Flag as weak area if unattempted or below 60%
    return { total: subTopics.length, done: doneCount, percent, isDone, isWeak };
  };

  // Filtered topics based on search, status, and section
  const filteredTopics = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return activeDataset.filter((topic) => {
      // 1. Search Query
      if (q) {
        const matchHindi = topic.titleHindi.toLowerCase().includes(q);
        const matchEnglish = topic.titleEnglish.toLowerCase().includes(q);
        const matchSec = topic.section.toLowerCase().includes(q);
        const matchSub = (topic.subSection || "").toLowerCase().includes(q);
        const matchNotes = (topic.commonNotes || "").toLowerCase().includes(q);
        const subTopics = getSubTopicsForTopic(topic);
        const matchSubTopics = subTopics.some(
          (st) => st.titleHindi.toLowerCase().includes(q) || st.titleEnglish.toLowerCase().includes(q)
        );
        if (!matchHindi && !matchEnglish && !matchSec && !matchSub && !matchNotes && !matchSubTopics) {
          return false;
        }
      }

      // 2. Status & Weak Area Filter
      const prog = getTopicProgress(topic);
      if (statusFilter === "completed" && !prog.isDone) return false;
      if (statusFilter === "pending" && prog.isDone) return false;
      if (statusFilter === "weak" && !prog.isWeak) return false;

      // 3. Section Filter
      if (selectedSection !== "all" && topic.section !== selectedSection) {
        return false;
      }

      return true;
    });
  }, [activeDataset, searchQuery, statusFilter, selectedSection, completedTopicIds, completedSubTopicIds]);

  // Filtered merged topics
  const filteredMergedTopics = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return mergedList.filter((item) => {
      if (q) {
        const matchHindi = item.titleHindi.toLowerCase().includes(q);
        const matchEnglish = item.titleEnglish.toLowerCase().includes(q);
        const matchCat = item.categoryHindi.toLowerCase().includes(q);
        if (!matchHindi && !matchEnglish && !matchCat) return false;
      }

      const isDone =
        completedTopicIds.has(item.seniorTeacherTopic.id) ||
        completedTopicIds.has(item.cetTopic.id);
      if (statusFilter === "completed" && !isDone) return false;
      if (statusFilter === "pending" && isDone) return false;
      if (statusFilter === "weak" && isDone) return false;

      if (selectedSection !== "all" && item.categoryHindi !== selectedSection) {
        return false;
      }

      return true;
    });
  }, [mergedList, searchQuery, statusFilter, selectedSection, completedTopicIds]);

  // Group topics by section
  const groupedSections = useMemo(() => {
    const groups: { [section: string]: SyllabusTopicItem[] } = {};
    for (const t of filteredTopics) {
      if (!groups[t.section]) groups[t.section] = [];
      groups[t.section].push(t);
    }
    return groups;
  }, [filteredTopics]);

  // Current overview numbers based on active tab
  const activeOverview = useMemo(() => {
    if (activeTab === "senior-teacher") {
      const weakCount = SENIOR_TEACHER_SYLLABUS.filter((t) => getTopicProgress(t).isWeak).length;
      return {
        title: "2nd Grade Paper-1 (GK)",
        total: stTotal,
        completed: stCompleted,
        percent: stPercent,
        remaining: stTotal - stCompleted,
        weakCount,
      };
    } else if (activeTab === "cet") {
      const weakCount = CET_SYLLABUS.filter((t) => getTopicProgress(t).isWeak).length;
      return {
        title: "RSMSSB CET (Grad. & 12th)",
        total: cetTotal,
        completed: cetCompleted,
        percent: cetPercent,
        remaining: cetTotal - cetCompleted,
        weakCount,
      };
    } else if (activeTab === "merged") {
      return {
        title: "उभयनिष्ठ पाठ्यक्रम (Overlap)",
        total: mergedTotal,
        completed: mergedCompleted,
        percent: mergedPercent,
        remaining: mergedTotal - mergedCompleted,
        weakCount: mergedTotal - mergedCompleted,
      };
    }
    return {
      title: "राजस्थान GK 70 मास्टर टॉपिक्स",
      total: 70,
      completed: 70,
      percent: 100,
      remaining: 0,
      weakCount: 0,
    };
  }, [activeTab, stTotal, stCompleted, stPercent, cetTotal, cetCompleted, cetPercent, mergedTotal, mergedCompleted, mergedPercent, completedTopicIds, completedSubTopicIds]);

  return (
    <div className="space-y-3.5 max-w-5xl mx-auto">
      {/* ─── Compact Header & Tab Switcher ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground font-hindi tracking-tight">
              पाठ्यक्रम एवं तैयारी ट्रैकर
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-hindi mt-0.5">
            2nd Grade, CET व 70 मास्टर टॉपिक्स की बहु-स्तरीय प्रगति एवं कमजोर क्षेत्र।
          </p>
        </div>

        {/* Compact Segmented Tabs */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/80 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => { setActiveTab("senior-teacher"); setSelectedSection("all"); }}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
              activeTab === "senior-teacher"
                ? "bg-background text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>2nd Grade</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-muted text-foreground">
              {stPercent}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("cet"); setSelectedSection("all"); }}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
              activeTab === "cet"
                ? "bg-background text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>CET</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-muted text-foreground">
              {cetPercent}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("merged"); setSelectedSection("all"); }}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
              activeTab === "merged"
                ? "bg-background text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>कॉमन टॉपिक्स</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("master-75"); setSelectedSection("all"); }}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
              activeTab === "master-75"
                ? "bg-background text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>70 टॉपिक्स</span>
          </button>
        </div>
      </div>

      {/* ─── Compact Progress & Weak Area Bar ─── */}
      {activeTab !== "master-75" && (
        <Card className="p-3 sm:p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-foreground font-hindi">{activeOverview.title}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-hindi">
                पूर्ण: {activeOverview.completed} / {activeOverview.total}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground font-hindi">
                शेष: {activeOverview.remaining}
              </span>
              {activeOverview.weakCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-hindi">
                  <AlertTriangle className="h-3 w-3" /> {activeOverview.weakCount} कमजोर/लंबित
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold font-hindi tabular-nums">{activeOverview.percent}%</span>
              <div className="w-24 sm:w-32 h-2 bg-muted rounded-full overflow-hidden border border-border/60">
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${activeOverview.percent}%` }}
                />
              </div>
              <button
                type="button"
                onClick={resetAllProgress}
                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer ml-1"
                title="प्रगति रीसेट करें"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Compact Search, Section & Weak Area Filter ─── */}
      {activeTab !== "master-75" && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="टॉपिक या सब-टॉपिक खोजें (उदा: बनास नदी, कालीबंगा, 1857...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 h-8 text-xs rounded-lg border-border bg-card font-hindi"
            />
          </div>

          {/* Quick Section Filter */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="h-8 text-xs rounded-lg border border-border bg-card px-2 text-foreground font-hindi focus:outline-hidden cursor-pointer"
          >
            <option value="all">सभी खंड ({availableSections.length})</option>
            {availableSections.map((sec) => (
              <option key={sec} value={sec}>
                {sec.length > 32 ? sec.slice(0, 32) + "…" : sec}
              </option>
            ))}
          </select>

          {/* Status / Weak Area Toggle */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/80 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer",
                statusFilter === "all" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              सभी
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("weak")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1",
                statusFilter === "weak"
                  ? "bg-amber-500 text-white font-bold shadow-2xs"
                  : "text-amber-600 dark:text-amber-400 hover:text-foreground"
              )}
              title="कमजोर व लंबित टॉपिक्स देखें"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>कमजोर</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer",
                statusFilter === "pending" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              लंबित
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer",
                statusFilter === "completed" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              पूर्ण
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 1 & 2: Senior Teacher & CET (Compact Hierarchical Checklist) ─── */}
      {(activeTab === "senior-teacher" || activeTab === "cet") && (
        <div className="space-y-2.5">
          {Object.keys(groupedSections).length === 0 ? (
            <Card className="p-6 text-center rounded-xl border border-dashed border-border bg-card">
              <BookOpen className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
              <p className="text-xs sm:text-sm font-semibold text-foreground font-hindi">कोई टॉपिक नहीं मिला</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-hindi">कृपया सर्च कीवर्ड या फिल्टर बदलें।</p>
            </Card>
          ) : (
            Object.entries(groupedSections).map(([sectionName, sectionTopics]) => {
              const isCollapsed = collapsedSections[sectionName];
              const sectionTotal = sectionTopics.length;
              const sectionDone = sectionTopics.filter((t) => getTopicProgress(t).isDone).length;
              const sectionPercent = Math.round((sectionDone / sectionTotal) * 100);

              return (
                <Card key={sectionName} className="rounded-xl border border-border/80 overflow-hidden shadow-2xs bg-card">
                  {/* Section Header */}
                  <div
                    onClick={() => toggleSectionCollapse(sectionName)}
                    className="flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/70 cursor-pointer transition-colors border-b border-border/60 select-none"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground/10 text-foreground text-[11px] font-bold shrink-0">
                        §
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground font-hindi truncate">
                        {sectionName}
                      </h4>
                      <span className="text-[11px] text-muted-foreground font-hindi shrink-0">
                        ({sectionDone}/{sectionTotal} पूर्ण)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden sm:block w-16 h-1.5 bg-muted rounded-full overflow-hidden border border-border/60">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${sectionPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                        {sectionPercent}%
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Section Topics List */}
                  {!isCollapsed && (
                    <div className="divide-y divide-border/50">
                      {sectionTopics.map((topic) => {
                        const subTopics = getSubTopicsForTopic(topic);
                        const prog = getTopicProgress(topic);
                        const isExpanded = expandedTopicIds.has(topic.id);

                        return (
                          <div
                            key={topic.id}
                            className={cn(
                              "p-2.5 sm:p-3 transition-colors duration-150",
                              prog.isDone ? "bg-muted/15" : prog.isWeak ? "bg-amber-500/[0.02]" : ""
                            )}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Main Topic Checkbox */}
                              <button
                                type="button"
                                onClick={() => toggleTopic(topic.id, topic.commonKey, subTopics)}
                                className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title={prog.isDone ? "मार्क अपूर्ण करें" : "मार्क पूर्ण करें"}
                              >
                                {prog.isDone ? (
                                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Circle className="h-4.5 w-4.5 text-muted-foreground/60 hover:text-foreground" />
                                )}
                              </button>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  {topic.subSection && (
                                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-hindi">
                                      {topic.subSection}
                                    </span>
                                  )}
                                  {topic.isCommon && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] font-bold px-1.5 py-0 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 gap-0.5"
                                    >
                                      <Sparkles className="h-2.5 w-2.5" />
                                      {activeTab === "senior-teacher" ? "CET में भी" : "2nd Grade में भी"}
                                    </Badge>
                                  )}
                                  {topic.canonicalTopicId && (
                                    <Link
                                      href={`/search?q=${encodeURIComponent(topic.canonicalTopicName || "")}`}
                                      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:underline"
                                    >
                                      #{topic.canonicalTopicId} <ExternalLink className="h-2 w-2" />
                                    </Link>
                                  )}
                                  {prog.isWeak && !prog.isDone && (
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full border border-amber-500/20 font-hindi">
                                      पुनरावृत्ति जरूरी
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <p
                                    onClick={() => toggleExpandTopic(topic.id)}
                                    className={cn(
                                      "text-xs sm:text-sm font-semibold font-hindi leading-snug cursor-pointer hover:text-primary transition-colors",
                                      prog.isDone ? "text-muted-foreground line-through" : "text-foreground"
                                    )}
                                  >
                                    {topic.titleHindi}
                                  </p>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Sub-topics counter button */}
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandTopic(topic.id)}
                                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted px-2 py-0.5 rounded-md border border-border/60 transition-colors flex items-center gap-1"
                                      title="सब-टॉपिक्स / हेडिंग्स देखें"
                                    >
                                      <span>
                                        {prog.done}/{prog.total} सब-टॉपिक
                                      </span>
                                      {isExpanded ? (
                                        <ChevronUp className="h-3 w-3" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Sub-topics / Headings Hierarchy Dropdown */}
                                {isExpanded && (
                                  <div className="mt-2 pl-2 border-l-2 border-primary/20 space-y-1.5 pt-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-hindi">
                                      विस्तृत उप-विषय (Sub-Topics / Headings):
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                      {subTopics.map((st) => {
                                        const isSubDone = completedSubTopicIds.has(st.id) || prog.isDone;

                                        return (
                                          <div
                                            key={st.id}
                                            onClick={() => toggleSubTopic(st.id, topic.id, subTopics)}
                                            className={cn(
                                              "flex items-start gap-2 p-1.5 rounded-lg border text-left cursor-pointer transition-colors select-none",
                                              isSubDone
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                                                : "bg-card border-border/60 hover:border-border hover:bg-muted/30 text-muted-foreground"
                                            )}
                                          >
                                            <button type="button" className="mt-0.5 shrink-0">
                                              {isSubDone ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                              ) : (
                                                <Circle className="h-3.5 w-3.5 text-muted-foreground/60" />
                                              )}
                                            </button>
                                            <div className="min-w-0 flex-1">
                                              <p className={cn("text-[11px] font-hindi leading-tight", isSubDone && "line-through text-muted-foreground")}>
                                                {st.titleHindi}
                                              </p>
                                              {st.titleEnglish && (
                                                <span className="text-[9.5px] text-muted-foreground/80 block truncate">
                                                  {st.titleEnglish}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB 3: Merged Common Topics (Compact Synergy View) ─── */}
      {activeTab === "merged" && (
        <div className="space-y-2.5">
          <Card className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.03] text-xs font-hindi flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />
            <p className="text-muted-foreground">
              ये वे <strong className="text-foreground">{mergedList.length} प्रमुख टॉपिक्स</strong> हैं जो 2nd Grade एवं CET दोनों में 100% कॉमन हैं। इन्हें पूरा करने पर दोनों परीक्षाओं में अधिकतम स्कोर सुनिश्चित होता है।
            </p>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredMergedTopics.map((m) => {
              const isDone =
                completedTopicIds.has(m.seniorTeacherTopic.id) ||
                completedTopicIds.has(m.cetTopic.id);

              return (
                <div
                  key={m.commonKey}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all flex items-start gap-2.5 bg-card",
                    isDone ? "border-emerald-500/30 bg-muted/10" : "border-border/80 hover:border-border"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleTopic(m.seniorTeacherTopic.id, m.commonKey)}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-muted-foreground/60" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-hindi">
                        {m.categoryHindi}
                      </span>
                      {m.canonicalTopicId && (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          #{m.canonicalTopicId}
                        </span>
                      )}
                    </div>
                    <p className={cn("text-xs font-semibold font-hindi leading-tight", isDone ? "line-through text-muted-foreground" : "text-foreground")}>
                      {m.titleHindi}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-hindi leading-snug">
                      {m.coverageBenefit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 4: Master 70 Topics Architecture View ─── */}
      {activeTab === "master-75" && (
        <div className="space-y-3">
          <Card className="p-3 rounded-xl border border-border/80 bg-card text-xs font-hindi">
            <p className="text-muted-foreground">
              Quizzer2 राजस्थान GK का आधिकारिक 5 विषयों एवं 70 मास्टर टॉपिक्स का संपूर्ण पाठ्यक्रम ढांचा।
            </p>
          </Card>

          <div className="space-y-3">
            {CANONICAL_SUBJECTS.map((subject) => {
              const subjectTopics = CANONICAL_TOPICS.filter((t) => t.subjectSlug === subject.slug);

              return (
                <Card key={subject.slug} className="rounded-xl border border-border/80 overflow-hidden bg-card">
                  <div className="p-3 bg-muted/40 border-b border-border/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground font-hindi">
                        {subject.order}. {subject.nameHindi}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-hindi">
                        {subject.description}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground px-2 py-0.5 rounded-full bg-muted shrink-0">
                      {subjectTopics.length} टॉपिक्स
                    </span>
                  </div>

                  <div className="divide-y divide-border/50">
                    {subjectTopics.map((topic) => (
                      <div key={topic.id} className="p-2.5 sm:p-3 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground/10 text-foreground text-[10px] font-bold">
                              {topic.id}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-foreground font-hindi">
                              {topic.nameHindi}
                            </span>
                          </div>
                          <Link
                            href={`/search?q=${encodeURIComponent(topic.nameHindi)}`}
                            className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 shrink-0"
                          >
                            <span>प्रश्न खोजें</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>

                        {/* Subtopics pill list */}
                        <div className="flex flex-wrap gap-1.5 pl-7">
                          {topic.subTopics.map((st) => (
                            <span
                              key={st.id}
                              className="text-[10.5px] font-hindi px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/50"
                            >
                              • {st.titleHindi}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
