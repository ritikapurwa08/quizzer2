"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { MASTER_TOPICS_LIST, MasterTopicInfo } from "@/lib/pool/masterTopics";
import { getSubjectSectionIcon } from "@/components/icons/QuizzerIcons";

type StatusFilter = "all" | "completed" | "pending";

interface SyllabusTrackerProps {
  isStandalonePage?: boolean;
}

const STORAGE_KEY = "quizzer_syllabus_completed_v2";

const CANONICAL_SECTIONS = [
  { id: "all", title: "All 55 Topics", count: 55 },
  { id: "geography", title: "सामान्य ज्ञान एवं भूगोल", count: 15, match: "भूगोल" },
  { id: "history", title: "इतिहास", count: 10, match: "इतिहास" },
  { id: "culture", title: "कला एवं संस्कृति", count: 15, match: "संस्कृति" },
  { id: "polity", title: "राजव्यवस्था एवं प्रशासन", count: 15, match: "राजव्यवस्था" },
];

export function SyllabusTracker({ isStandalonePage = true }: SyllabusTrackerProps) {
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<number>>(new Set());
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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
      console.error("Failed to load syllabus progress", e);
    }
  }, []);

  // Toggle completion of a single topic
  const toggleTopic = (id: number) => {
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

  const toggleExpandTopic = (id: number) => {
    setExpandedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Overall statistics
  const totalCount = MASTER_TOPICS_LIST.length;
  const completedCount = useMemo(() => {
    return MASTER_TOPICS_LIST.filter((t) => completedTopicIds.has(t.id)).length;
  }, [completedTopicIds]);
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingCount = totalCount - completedCount;

  // Filter topics
  const filteredTopics = useMemo(() => {
    return MASTER_TOPICS_LIST.filter((topic) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchHindi = topic.nameHindi.toLowerCase().includes(query);
        const matchEng = topic.nameEnglish.toLowerCase().includes(query);
        const matchId = topic.id.toString() === query || `#${topic.id}` === query;
        if (!matchHindi && !matchEng && !matchId) return false;
      }

      // 2. Section filter
      if (selectedSection !== "all") {
        const targetSec = CANONICAL_SECTIONS.find((s) => s.id === selectedSection);
        if (targetSec?.match && !topic.subjectHindi.includes(targetSec.match)) {
          return false;
        }
      }

      // 3. Status filter
      const isDone = completedTopicIds.has(topic.id);
      if (statusFilter === "completed" && !isDone) return false;
      if (statusFilter === "pending" && isDone) return false;

      return true;
    });
  }, [searchQuery, selectedSection, statusFilter, completedTopicIds]);

  return (
    <div className="space-y-5">
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
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Syllabus Tracker
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Authoritative 55 Master Topics for RPSC Senior Teacher (2nd Grade) Paper-1.
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

      {/* 2. Preparation Progress Banner Card */}
      <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs bg-card space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Syllabus
            </span>
            <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
              55 Topics
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Completed
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-500 tabular-nums">
              {isClient ? completedCount : "—"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Remaining
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-500 tabular-nums">
              {isClient ? pendingCount : "—"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Prepared
            </span>
            <p className="text-xl sm:text-2xl font-black text-primary tabular-nums">
              {isClient ? `${progressPercent}%` : "—"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Overall Syllabus Completion</span>
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

      {/* 3. Section Selector Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CANONICAL_SECTIONS.map((sec) => {
          const isActive = selectedSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setSelectedSection(sec.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap flex items-center gap-1.5",
                isActive
                  ? "bg-foreground text-background shadow-xs font-bold"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span>{sec.title}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  isActive ? "bg-background text-foreground" : "bg-card text-muted-foreground"
                )}
              >
                {sec.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Search and Status Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-2xs">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topic by name, #ID, or keyword..."
            className="pl-9 h-9 text-xs rounded-xl bg-background border-border/80"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/60 self-start sm:self-auto shrink-0">
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

      {/* 5. Topic Checklist Items */}
      {filteredTopics.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border border-border bg-card space-y-2">
          <BookOpen className="h-8 w-8 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-semibold text-foreground">No matching syllabus topics</p>
          <p className="text-xs text-muted-foreground">Try clearing your search query or changing filters.</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredTopics.map((topic) => {
            const isDone = completedTopicIds.has(topic.id);
            const SectionIcon = getSubjectSectionIcon(topic.subjectHindi);

            return (
              <div
                key={topic.id}
                className={cn(
                  "p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card shadow-xs group",
                  isDone
                    ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                    : "border-border/80 hover:border-foreground/30"
                )}
              >
                {/* Left: Checkbox + Topic Number + Title */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer",
                      isDone
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                        : "border-border/80 hover:border-foreground/40 bg-background"
                    )}
                    aria-label={`Mark topic ${topic.id} as ${isDone ? "pending" : "completed"}`}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Circle className="h-2 w-2 text-transparent" />}
                  </button>

                  <div className="min-w-0 space-y-0.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground tabular-nums">
                        #{topic.id.toString().padStart(2, "0")}
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <SectionIcon className="h-3 w-3" />
                        {topic.subjectHindi}
                      </span>
                      {isDone && (
                        <Badge className="text-[10px] h-4.5 px-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold">
                          Completed
                        </Badge>
                      )}
                    </div>

                    <h3
                      onClick={() => toggleTopic(topic.id)}
                      className={cn(
                        "text-xs sm:text-sm font-bold text-foreground leading-snug cursor-pointer font-hindi transition-colors",
                        isDone && "line-through opacity-75"
                      )}
                    >
                      {topic.nameHindi}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate">{topic.nameEnglish}</p>
                  </div>
                </div>

                {/* Right: Quick Action Link */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl text-xs font-semibold gap-1.5 border-border hover:bg-muted"
                  >
                    <Link href={`/subjects`}>
                      <span>Practice</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
