"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, RotateCcw } from "lucide-react";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";
import {
  type StatusFilter,
  type SyllabusScope,
  STORAGE_KEY,
  RAJASTHAN_GK_SECTIONS,
  ENGLISH_SECTIONS,
} from "./syllabusTypes";
import { SyllabusProgressBanner } from "./SyllabusProgressBanner";
import { SyllabusFilterControls } from "./SyllabusFilterControls";
import { TopicChecklistItem } from "./TopicChecklistItem";

interface SyllabusTrackerProps {
  isStandalonePage?: boolean;
}

export function SyllabusTracker({ isStandalonePage = true }: SyllabusTrackerProps) {
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<number>>(new Set());
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scope, setScope] = useState<SyllabusScope>("rajasthan_gk");
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
          setCompletedTopicIds(new Set(parsed.map(Number)));
        }
      }
    } catch (e) {
      console.error("Failed to load syllabus progress", e);
    }
  }, []);

  // When changing scope, reset section filter to "all"
  const handleScopeChange = (newScope: SyllabusScope) => {
    setScope(newScope);
    setSelectedSection("all");
  };

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

  const handleConfirmReset = () => {
    setCompletedTopicIds(new Set());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear syllabus progress", e);
    }
    setConfirmResetOpen(false);
  };

  // Topics within the currently selected scope
  const scopedTopics = useMemo(() => {
    if (scope === "rajasthan_gk") {
      return MASTER_TOPICS_LIST.filter((t) => t.id <= 55);
    }
    if (scope === "english") {
      return MASTER_TOPICS_LIST.filter((t) => t.id > 55);
    }
    return MASTER_TOPICS_LIST;
  }, [scope]);

  // Overall statistics for the selected scope
  const totalCount = scopedTopics.length;
  const completedCount = useMemo(() => {
    return scopedTopics.filter((t) => completedTopicIds.has(t.id)).length;
  }, [scopedTopics, completedTopicIds]);
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingCount = totalCount - completedCount;

  // Active section tabs based on scope
  const sectionTabs = useMemo(() => {
    if (scope === "rajasthan_gk") return RAJASTHAN_GK_SECTIONS;
    if (scope === "english") return ENGLISH_SECTIONS;
    return [{ id: "all", title: "All 88 Topics", count: 88 }];
  }, [scope]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return scopedTopics.filter((topic) => {
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
        if (scope === "rajasthan_gk") {
          const targetSec = RAJASTHAN_GK_SECTIONS.find((s) => s.id === selectedSection);
          if (targetSec?.match && !topic.subjectHindi.includes(targetSec.match)) {
            return false;
          }
        } else if (scope === "english") {
          const targetSec = ENGLISH_SECTIONS.find((s) => s.id === selectedSection);
          if (targetSec?.minId && targetSec?.maxId) {
            if (topic.id < targetSec.minId || topic.id > targetSec.maxId) {
              return false;
            }
          }
        }
      }

      // 3. Status filter
      const isDone = completedTopicIds.has(topic.id);
      if (statusFilter === "completed" && !isDone) return false;
      if (statusFilter === "pending" && isDone) return false;

      return true;
    });
  }, [scopedTopics, searchQuery, selectedSection, statusFilter, completedTopicIds, scope]);

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
                Authoritative Master Topics tracking for RPSC Senior Teacher (2nd Grade).
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmResetOpen(true)}
              className="rounded-xl text-xs font-semibold h-8.5 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset Progress
            </Button>
          </div>
        </div>
      )}

      {/* 2. Filters & Switchers */}
      <SyllabusFilterControls
        scope={scope}
        onScopeChange={handleScopeChange}
        sectionTabs={sectionTabs}
        selectedSection={selectedSection}
        onSelectSection={setSelectedSection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* 3. Preparation Progress Banner Card */}
      <SyllabusProgressBanner
        scope={scope}
        totalCount={totalCount}
        completedCount={completedCount}
        pendingCount={pendingCount}
        progressPercent={progressPercent}
        isClient={isClient}
      />

      {/* 4. Topic Checklist Items */}
      {filteredTopics.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border border-border bg-card space-y-2">
          <BookOpen className="h-8 w-8 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-semibold text-foreground">No matching syllabus topics</p>
          <p className="text-xs text-muted-foreground">Try clearing your search query or changing filters.</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredTopics.map((topic) => (
            <TopicChecklistItem
              key={topic.id}
              topic={topic}
              isDone={completedTopicIds.has(topic.id)}
              onToggle={toggleTopic}
            />
          ))}
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={confirmResetOpen}
        onOpenChange={setConfirmResetOpen}
        title="Reset Syllabus Progress?"
        description="Are you sure you want to reset all tracked topics? All marked completions and progress will be cleared."
        onConfirm={handleConfirmReset}
        confirmLabel="Yes, Reset All"
        variant="destructive"
      />
    </div>
  );
}
