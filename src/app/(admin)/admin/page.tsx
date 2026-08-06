"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { BookOpen, Layers, FileText, HelpCircle, Upload, ArrowRight } from "lucide-react";

export default function AdminOverviewPage() {
  const subjects = useQuery(api.subjects.list);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Admin Console Overview</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage exam subjects, topics, test sets, and bulk import questions.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3.5 p-4 bg-card border border-border shadow-sm rounded-xl">
          <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Subjects</p>
            <p className="text-2xl font-bold tracking-tight mt-0.5">{subjects?.length ?? "..."}</p>
          </div>
        </Card>
      </div>

      <Link href="/admin/import" className="block">
        <Card className="flex items-center justify-between p-4 bg-card border border-border shadow-sm rounded-xl hover:border-primary hover:shadow-md transition-all group">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-base group-hover:text-primary transition-colors">Import Questions</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paste JSON → Auto-Detect → Validate → Bulk Import into test sets
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </Card>
      </Link>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Management Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/subjects">
            <Card className="flex items-center gap-3 p-4 hover:border-primary hover:shadow-sm transition-all rounded-xl group">
              <div className="p-2.5 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">Manage Subjects</p>
                <p className="text-xs text-muted-foreground">Add & order subjects</p>
              </div>
            </Card>
          </Link>
          <Link href="/admin/topics">
            <Card className="flex items-center gap-3 p-4 hover:border-primary hover:shadow-sm transition-all rounded-xl group">
              <div className="p-2.5 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">Manage Topics</p>
                <p className="text-xs text-muted-foreground">Fixed topic hierarchy</p>
              </div>
            </Card>
          </Link>
          <Link href="/admin/test-sets">
            <Card className="flex items-center gap-3 p-4 hover:border-primary hover:shadow-sm transition-all rounded-xl group">
              <div className="p-2.5 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">Manage Test Sets</p>
                <p className="text-xs text-muted-foreground">Practice sets & scoring</p>
              </div>
            </Card>
          </Link>
          <Link href="/admin/questions">
            <Card className="flex items-center gap-3 p-4 hover:border-primary hover:shadow-sm transition-all rounded-xl group">
              <div className="p-2.5 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">Manage Questions</p>
                <p className="text-xs text-muted-foreground">View & edit question bank</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
