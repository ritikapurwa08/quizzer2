"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Search as SearchIcon, ArrowRight, BookOpen, Layers, FileText } from "lucide-react";
import { getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export default function SearchPage() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const results = useQuery(api.search.global, { term: q });

  const totalResults =
    (results?.subjects.length ?? 0) + (results?.topics.length ?? 0) + (results?.testSets.length ?? 0);

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[{ label: "डैशबोर्ड", href: "/dashboard" }, { label: "खोज परिणाम" }]} />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
          खोज परिणाम: &ldquo;{q}&rdquo;
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5 font-hindi">
          {totalResults} परिणाम मिले
        </p>
      </div>

      {results && totalResults === 0 && (
        <EmptyState
          icon={SearchIcon}
          title="कोई परिणाम नहीं मिला"
          description="कृपया किसी अन्य विषय, टॉपिक या कीवर्ड से खोजें।"
        />
      )}

      {results && results.subjects.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 font-hindi">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            विषय ({results.subjects.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {results.subjects.map((s) => (
              <Link key={s._id} href={`/subjects/${s._id}`}>
                <Card className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group">
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors font-hindi">
                    {getSubjectDisplayName(s)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results && results.topics.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 font-hindi">
            <Layers className="h-3.5 w-3.5 text-primary" />
            टॉपिक ({results.topics.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {results.topics.map(({ topic, subject }) => (
              subject && (
                <Link key={topic._id} href={`/subjects/${subject._id}/${topic._id}`}>
                  <Card className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors font-hindi truncate">
                        {getTopicDisplayName(topic)}
                      </p>
                      <p className="text-xs text-muted-foreground font-hindi mt-0.5">
                        विषय: {getSubjectDisplayName(subject)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </Card>
                </Link>
              )
            ))}
          </div>
        </section>
      )}

      {results && results.testSets.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 font-hindi">
            <FileText className="h-3.5 w-3.5 text-primary" />
            अभ्यास सेट ({results.testSets.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {results.testSets.map(({ testSet, topic, subject }) => (
              <Link key={testSet._id} href={`/quiz/${testSet._id}`}>
                <Card className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors font-hindi truncate">
                      {testSet.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-hindi mt-0.5">
                      {getSubjectDisplayName(subject)} &rarr; {getTopicDisplayName(topic)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
