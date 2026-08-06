"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { BookOpen, Layers, FileText, HelpCircle, Upload } from "lucide-react";

export default function AdminOverviewPage() {
  const subjects = useQuery(api.subjects.list);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Admin Overview</h1>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="flex items-center gap-3 p-3.5">
          <BookOpen className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Subjects</p>
            <p className="font-semibold">{subjects?.length ?? "..."}</p>
          </div>
        </Card>
      </div>

      <Link href="/admin/import">
        <Card className="flex items-center gap-3 p-3.5 hover:border-primary transition-all">
          <Upload className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-medium text-sm">Import Questions</p>
            <p className="text-xs text-muted-foreground">Paste JSON → Auto-Detect → Validate → Bulk Import</p>
          </div>
        </Card>
      </Link>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/admin/subjects">
          <Card className="flex items-center gap-2.5 p-3.5 hover:border-primary transition-all text-sm font-medium">
            <BookOpen className="h-4 w-4 text-primary shrink-0" /> Manage Subjects
          </Card>
        </Link>
        <Link href="/admin/topics">
          <Card className="flex items-center gap-2.5 p-3.5 hover:border-primary transition-all text-sm font-medium">
            <Layers className="h-4 w-4 text-primary shrink-0" /> Manage Topics
          </Card>
        </Link>
        <Link href="/admin/test-sets">
          <Card className="flex items-center gap-2.5 p-3.5 hover:border-primary transition-all text-sm font-medium">
            <FileText className="h-4 w-4 text-primary shrink-0" /> Manage Test Sets
          </Card>
        </Link>
        <Link href="/admin/questions">
          <Card className="flex items-center gap-2.5 p-3.5 hover:border-primary transition-all text-sm font-medium">
            <HelpCircle className="h-4 w-4 text-primary shrink-0" /> Manage Questions
          </Card>
        </Link>
      </div>
    </div>
  );
}
