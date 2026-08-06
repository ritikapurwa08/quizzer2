"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookOpen, ChevronRight } from "lucide-react";

export default function SubjectsPage() {
  const subjects = useQuery(api.subjects.list) ?? [];

  return (
    <div className="space-y-5">
      <BreadcrumbNav items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Subjects" }]} />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">All Syllabus Subjects</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Structured exam syllabus divided into fixed subjects and topics.
        </p>
      </div>

      {subjects.length === 0 && (
        <EmptyState icon={BookOpen} title="No subjects seeded yet" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {subjects.map((s) => (
          <Link key={s._id} href={`/subjects/${s._id}`}>
            <Card className="flex items-center justify-between p-3.5 hover:border-primary hover:shadow-md transition-all group min-h-14">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {s.order + 1}
                </span>
                <h2 className="font-bold text-sm sm:text-base group-hover:text-primary transition-colors truncate">
                  {s.name}
                </h2>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
