"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { BookOpen, Layers, FileText, HelpCircle, Upload } from "lucide-react";

export default function AdminOverviewPage() {
  const subjects = useQuery(api.subjects.list);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Admin Overview</h1>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Subjects</p>
            <p className="font-semibold">{subjects?.length ?? "..."}</p>
          </div>
        </Card>
      </div>

      <Link href="/admin/import">
        <Card className="flex items-center gap-3 hover:border-primary">
          <Upload className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Import questions</p>
            <p className="text-sm text-muted-foreground">Upload JSON → Preview → Validate → Import</p>
          </div>
        </Card>
      </Link>

      <div className="grid sm:grid-cols-3 gap-3">
        <Link href="/admin/subjects">
          <Card className="flex items-center gap-2 hover:border-primary">
            <BookOpen className="h-4 w-4" /> Manage Subjects
          </Card>
        </Link>
        <Link href="/admin/topics">
          <Card className="flex items-center gap-2 hover:border-primary">
            <Layers className="h-4 w-4" /> Manage Topics
          </Card>
        </Link>
        <Link href="/admin/test-sets">
          <Card className="flex items-center gap-2 hover:border-primary">
            <FileText className="h-4 w-4" /> Manage Test Sets
          </Card>
        </Link>
        <Link href="/admin/questions">
          <Card className="flex items-center gap-2 hover:border-primary">
            <HelpCircle className="h-4 w-4" /> Manage Questions
          </Card>
        </Link>
      </div>
    </div>
  );
}
