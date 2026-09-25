"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  SENIOR_TEACHER_SYLLABUS,
  CET_SYLLABUS,
  getMergedCommonTopics,
  SyllabusTopicItem,
  MergedCommonTopic,
} from "@/lib/syllabus-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Circle,
  Search,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  GraduationCap,
  ArrowRight,
  RotateCcw,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
  Maximize2,
  Info,
  BookmarkCheck,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ExamTab = "senior-teacher" | "cet" | "merged" | "master-75";
type StatusFilter = "all" | "completed" | "pending";

interface SyllabusTrackerProps {
  initialTab?: ExamTab;
  isStandalonePage?: boolean;
}

const STORAGE_KEY = "quizzer_syllabus_completed_v1";

export function SyllabusTracker({
  initialTab = "senior-teacher",
  isStandalonePage = false,
}: SyllabusTrackerProps) {
  const [activeTab, setActiveTab] = useState<ExamTab>(initialTab);
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());
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

  // Save to localStorage when completed topics change
  const toggleTopic = (id: string, commonKey?: string) => {
    setCompletedTopicIds((prev) => {
      const next = new Set(prev);
      const isCurrentlyDone = next.has(id);

      if (isCurrentlyDone) {
        next.delete(id);
        // Also uncheck paired common topic if user wants unified sync
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
        // Also mark paired common topic as completed
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
  };

  const markAllInCurrentView = (markDone: boolean) => {
    setCompletedTopicIds((prev) => {
      const next = new Set(prev);
      const targetList =
        activeTab === "senior-teacher"
          ? SENIOR_TEACHER_SYLLABUS
          : activeTab === "cet"
          ? CET_SYLLABUS
          : getMergedCommonTopics().map((m) => m.seniorTeacherTopic);

      targetList.forEach((topic) => {
        if (markDone) {
          next.add(topic.id);
          if (topic.commonKey) {
            SENIOR_TEACHER_SYLLABUS.forEach((t) => {
              if (t.commonKey === topic.commonKey) next.add(t.id);
            });
            CET_SYLLABUS.forEach((t) => {
              if (t.commonKey === topic.commonKey) next.add(t.id);
            });
          }
        } else {
          next.delete(topic.id);
          if (topic.commonKey) {
            SENIOR_TEACHER_SYLLABUS.forEach((t) => {
              if (t.commonKey === topic.commonKey) next.delete(t.id);
            });
            CET_SYLLABUS.forEach((t) => {
              if (t.commonKey === topic.commonKey) next.delete(t.id);
            });
          }
        }
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error("Failed to save syllabus progress", e);
      }
      return next;
    });
  };

  const resetAllProgress = () => {
    if (window.confirm("क्या आप वाकई सभी टिक किए गए टॉपिक्स को रीसेट करना चाहते हैं?")) {
      setCompletedTopicIds(new Set());
      try {
        localStorage.removeItem(STORAGE_KEY);
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
      const cats = Array.from(new Set(mergedList.map((m) => m.categoryHindi)));
      return cats;
    }
    const secs = Array.from(new Set(activeDataset.map((t) => t.section)));
    return secs;
  }, [activeTab, activeDataset, mergedList]);

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
        if (!matchHindi && !matchEnglish && !matchSec && !matchSub && !matchNotes) {
          return false;
        }
      }

      // 2. Status Filter
      const isDone = completedTopicIds.has(topic.id);
      if (statusFilter === "completed" && !isDone) return false;
      if (statusFilter === "pending" && isDone) return false;

      // 3. Section Filter
      if (selectedSection !== "all" && topic.section !== selectedSection) {
        return false;
      }

      return true;
    });
  }, [activeDataset, searchQuery, statusFilter, selectedSection, completedTopicIds]);

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
      return {
        title: "RPSC वरिष्ठ अध्यापक (2nd Grade) पेपर- I",
        subtitle: "सामान्य ज्ञान एवं शैक्षिक मनोविज्ञान (कुल 100 प्रश्न / 200 अंक)",
        total: stTotal,
        completed: stCompleted,
        percent: stPercent,
        remaining: stTotal - stCompleted,
      };
    } else if (activeTab === "cet") {
      return {
        title: "RSMSSB समान पात्रता परीक्षा (CET)",
        subtitle: "स्नातक एवं सीनियर सेकेंडरी स्तर (कुल 150 प्रश्न / 300 अंक)",
        total: cetTotal,
        completed: cetCompleted,
        percent: cetPercent,
        remaining: cetTotal - cetCompleted,
      };
    } else if (activeTab === "merged") {
      return {
        title: "उभयनिष्ठ पाठ्यक्रम (2nd Grade & CET दोनों में कॉमन)",
        subtitle: "एक बार तैयार करें, दोनों परीक्षाओं में अधिकतम स्कोर सुनिश्चित करें",
        total: mergedTotal,
        completed: mergedCompleted,
        percent: mergedPercent,
        remaining: mergedTotal - mergedCompleted,
      };
    } else {
      return {
        title: "राजस्थान GK 70 मास्टर टॉपिक्स तुलना",
        subtitle: "Quizzer2 के 70 कैनोनिकल टॉपिक्स से सम्पूर्ण पाठ्यक्रम की मैपिंग",
        total: 70,
        completed: 70,
        percent: 100,
        remaining: 0,
      };
    }
  }, [activeTab, stTotal, stCompleted, stPercent, cetTotal, cetCompleted, cetPercent, mergedTotal, mergedCompleted, mergedPercent]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ─── Top Header Card ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background text-xs font-bold shrink-0">
              <GraduationCap className="h-4 w-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-hindi">
              परीक्षा पाठ्यक्रम एवं तैयारी ट्रैकर
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-hindi">
            वरिष्ठ अध्यापक (2nd Grade Paper-1) एवं CET का आधिकारिक सिलेबस, कॉमन टॉपिक्स और रियल-टाइम प्रगति।
          </p>
        </div>

        {/* View Mode Links */}
        {!isStandalonePage && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold h-8 gap-1.5 shadow-2xs border-border/80"
            >
              <Link href="/syllabus">
                विस्तृत पृष्ठ पर देखें <Maximize2 className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* ─── Primary Navigation Tabs ( वरिष्ठ अध्यापक | CET | दोनों में कॉमन | 75 मास्टर टॉपिक्स ) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* 1. Senior Teacher Tab */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("senior-teacher");
            setSelectedSection("all");
          }}
          className={cn(
            "flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none",
            activeTab === "senior-teacher"
              ? "bg-foreground text-background border-foreground shadow-sm"
              : "bg-card text-foreground border-border hover:border-foreground/40 hover:bg-muted/40"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
              RPSC 2nd Grade
            </span>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                activeTab === "senior-teacher"
                  ? "bg-background/20 text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {stPercent}% पूर्ण
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold font-hindi mt-1 line-clamp-1">
            वरिष्ठ अध्यापक (Paper-I)
          </span>
          <div className="w-full bg-muted/40 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                activeTab === "senior-teacher" ? "bg-background" : "bg-foreground"
              )}
              style={{ width: `${stPercent}%` }}
            />
          </div>
        </button>

        {/* 2. CET Tab */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("cet");
            setSelectedSection("all");
          }}
          className={cn(
            "flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none",
            activeTab === "cet"
              ? "bg-foreground text-background border-foreground shadow-sm"
              : "bg-card text-foreground border-border hover:border-foreground/40 hover:bg-muted/40"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
              RSMSSB CET
            </span>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                activeTab === "cet"
                  ? "bg-background/20 text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {cetPercent}% पूर्ण
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold font-hindi mt-1 line-clamp-1">
            समान पात्रता परीक्षा (CET)
          </span>
          <div className="w-full bg-muted/40 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                activeTab === "cet" ? "bg-background" : "bg-foreground"
              )}
              style={{ width: `${cetPercent}%` }}
            />
          </div>
        </button>

        {/* 3. Merged / Common Tab */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("merged");
            setSelectedSection("all");
          }}
          className={cn(
            "flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none",
            activeTab === "merged"
              ? "bg-foreground text-background border-foreground shadow-sm"
              : "bg-card text-foreground border-border hover:border-foreground/40 hover:bg-muted/40"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-80">
              <Sparkles className="h-3 w-3" /> दोनों में कॉमन
            </span>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                activeTab === "merged"
                  ? "bg-background/20 text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {mergedPercent}% पूर्ण
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold font-hindi mt-1 line-clamp-1">
            उभयनिष्ठ (Merge) टॉपिक्स
          </span>
          <div className="w-full bg-muted/40 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                activeTab === "merged" ? "bg-background" : "bg-foreground"
              )}
              style={{ width: `${mergedPercent}%` }}
            />
          </div>
        </button>

        {/* 4. Master 75 Topics Comparison Tab */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("master-75");
            setSelectedSection("all");
          }}
          className={cn(
            "flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none",
            activeTab === "master-75"
              ? "bg-foreground text-background border-foreground shadow-sm"
              : "bg-card text-foreground border-border hover:border-foreground/40 hover:bg-muted/40"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
              Quizzer2 Core
            </span>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                activeTab === "master-75"
                  ? "bg-background/20 text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              70 Topics
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold font-hindi mt-1 line-clamp-1">
            70 मास्टर टॉपिक्स मैपिंग
          </span>
          <div className="w-full bg-muted/40 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                activeTab === "master-75" ? "bg-background" : "bg-foreground"
              )}
              style={{ width: "100%" }}
            />
          </div>
        </button>
      </div>

      {/* ─── Overview & Progress Metrics Card ─── */}
      <Card className="p-4 sm:p-5 rounded-2xl border border-border shadow-xs bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-foreground">
                {activeTab === "senior-teacher" && "Senior Teacher"}
                {activeTab === "cet" && "CET Pattern"}
                {activeTab === "merged" && "Synergy Analysis"}
                {activeTab === "master-75" && "Canonical Mapping"}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground font-hindi">
                {activeOverview.title}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-hindi">
              {activeOverview.subtitle}
            </p>
          </div>

          {/* Quick Metrics */}
          {activeTab !== "master-75" && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/80">
                <BookmarkCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-foreground font-hindi">
                  पूर्ण: {activeOverview.completed} / {activeOverview.total}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/80">
                <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-foreground font-hindi">
                  शेष: {activeOverview.remaining} टॉपिक्स
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground text-background">
                <Flame className="h-4 w-4" />
                <span className="text-xs font-bold font-hindi">
                  {activeOverview.percent}% कवर्ड
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {activeTab !== "master-75" && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>तैयारी प्रगति (Preparation Progress)</span>
              <span className="text-foreground font-bold">{activeOverview.percent}% पूर्ण</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden border border-border/60">
              <div
                className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${activeOverview.percent}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* ─── Controls: Search & Filters (Only when viewing topics) ─── */}
      {activeTab !== "master-75" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="टॉपिक खोजें (उदा: नदियाँ, प्रजामंडल, 1857, राज्यपाल, संधि...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 h-9 text-xs sm:text-sm rounded-xl border-border bg-card font-hindi"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/80 shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
                  statusFilter === "all"
                    ? "bg-foreground text-background shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                सभी ({activeTab === "merged" ? mergedTotal : activeDataset.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
                  statusFilter === "completed"
                    ? "bg-foreground text-background shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                पूर्ण ✓ ({activeTab === "merged" ? mergedCompleted : activeOverview.completed})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
                  statusFilter === "pending"
                    ? "bg-foreground text-background shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                अपूर्ण ⏳ ({activeTab === "merged" ? mergedTotal - mergedCompleted : activeOverview.remaining})
              </button>
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllInCurrentView(true)}
                className="h-9 px-2.5 text-xs rounded-xl font-semibold gap-1 border-border/80 hover:bg-muted"
                title="वर्तमान सूची के सभी टॉपिक्स को पूर्ण मार्क करें"
              >
                <CheckCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">सब पूर्ण</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllInCurrentView(false)}
                className="h-9 px-2.5 text-xs rounded-xl font-semibold gap-1 border-border/80 hover:bg-muted"
                title="वर्तमान सूची के सभी टॉपिक्स को अनचेक करें"
              >
                <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">सब अनचेक</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllProgress}
                className="h-9 px-2 text-xs rounded-xl text-destructive hover:bg-destructive/10"
                title="पूरी प्रगति रीसेट करें"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Section Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 shrink-0 mr-1 uppercase">
              <Filter className="h-3 w-3" /> विषय:
            </span>
            <button
              type="button"
              onClick={() => setSelectedSection("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0",
                selectedSection === "all"
                  ? "bg-foreground text-background"
                  : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
              )}
            >
              सभी खंड (All)
            </button>
            {availableSections.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSection(sec)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 font-hindi",
                  selectedSection === sec
                    ? "bg-foreground text-background"
                    : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                )}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 1 & 2: Senior Teacher & CET Checklists ─── */}
      {(activeTab === "senior-teacher" || activeTab === "cet") && (
        <div className="space-y-4">
          {Object.keys(groupedSections).length === 0 ? (
            <Card className="p-8 text-center rounded-2xl border border-dashed border-border">
              <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground font-hindi">
                कोई टॉपिक नहीं मिला
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-hindi">
                कृपया सर्च कीवर्ड या फिल्टर बदल कर पुनः प्रयास करें।
              </p>
            </Card>
          ) : (
            Object.entries(groupedSections).map(([sectionName, sectionTopics]) => {
              const isCollapsed = collapsedSections[sectionName];
              const sectionTotal = sectionTopics.length;
              const sectionDone = sectionTopics.filter((t) => completedTopicIds.has(t.id)).length;
              const sectionPercent = Math.round((sectionDone / sectionTotal) * 100);

              return (
                <Card
                  key={sectionName}
                  className="rounded-2xl border border-border overflow-hidden shadow-2xs bg-card"
                >
                  {/* Section Collapsible Header */}
                  <div
                    onClick={() => toggleSectionCollapse(sectionName)}
                    className="flex items-center justify-between p-3.5 sm:p-4 bg-muted/40 hover:bg-muted/70 cursor-pointer transition-colors border-b border-border/60 select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground/10 text-foreground text-xs font-bold shrink-0">
                        {sectionTopics[0]?.subSection ? "§" : "•"}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground font-hindi truncate">
                          {sectionName}
                        </h4>
                        <span className="text-[11px] text-muted-foreground font-hindi">
                          {sectionDone} / {sectionTotal} पूर्ण ({sectionPercent}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Section Progress Mini Bar */}
                      <div className="hidden sm:block w-20 h-2 bg-muted rounded-full overflow-hidden border border-border/60">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${sectionPercent}%` }}
                        />
                      </div>
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Section Topics List */}
                  {!isCollapsed && (
                    <div className="divide-y divide-border/50">
                      {sectionTopics.map((topic, index) => {
                        const isDone = completedTopicIds.has(topic.id);

                        return (
                          <div
                            key={topic.id}
                            className={cn(
                              "p-3 sm:p-3.5 flex items-start gap-3 hover:bg-muted/30 transition-colors duration-150",
                              isDone && "bg-muted/15"
                            )}
                          >
                            {/* Interactive Checkbox */}
                            <button
                              type="button"
                              onClick={() => toggleTopic(topic.id, topic.commonKey)}
                              className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title={isDone ? "मार्क अपूर्ण करें" : "मार्क पूर्ण करें"}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 transition-transform active:scale-90" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground/60 hover:text-foreground transition-transform active:scale-90" />
                              )}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                {topic.subSection && (
                                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-hindi">
                                    {topic.subSection}
                                  </span>
                                )}

                                {/* Common Overlap Badge */}
                                {topic.isCommon ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-bold px-1.5 py-0 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 gap-1"
                                  >
                                    <Sparkles className="h-2.5 w-2.5" />
                                    {activeTab === "senior-teacher" ? "CET में भी शामिल" : "2nd Grade में भी शामिल"}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-medium px-1.5 py-0 text-muted-foreground"
                                  >
                                    {activeTab === "senior-teacher" ? "2nd Grade विशेष" : "CET विशेष"}
                                  </Badge>
                                )}

                                {/* 75 Master Topic Link Badge */}
                                {topic.canonicalTopicId && (
                                  <Link
                                    href={`/search?q=${encodeURIComponent(topic.canonicalTopicName || "")}`}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:underline"
                                    title="Quizzer2 के 75 मास्टर टॉपिक में प्रश्न खोजें"
                                  >
                                    Topic #{topic.canonicalTopicId} <ExternalLink className="h-2.5 w-2.5" />
                                  </Link>
                                )}
                              </div>

                              <p
                                className={cn(
                                  "text-xs sm:text-sm font-semibold font-hindi transition-colors",
                                  isDone
                                    ? "text-muted-foreground line-through decoration-muted-foreground/50"
                                    : "text-foreground"
                                )}
                              >
                                {topic.titleHindi}
                              </p>

                              {topic.commonNotes && (
                                <p className="text-[11px] text-muted-foreground/80 font-hindi mt-0.5">
                                  💡 {topic.commonNotes}
                                </p>
                              )}
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

      {/* ─── TAB 3: Merged / Common Topics (Overlap Analysis) ─── */}
      {activeTab === "merged" && (
        <div className="space-y-4">
          {/* Informational Callout */}
          <Card className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-foreground space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <h4 className="text-xs sm:text-sm font-bold font-hindi">
                उभयनिष्ठ पाठ्यक्रम विश्लेषण (Smart Preparation Synergy)
              </h4>
            </div>
            <p className="text-xs text-muted-foreground font-hindi leading-relaxed">
              नीचे वे सभी टॉपिक्स हैं जो **RPSC वरिष्ठ अध्यापक (Paper-I)** और **RSMSSB CET** दोनों में समान रूप से पूछे जाते हैं। 
              यदि आप इन टॉपिक्स को गहराई से तैयार कर लेते हैं, तो आपकी दोनों परीक्षाओं का राजस्थान GK, समसामयिकी व भारत भूगोल/राजव्यवस्था एक साथ तैयार हो जाता है!
            </p>
          </Card>

          {/* List of Merged Common Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredMergedTopics.map((item) => {
              const isDone =
                completedTopicIds.has(item.seniorTeacherTopic.id) ||
                completedTopicIds.has(item.cetTopic.id);

              return (
                <Card
                  key={item.commonKey}
                  className={cn(
                    "p-3.5 sm:p-4 rounded-2xl border border-border bg-card transition-all duration-150 flex flex-col justify-between gap-3 shadow-2xs hover:border-foreground/30",
                    isDone && "bg-muted/20 border-emerald-500/30"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground font-hindi">
                          {item.categoryHindi}
                        </span>
                        <h4
                          className={cn(
                            "text-xs sm:text-sm font-bold font-hindi",
                            isDone ? "text-muted-foreground line-through" : "text-foreground"
                          )}
                        >
                          {item.titleHindi}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleTopic(item.seniorTeacherTopic.id, item.commonKey)}
                        className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        title={isDone ? "मार्क अपूर्ण करें" : "मार्क पूर्ण करें"}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/60" />
                        )}
                      </button>
                    </div>

                    {/* Where it appears in each exam */}
                    <div className="space-y-1 text-[11px] text-muted-foreground font-hindi bg-muted/40 p-2 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground shrink-0">🎯 2nd Grade:</span>
                        <span className="truncate">{item.seniorTeacherTopic.section}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground shrink-0">📋 CET:</span>
                        <span className="truncate">{item.cetTopic.section}</span>
                      </div>
                    </div>
                  </div>

                  {/* Benefit & Master Topic Mapping */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px]">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-hindi">
                      ✓ दोनों परीक्षाओं में लाभ
                    </span>
                    {item.canonicalTopicId && (
                      <Link
                        href={`/search?q=${encodeURIComponent(item.canonicalTopicName || "")}`}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
                      >
                        Master Topic #{item.canonicalTopicId} <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 4: 75 Canonical Master Topics Mapping ─── */}
      {activeTab === "master-75" && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-foreground" />
              <h4 className="text-sm sm:text-base font-bold text-foreground font-hindi">
                Quizzer2 के 70 मास्टर टॉपिक्स से तुलना एवं विश्लेषण
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-hindi leading-relaxed">
              Quizzer2 का प्रश्न बैंक **राजस्थान सामान्य ज्ञान के 70 कैनोनिकल मास्टर टॉपिक्स** पर आधारित है। 
              नीचे दिया गया विश्लेषण दर्शाता है कि वरिष्ठ अध्यापक (2nd Grade) और CET के कौन-से भाग 70 मास्टर टॉपिक्स द्वारा 100% कवर्ड हैं, और कौन-से अतिरिक्त विषय अलग से तैयार करने होते हैं।
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Coverage in Senior Teacher */}
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 font-hindi">
                    वरिष्ठ अध्यापक (2nd Grade) में कवरेज
                  </span>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                    खंड- I (80 अंक) पूर्ण कवर्ड
                  </Badge>
                </div>
                <ul className="text-xs text-muted-foreground font-hindi space-y-1 list-disc list-inside">
                  <li><strong>राजस्थान भूगोल (11 टॉपिक्स):</strong> 70 मास्टर टॉपिक्स में 100% समाहित।</li>
                  <li><strong>राजस्थान इतिहास व राजवंश:</strong> मेवाड़, मारवाड़, आमेर, चौहान, गुर्जर-प्रतिहार आदि पूर्ण कवर्ड।</li>
                  <li><strong>कला, संस्कृति व साहित्य:</strong> मेले, त्योहार, लोक देवता, मंदिर, छतरियां, चित्रकला आदि पूर्ण कवर्ड।</li>
                  <li><strong>राजस्थान राजव्यवस्था व आयोग:</strong> राज्यपाल, सीएम, RPSC, लोकायुक्त, पंचायती राज पूर्ण कवर्ड।</li>
                  <li><strong>अतिरिक्त विषय (गैर-राजस्थान):</strong> विश्व भूगोल, भारत संविधान, भारत भूगोल, शैक्षिक मनोविज्ञान।</li>
                </ul>
              </div>

              {/* Coverage in CET */}
              <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300 font-hindi">
                    RSMSSB CET में कवरेज
                  </span>
                  <Badge variant="secondary" className="text-[10px] bg-blue-500/20 text-blue-800 dark:text-blue-200">
                    राजस्थान GK भाग 100% कवर्ड
                  </Badge>
                </div>
                <ul className="text-xs text-muted-foreground font-hindi space-y-1 list-disc list-inside">
                  <li><strong>राजस्थान इतिहास, कला व संस्कृति:</strong> CET का 100% राजस्थान भाग 70 मास्टर टॉपिक्स से मिलता है।</li>
                  <li><strong>राजस्थान भूगोल, खनिज, सिंचाई व उद्योग:</strong> 70 मास्टर टॉपिक्स द्वारा पूरी तरह कवर्ड।</li>
                  <li><strong>राजस्थान की राजनीतिक व्यवस्था:</strong> 70 मास्टर टॉपिक्स (विषय E) द्वारा पूर्ण कवर्ड।</li>
                  <li><strong>अतिरिक्त विषय:</strong> दैनिक विज्ञान, रीजनिंग/गणित, सामान्य हिन्दी, General English, कंप्यूटर।</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-hindi">
                अभ्यास के लिए Quizzer2 के मुख्य विषयों पर जाएं:
              </span>
              <Button asChild size="sm" className="rounded-xl text-xs font-semibold h-8 gap-1">
                <Link href="/subjects">
                  सभी 5 मुख्य विषय देखें <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
