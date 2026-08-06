"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookOpen, ChevronRight, Layers } from "lucide-react";

export default function SubjectsPage() {
  const subjects = useQuery(api.subjects.list) ?? [];

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Subjects" }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Syllabus Subjects</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Structured exam syllabus divided into fixed subjects and topics.
        </p>
      </div>

      {subjects.length === 0 && (
        <EmptyState icon={BookOpen} title="No subjects seeded yet" />
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {subjects.map((s) => (
          <Link key={s._id} href={`/subjects/${s._id}`}>
            <Card className="p-4 hover:border-primary hover:shadow-md transition-all flex flex-col justify-between h-full group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Subject {s.order + 1}
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <h2 className="font-bold text-base group-hover:text-primary transition-colors">
                  {s.name}
                </h2>
                {s.description && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {s.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4 pt-2 border-t border-border">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>Predefined Topic Hierarchy</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
