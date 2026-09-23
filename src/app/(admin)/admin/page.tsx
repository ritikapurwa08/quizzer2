"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { BookOpen, Layers, FileText, HelpCircle, Upload, ArrowRight, Sparkles } from "lucide-react";

export default function AdminOverviewPage() {
  const subjects = useQuery(api.subjects.list);
  const stats = useQuery(api.testSets.siteStats);

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Admin Console Overview</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage exam subjects, topics, test sets, and bulk import questions.
        </p>
      </div>

      {/* Compact Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="flex items-center gap-3 p-3 sm:p-3.5 bg-card border border-border/80 rounded-xl shadow-2xs">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">Total Subjects</p>
            <p className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-foreground">{subjects?.length ?? "..."}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-3 sm:p-3.5 bg-card border border-border/80 rounded-xl shadow-2xs">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">Total Test Sets</p>
            <p className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-foreground">{stats?.totalSets ?? "..."}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-3 sm:p-3.5 bg-card border border-border/80 rounded-xl shadow-2xs">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">Total Questions</p>
            <p className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-foreground">{stats?.totalQuestions ?? "..."}</p>
          </div>
        </Card>
      </div>

      {/* Compact Import Questions Banner */}
      <Link href="/admin/import" className="block">
        <Card className="flex items-center justify-between p-3.5 bg-card border border-border shadow-2xs rounded-xl hover:border-foreground/30 hover:shadow-xs transition-all group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground transition-colors">Import Questions</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Bulk upload questions using AI-generated JSON into test sets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>Open Wizard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Card>
      </Link>

      {/* Management Sections */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Management Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/admin/subjects">
            <Card className="flex items-center gap-3 p-3.5 hover:border-foreground/30 hover:shadow-xs transition-all rounded-xl group bg-card border border-border/80">
              <div className="p-2.5 rounded-lg bg-muted text-foreground group-hover:bg-foreground group-hover:text-background transition-colors shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm text-foreground transition-colors truncate">Manage Subjects</p>
                <p className="text-[11px] text-muted-foreground truncate">Add & order subjects</p>
              </div>
            </Card>
          </Link>
          <Link href="/admin/topics">
            <Card className="flex items-center gap-3 p-3.5 hover:border-foreground/30 hover:shadow-xs transition-all rounded-xl group bg-card border border-border/80">
              <div className="p-2.5 rounded-lg bg-muted text-foreground group-hover:bg-foreground group-hover:text-background transition-colors shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm text-foreground transition-colors truncate">Manage Topics</p>
                <p className="text-[11px] text-muted-foreground truncate">Fixed topic hierarchy</p>
              </div>
            </Card>
          </Link>
          <Link href="/admin/test-sets">
            <Card className="flex items-center gap-3 p-3.5 hover:border-foreground/30 hover:shadow-xs transition-all rounded-xl group bg-card border border-border/80">
              <div className="p-2.5 rounded-lg bg-muted text-foreground group-hover:bg-foreground group-hover:text-background transition-colors shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm text-foreground transition-colors truncate">Manage Test Sets</p>
                <p className="text-[11px] text-muted-foreground truncate">Practice sets & scoring</p>
              </div>
            </Card>
          </Link>
          <Link href="/admin/questions">
            <Card className="flex items-center gap-3 p-3.5 hover:border-foreground/30 hover:shadow-xs transition-all rounded-xl group bg-card border border-border/80">
              <div className="p-2.5 rounded-lg bg-muted text-foreground group-hover:bg-foreground group-hover:text-background transition-colors shrink-0">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm text-foreground transition-colors truncate">Manage Questions</p>
                <p className="text-[11px] text-muted-foreground truncate">View & edit question bank</p>
              </div>
            </Card>
          </Link>
          <Link href="/admin/notes">
            <Card className="flex items-center gap-3 p-3.5 hover:border-foreground/30 hover:shadow-xs transition-all rounded-xl group bg-card border border-border/80">
              <div className="p-2.5 rounded-lg bg-muted text-foreground group-hover:bg-foreground group-hover:text-background transition-colors shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs sm:text-sm text-foreground transition-colors truncate font-hindi">Study Notes & PDFs</p>
                <p className="text-[11px] text-muted-foreground truncate font-hindi">PDFs, images & JSON</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>

    </div>
  );
}
