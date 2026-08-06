"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Search as SearchIcon } from "lucide-react";

/** Deep-links straight into the matched item — no extra drill-down (SRD Section 11). */
export default function SearchPage() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const results = useQuery(api.search.global, { term: q });

  const totalResults =
    (results?.subjects.length ?? 0) + (results?.topics.length ?? 0) + (results?.testSets.length ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Search results for &ldquo;{q}&rdquo;</h1>

      {results && totalResults === 0 && (
        <EmptyState icon={SearchIcon} title="No matches found" />
      )}

      {results && results.subjects.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Subjects</h2>
          {results.subjects.map((s) => (
            <Link key={s._id} href={`/subjects/${s._id}`}>
              <Card className="hover:border-primary">{s.name}</Card>
            </Link>
          ))}
        </section>
      )}

      {results && results.topics.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Topics</h2>
          {results.topics.map(({ topic, subject }) => (
            subject && (
              <Link key={topic._id} href={`/subjects/${subject._id}/${topic._id}`}>
                <Card className="hover:border-primary">
                  <p>{topic.name}</p>
                  <p className="text-xs text-muted-foreground">in {subject.name}</p>
                </Card>
              </Link>
            )
          ))}
        </section>
      )}

      {results && results.testSets.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Test Sets</h2>
          {results.testSets.map(({ testSet, topic, subject }) => (
            <Link key={testSet._id} href={`/quiz/${testSet._id}`}>
              <Card className="hover:border-primary">
                <p>{testSet.name}</p>
                <p className="text-xs text-muted-foreground">
                  {subject?.name} / {topic?.name}
                </p>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
