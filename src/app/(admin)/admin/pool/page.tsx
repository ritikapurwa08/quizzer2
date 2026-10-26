"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Database,
  Layers,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Info,
  ShieldCheck,
  Sparkles,
  PieChart,
  HelpCircle,
  FolderTree,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Subtopic {
  name: string;
  count: number;
}

interface TestSetInfo {
  id: string;
  name: string;
  order: number;
  count: number;
}

interface TopicOverviewItem {
  id: number;
  name: string;
  nameHindi: string;
  subjectId: string;
  subjectTitle: string;
  subjectEnglish: string;
  poolTotal: number;
  liveSetsCount: number;
  liveQuestionsCount: number;
  uniqueUsed: number;
  remaining: number;
  percentComplete: number;
  subtopics: Subtopic[];
  sets: TestSetInfo[];
}

interface OverviewData {
  summary: {
    totalMasterTopics: number;
    totalSubjects: number;
    totalPoolQuestions: number;
    totalLiveQuestions: number;
    totalLiveSets: number;
    totalUniqueUsed: number;
    totalRemaining: number;
    totalDuplicatesInDb: number;
    duplicateReport: Array<{
      topicId: string;
      topicHindi: string;
      duplicateCount: number;
      setsAffected: string[];
    }>;
  };
  topics: TopicOverviewItem[];
  sections: Array<{
    id: string;
    title: string;
    titleEnglish: string;
    topicCount: number;
  }>;
}

