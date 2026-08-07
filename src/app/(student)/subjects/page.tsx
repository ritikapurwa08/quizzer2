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
            <div className="flex flex-row items-center justify-between p-3.5 border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group min-h-[3.5rem] rounded-xl select-none">
              <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                  {s.order + 1}
                </span>
                <h2 className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate">
                  {s.name}
                </h2>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 shrink-0 ml-2" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
