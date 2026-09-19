"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import {
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ArrowRight,
  Filter,
  Check,
  RotateCcw,
  SlidersHorizontal,
  FileQuestion,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function QuestionPoolDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const topicSummaries = useQuery(api.pool.listTopicSummaries) ?? [];
  const setAllowFinalBelow20 = useMutation(api.pool.setAllowFinalBelow20);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Exam preference state per topic or globally
  const [examPreference, setExamPreference] = useState<"all" | "prefer_exam" | "limit_exam">("all");
  const [examLimit, setExamLimit] = useState<number>(15);

  // Derive subjects list
  const subjects = useMemo(() => {
    const set = new Set<string>();
    for (const t of topicSummaries) {
      if (t.subjectNameHindi) set.add(t.subjectNameHindi);
    }
    return Array.from(set);
  }, [topicSummaries]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    let totalQuestions = 0;
    let totalAvailable = 0;
    let totalUsed = 0;
    let totalRequeued = 0;
    let totalCompletedTopics = 0;

    for (const t of topicSummaries) {
      totalQuestions += t.total;
      totalAvailable += t.available;
      totalUsed += t.used;
      totalRequeued += t.requeued;
      if (t.status === "COMPLETED") totalCompletedTopics++;
    }

    return {
      totalQuestions,
      totalAvailable,
      totalUsed,
      totalRequeued,
      totalCompletedTopics,
      totalTopics: topicSummaries.length,
    };
  }, [topicSummaries]);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    return topicSummaries.filter((t) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchesName = t.masterTopic.toLowerCase().includes(term);
        const matchesSubject = (t.subjectNameHindi || "").toLowerCase().includes(term);
        const matchesId = String(t.masterTopicId) === term;
        if (!matchesName && !matchesSubject && !matchesId) return false;
      }
      // Subject filter
      if (selectedSubject !== "all" && t.subjectNameHindi !== selectedSubject) {
        return false;
      }
      // Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [topicSummaries, searchTerm, selectedSubject, statusFilter]);

  async function handleToggleFinalSet(masterTopicId: number, currentAllow: boolean, available: number) {
    if (available >= 20 && !currentAllow) {
      showToast("Final Set < 20 केवल तभी सक्षम किया जा सकता है जब टॉपिक में 20 से कम प्रश्न शेष हों।", "warning");
      return;
    }
    try {
      await setAllowFinalBelow20({
        masterTopicId,
        allow: !currentAllow,
      });
      showToast(
        !currentAllow
          ? "Final Set (<20) अनुमति सक्षम की गई।"
          : "Final Set (<20) अनुमति अक्षम की गई।",
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Failed to update Final Set permission.", "warning");
    }
  }

  function handleOpenImporter(masterTopicId: number, topicName: string) {
    router.push(
      `/admin/import?masterTopicId=${masterTopicId}&topic=${encodeURIComponent(
        topicName
      )}&examPref=${examPreference}&examLimit=${examLimit}`
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Top Hero / Statistics Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="rounded-2xl border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Total Questions In Pool</p>
              <p className="text-xl font-bold tracking-tight text-foreground">
                {aggregateStats.totalQuestions.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/10 text-success">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Available Questions</p>
              <p className="text-xl font-bold tracking-tight text-foreground">
                {aggregateStats.totalAvailable.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent text-accent-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Used In Sets</p>
              <p className="text-xl font-bold tracking-tight text-foreground">
                {aggregateStats.totalUsed.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/10 text-warning">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Requeued Questions</p>
              <p className="text-xl font-bold tracking-tight text-foreground">
                {aggregateStats.totalRequeued.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Global Candidate / Exam Preference Controls ── */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold tracking-tight">
                Candidate Queue Settings & Exam Controls
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs font-normal">
              Candidate Window: 25–30 Questions → Final Set: Exactly 20
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-muted-foreground block mb-1.5">
              Exam Question Preference (परीक्षा प्रश्न प्राथमिकता)
            </label>
            <select
              value={examPreference}
              onChange={(e) => setExamPreference(e.target.value as any)}
              className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-ring"
            >
              <option value="all">Automatic (Standard Queue Order / सामान्य क्रम)</option>
              <option value="prefer_exam">Prefer Exam Questions (परीक्षा प्रश्नों को प्राथमिकता दें)</option>
              <option value="limit_exam">Limit Exam Questions (परीक्षा प्रश्नों की संख्या सीमित करें)</option>
            </select>
          </div>

          {examPreference === "limit_exam" && (
            <div>
              <label className="font-semibold text-muted-foreground block mb-1.5">
                Max Exam Questions per Window (अधिकतम परीक्षा प्रश्न)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={examLimit}
                onChange={(e) => setExamLimit(parseInt(e.target.value, 10) || 15)}
                className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div className="flex flex-col justify-end">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              💡 <strong>Candidate Buffer:</strong> प्रत्येक अनुरोध पर पूल से 25–30 प्रश्न प्राप्त होते हैं। Gemini द्वारा पुनरावृत्ति (repetition) हटाने के बाद ठीक 20 प्रश्नों का सेट तैयार होता है।
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by topic name (शीर्षक खोजें)…"
            className="h-10 w-full pl-9 pr-3 rounded-xl border border-input bg-card text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-ring shrink-0"
          >
            <option value="all">All Subjects (सभी 5 विषय)</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-ring shrink-0"
          >
            <option value="all">All Statuses (सभी स्थितियाँ)</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="NEAR_COMPLETE">Near Complete (&lt;20 remaining)</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* ── Topic Queue Grid ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>73 Master Topics ({filteredTopics.length} प्रदर्शित)</span>
          <span>FIFO Queue Engine Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTopics.map((topic) => {
            const isNearComplete = topic.available < 20 && topic.available > 0;
            const isExhausted = topic.available === 0 && topic.requeued === 0;

            let statusBadge = (
              <Badge variant="outline" className="text-[10px] py-0.5 font-medium">
                Not Started
              </Badge>
            );
            if (topic.status === "COMPLETED") {
              statusBadge = (
                <Badge className="bg-success/15 text-success border-success/30 text-[10px] py-0.5 font-semibold">
                  Completed ✓
                </Badge>
              );
            } else if (isNearComplete || topic.status === "NEAR_COMPLETE") {
              statusBadge = (
                <Badge className="bg-warning/15 text-warning border-warning/30 text-[10px] py-0.5 font-semibold">
                  Near Complete ({topic.available} Left)
                </Badge>
              );
            } else if (topic.status === "IN_PROGRESS") {
              statusBadge = (
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] py-0.5 font-semibold">
                  In Progress
                </Badge>
              );
            }

            return (
              <Card
                key={topic.masterTopicId}
                className="rounded-2xl border-border/70 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                        <span className="font-bold text-primary">#{topic.masterTopicId}</span>
                        <span>•</span>
                        <span className="truncate">{topic.subjectNameHindi || topic.subjectName}</span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground font-hindi leading-snug truncate">
                        {topic.masterTopic}
                      </h3>
                    </div>
                    <div className="shrink-0">{statusBadge}</div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 sm:px-5 pb-4 pt-1 space-y-3.5">
                  {/* Topic Counts Metric Bar */}
                  <div className="grid grid-cols-4 gap-2 text-center py-2 px-2.5 rounded-xl bg-muted/40 border border-border/40 text-xs">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                      <p className="font-bold text-foreground">{topic.total}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Available</p>
                      <p className="font-bold text-success">{topic.available}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Used</p>
                      <p className="font-bold text-foreground">{topic.used}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Requeued</p>
                      <p className="font-bold text-warning">{topic.requeued}</p>
                    </div>
                  </div>

                  {/* Actions & Final Set Control */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    {/* Final Set <20 Switch if topic nearing exhaustion */}
                    {isNearComplete ? (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={topic.allowFinalBelow20 ? "default" : "outline"}
                          onClick={() =>
                            handleToggleFinalSet(
                              topic.masterTopicId,
                              Boolean(topic.allowFinalBelow20),
                              topic.available
                            )
                          }
                          className="h-8 text-[11px] rounded-lg font-hindi"
                        >
                          {topic.allowFinalBelow20 ? (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              Final Set &lt;20 Allowed
                            </>
                          ) : (
                            "Allow Final Set (<20)"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-hindi">
                        Next: <strong>{Math.min(30, topic.available)}</strong> candidates
                      </span>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenImporter(topic.masterTopicId, topic.masterTopic)}
                      disabled={topic.available === 0}
                      className="h-8 text-xs font-semibold rounded-xl gap-1.5 shadow-2xs"
                    >
                      <span>Get Candidates</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