export default function AdminPoolOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in_progress" | "not_started">("all");
  const [sortBy, setSortBy] = useState<"id_asc" | "id_desc" | "pool_desc" | "remaining_desc" | "progress_desc">("id_asc");

  // Expanded card states
  const [expandedTopicId, setExpandedTopicId] = useState<number | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showContractInfo, setShowContractInfo] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pool-overview");
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load pool data");
      setData(json);
    } catch (err: any) {
      console.error("Failed to fetch pool overview:", err);
      setError(err.message || "Failed to load pool overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Filtered and Sorted Topics
  const topics = data?.topics;
  const filteredTopics = useMemo(() => {
    if (!topics) return [];

    let list = [...topics];

    // Subject Filter
    if (selectedSubject !== null) {
      list = list.filter((t) => t.subjectId === selectedSubject);
    }

    // Status Filter
    if (statusFilter === "completed") {
      list = list.filter((t) => t.percentComplete === 100);
    } else if (statusFilter === "in_progress") {
      list = list.filter((t) => t.percentComplete > 0 && t.percentComplete < 100);
    } else if (statusFilter === "not_started") {
      list = list.filter((t) => t.percentComplete === 0);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.nameHindi.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          String(t.id) === q ||
          `topic ${t.id}`.includes(q) ||
          t.subtopics.some((s) => s.name.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case "id_asc":
          return a.id - b.id;
        case "id_desc":
          return b.id - a.id;
        case "pool_desc":
          return b.poolTotal - a.poolTotal;
        case "remaining_desc":
          return b.remaining - a.remaining;
        case "progress_desc":
          return b.percentComplete - a.percentComplete || b.poolTotal - a.poolTotal;
        default:
          return a.id - b.id;
      }
    });

    return list;
  }, [topics, selectedSubject, statusFilter, searchQuery, sortBy]);

  if (loading && !data) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-72 bg-muted/70 rounded-lg animate-pulse" />
            <div className="h-4 w-96 bg-muted/50 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted/40 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-muted/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="p-3 w-14 h-14 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Unable to Load Data</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchOverview} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { summary } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              RPSC 2nd Grade Syllabus
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {summary.totalMasterTopics} Canonical Topics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Database className="h-7 w-7 text-primary" />
            Question Pool & Inventory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Master pool ({summary.totalPoolQuestions.toLocaleString()} questions), live test sets, and official topic inventory dashboard
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={loading}
            className="text-xs h-9 gap-1.5 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/admin/import">
            <Button size="sm" className="text-xs h-9 gap-1.5 rounded-xl shadow-xs cursor-pointer">
              <PlusCircle className="h-4 w-4" />
              Import New Set
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Pool */}
        <Card className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Master Pool (Total)
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-foreground tabular-nums">
              {summary.totalPoolQuestions.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Across 55 canonical topics</p>
          </div>
        </Card>

        {/* Card 2: Live in DB */}
        <Card className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Live Test Sets
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-foreground tabular-nums">
              {summary.totalLiveSets} <span className="text-sm font-semibold text-muted-foreground">Sets</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {summary.totalLiveQuestions.toLocaleString()} questions in database
            </p>
          </div>
        </Card>

        {/* Card 3: Unique Used */}
        <Card className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Unique Questions Imported
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-500 tabular-nums">
              {summary.totalUniqueUsed.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {Math.round((summary.totalUniqueUsed / summary.totalPoolQuestions) * 100)}% master pool deployed
            </p>
          </div>
        </Card>

        {/* Card 4: Remaining Pool */}
        <Card className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Unused Questions (In Pool)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-foreground tabular-nums">
              {summary.totalRemaining.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              ~{Math.round(summary.totalRemaining / 20)} new sets available
            </p>
          </div>
        </Card>

        {/* Card 5: Duplicates Alert */}
        <Card
          onClick={() => setShowDuplicateModal(true)}
          className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] ${
            summary.totalDuplicatesInDb > 0
              ? "bg-destructive/5 border-destructive/30 hover:border-destructive/60"
              : "bg-emerald-500/5 border-emerald-500/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Duplicate Status
            </span>
            <div
              className={`p-2 rounded-xl ${
                summary.totalDuplicatesInDb > 0
                  ? "bg-destructive/10 text-destructive"
                  : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-2xl sm:text-3xl font-black tabular-nums ${
                summary.totalDuplicatesInDb > 0 ? "text-destructive" : "text-emerald-500"
              }`}
            >
              {summary.totalDuplicatesInDb}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 font-medium underline">
              View Audit Details <ChevronRight className="h-3 w-3" />
            </p>
          </div>
        </Card>
      </div>

      {/* ── Explanation Notice Card (Integrity & Syllabus Contract) ── */}
      <Card className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/5 via-card to-background border border-primary/20 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Syllabus Integrity Contract & Topic Audit
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContractInfo(!showContractInfo)}
                className="text-xs h-7 px-2 text-primary hover:text-primary hover:bg-primary/10"
              >
                {showContractInfo ? "Collapse" : "View Details"}
                <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${showContractInfo ? "rotate-180" : ""}`} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All 15,949 questions are organized across 55 master topics strictly aligned with the official RPSC 2nd Grade syllabus contract. Clutter, science & tech, and extraneous budget topics have been eliminated.
            </p>

            {showContractInfo && (
              <div className="mt-3 pt-3 border-t border-border/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground animate-in fade-in-50 duration-200">
                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <span className="font-bold text-foreground block mb-1">
                    1. Topic 1 (General Knowledge) vs Topic 8 (Wildlife)
                  </span>
                  Topic 1 contains only official Rajasthan state symbols and district mascots. National parks, sanctuaries, and conservation reserves are strictly organized under Topic 8.
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <span className="font-bold text-foreground block mb-1">
                    2. Topic 2 Pool Size (1,075 Questions)
                  </span>
                  Physical Geography is the most extensive section (Physical Features 574 Qs + Characteristics 159 Qs + Borders 148 Qs + Desertification 98 Qs + Districts & Divisions 96 Qs), yielding ~54 sets.
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <span className="font-bold text-foreground block mb-1">
                    3. Rationalization from 73 to 55 Topics
                  </span>
                  Nine scattered Rajput dynasties have been unified under official syllabus Topic 17 (Rajput Dynasties & Administration). Extraneous non-GK content has been eliminated.
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Subject Filter Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedSubject(null)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedSubject === null
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          All {summary.totalMasterTopics} Topics ({summary.totalPoolQuestions.toLocaleString()} Qs)
        </button>

        {data.sections.map((sec) => {
          const isActive = selectedSubject === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setSelectedSubject(sec.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{sec.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {sec.topicCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search, Filter & Sort Controls Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-2xl shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic name, sub-topic, or topic number..."
            className="pl-9 h-9 text-xs rounded-xl border-border bg-background"
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

        {/* Filters and Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val: string | null) => val && setStatusFilter(val as any)}
          >
            <SelectTrigger className="h-9 px-3 rounded-xl border border-border bg-card text-xs font-medium min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed (100%)</SelectItem>
              <SelectItem value="in_progress">In Progress (&gt;0%)</SelectItem>
              <SelectItem value="not_started">Not Started (0%)</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            value={sortBy}
            onValueChange={(val: string | null) => val && setSortBy(val as any)}
          >
            <SelectTrigger className="h-9 px-3 rounded-xl border border-border bg-card text-xs font-medium min-w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="id_asc">Topic # (1 to 55)</SelectItem>
              <SelectItem value="id_desc">Topic # (55 to 1)</SelectItem>
              <SelectItem value="pool_desc">Largest Pool (Questions)</SelectItem>
              <SelectItem value="remaining_desc">Most Unused Questions</SelectItem>
              <SelectItem value="progress_desc">Completion Progress (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Topic Cards Grid ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Displayed Topics: <strong>{filteredTopics.length}</strong> / 55
          </span>
          <span>Click topic to view subtopic breakdown & test sets</span>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border p-6 space-y-2">
            <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">No topics found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          filteredTopics.map((topic) => {
            const isExpanded = expandedTopicId === topic.id;
            const hasDuplicates = summary.duplicateReport?.some(
              (d) => d.topicHindi.trim() === topic.nameHindi.trim()
            );

            return (
              <Card
                key={topic.id}
                className={`overflow-hidden transition-all duration-200 border rounded-2xl ${
                  isExpanded
                    ? "border-primary/50 shadow-md bg-card ring-1 ring-primary/20"
                    : "border-border/80 hover:border-foreground/30 hover:shadow-xs bg-card"
                }`}
              >
                {/* Main Card Header / Bar */}
                <div
                  onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
                >
                  {/* Left: ID & Title */}
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-muted text-foreground text-xs font-black shrink-0 border border-border/80">
                      #{topic.id.toString().padStart(2, "0")}
                    </span>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {topic.subjectTitle}
                        </span>
                        {hasDuplicates && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                            Duplicates Flagged
                          </Badge>
                        )}
                        {topic.percentComplete === 100 && (
                          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-500 hover:bg-emerald-600 text-white">
                            100% Complete
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-foreground leading-snug truncate">
                        {topic.nameHindi}
                      </h3>
                      <p className="text-[11px] text-muted-foreground truncate">{topic.name}</p>
                    </div>
                  </div>

                  {/* Right: Metrics & Progress */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                    {/* Compact Metrics Pills */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block font-medium">Pool</span>
                        <strong className="text-foreground tabular-nums">{topic.poolTotal}</strong>
                      </div>

                      <div className="h-6 w-px bg-border/80" />

                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block font-medium">Live Sets</span>
                        <strong className="text-foreground tabular-nums">
                          {topic.liveSetsCount} <span className="text-[10px] text-muted-foreground">({topic.liveQuestionsCount} Qs)</span>
                        </strong>
                      </div>

                      <div className="h-6 w-px bg-border/80" />

                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block font-medium">Unused Qs</span>
                        <strong
                          className={`tabular-nums ${
                            topic.remaining > 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"
                          }`}
                        >
                          {topic.remaining}
                        </strong>
                      </div>
                    </div>

                    {/* Progress Bar & Toggle */}
                    <div className="flex items-center gap-2">
                      <div className="w-20 sm:w-24 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            topic.percentComplete === 100
                              ? "bg-emerald-500"
                              : topic.percentComplete > 50
                              ? "bg-primary"
                              : topic.percentComplete > 0
                              ? "bg-amber-500"
                              : "bg-transparent"
                          }`}
                          style={{ width: `${topic.percentComplete}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground tabular-nums w-8 text-right">
                        {topic.percentComplete}%
                      </span>

                      <div className="p-1 rounded-lg text-muted-foreground">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="border-t border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-150">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left: Subtopic Sources Breakdown */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <FolderTree className="h-3.5 w-3.5 text-primary" />
                          Subtopic Question Sources
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {topic.subtopics.map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card border border-border text-xs text-foreground shadow-2xs font-medium"
                            >
                              <span>{sub.name}</span>
                              <span className="px-1.5 py-0.2 rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                                {sub.count} Qs
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Live Sets in DB */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-blue-500" />
                            Live Sets ({topic.sets.length} Sets)
                          </h4>
                          <span className="text-[11px] text-muted-foreground">
                            Unique Qs: {topic.uniqueUsed} / {topic.poolTotal}
                          </span>
                        </div>

                        {topic.sets.length === 0 ? (
                          <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground text-center">
                            No test sets have been imported for this topic yet.
                          </div>
                        ) : (
                          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                            {topic.sets.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 text-xs"
                              >
                                <span className="font-medium text-foreground truncate pr-2">{s.name}</span>
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 shrink-0">
                                  {s.count} Qs
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/70">
                      <div className="text-xs text-muted-foreground">
                        {topic.remaining > 0 ? (
                          <span>
                            <strong>{topic.remaining}</strong> questions remaining in pool (~
                            {Math.ceil(topic.remaining / 20)} sets available)
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Topic is 100% imported!
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {topic.remaining > 0 && (
                          <Link href={`/admin/import?masterTopicId=${topic.id}`}>
                            <Button size="sm" className="h-8 text-xs gap-1.5 rounded-xl cursor-pointer">
                              <PlusCircle className="h-3.5 w-3.5" />
                              Import Next Set
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ── Duplicates Audit Modal ── */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Duplicate Questions Audit Report</h3>
                  <p className="text-xs text-muted-foreground">
                    A total of 200 duplicate questions were flagged in legacy imports (52 topics have 0 duplicates).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <div className="p-3.5 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-2">
                <span className="font-bold text-destructive block text-sm">
                  1. Topic 2 (Physical Geography) — 100 duplicates
                </span>
                <p>
                  <strong>Cause:</strong> Previously uploaded Parts 1 to 5 (100 Qs) were re-uploaded in legacy runs as Parts 6 to 11. Parts 12 through 32 are 100% fresh and unique.
                </p>
                <p className="text-foreground">
                  <strong>Resolution:</strong> Candidate set generator was updated to strictly exclude previously used questions.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <span className="font-bold text-amber-500 block text-sm">
                  2. Topic 6 (Drainage & Lakes) — 80 duplicates
                </span>
                <p>
                  <strong>Cause:</strong> 80 questions overlap between legacy sets <em>&quot;Rajasthan Rivers &amp; Water Resources Parts 1-4&quot;</em> and current sets <em>&quot;Rajasthan Drainage System, Rivers &amp; Lakes Parts 1-6&quot;</em>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted border border-border/80 space-y-1">
                <span className="font-bold text-foreground block text-sm">
                  3. Topic 27 (Festivals) — 20 duplicates
                </span>
                <p>20 questions overlap between Part 3 and Parts 1-2.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-500">
                <span className="font-bold block text-sm">
                  ✓ Remaining 52 Topics: 0 Duplicates (100% Clean)
                </span>
                <p className="text-muted-foreground mt-0.5">
                  All remaining 52 topics have zero duplication; all questions are unique.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowDuplicateModal(false)} className="rounded-xl text-xs cursor-pointer">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
