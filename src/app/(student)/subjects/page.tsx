"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookOpen, ChevronRight, Layers, FileText } from "lucide-react";
import { getSubjectDisplayName } from "@/lib/utils";

export default function SubjectsPage() {
  const subjects = useQuery(api.subjects.list);
  const setCounts = useQuery(api.subjects.setCountsAllSubjects) ?? {};
  const stats = useQuery(api.testSets.siteStats);

  return (
    <div className="space-y-5">
      <BreadcrumbNav items={[{ label: "डैशबोर्ड", href: "/dashboard" }, { label: "विषय" }]} />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">सभी विषय</h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-hindi">
          निर्धारित पाठ्यक्रम के अनुसार विषयवार अभ्यास सामग्री।
        </p>
      </div>

      {/* Site-wide stats banner */}
      {stats && (
        <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-card border border-border/80 text-sm text-muted-foreground font-hindi">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 shrink-0 text-foreground" />
            <strong className="text-foreground font-bold">{stats.totalSets}</strong> अभ्यास सेट
          </span>
          <span className="w-px h-4 bg-border" />
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 shrink-0 text-foreground" />
            <strong className="text-foreground font-bold">{stats.totalQuestions}</strong> कुल प्रश्न
          </span>
        </div>
      )}

      {subjects === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-row items-center justify-between p-3.5 border border-border/80 bg-card min-h-[3.5rem] rounded-xl animate-pulse"
            >
              <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground/50 text-xs font-bold shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="h-4 w-32 sm:w-40 rounded bg-muted" />
              </div>
              <div className="h-4 w-4 rounded-full bg-muted shrink-0 ml-2" />
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="कोई विषय उपलब्ध नहीं है" description="वर्तमान में कोई विषय नहीं मिला।" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {subjects.map((s, idx) => {
            const setCount = setCounts[s._id] ?? 0;
            return (
              <Link key={s._id} href={`/subjects/${s._id}`}>
                <div className="flex flex-row items-center justify-between p-3.5 border border-border/80 bg-card hover:border-foreground/30 hover:shadow-xs transition-all group min-h-[3.5rem] rounded-xl select-none">
                  <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground text-xs font-bold shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors duration-200">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-xs sm:text-sm text-foreground transition-colors truncate font-hindi">
                        {getSubjectDisplayName(s)}
                      </h2>
                      {setCount === 0 ? (
                        <p className="text-xs text-muted-foreground/60 mt-0.5 font-hindi">अभी कोई सेट नहीं</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5 font-hindi">{setCount} अभ्यास सेट</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200 shrink-0 ml-2" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
