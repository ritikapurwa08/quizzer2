"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Compass,
  Palette,
  Landmark,
  Scale,
  Search,
} from "lucide-react";
import { getSubjectDisplayName } from "@/lib/utils";

// Distinct visual icons for each canonical subject
const SUBJECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "rajasthan-general-knowledge-geography": Compass,
  "rajasthan-art-culture": Palette,
  "rajasthan-ancient-medieval-history": Landmark,
  "modern-rajasthan-freedom-movement": GraduationCap,
  "rajasthan-polity-administration": Scale,
};

export default function NotesLandingPage() {
  const subjects = useQuery(api.subjects.list);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubjects = subjects?.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.nameHindi && s.nameHindi.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <BreadcrumbNav
        items={[
          { label: "डैशबोर्ड", href: "/dashboard" },
          { label: "नोट्स एवं अध्ययन सामग्री" },
        ]}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 shadow-xs">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-hindi">
            <Sparkles className="h-3.5 w-3.5" />
            <span>RPSC / RSMSSB परीक्षा विशेष नोट्स</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-hindi">
            राजस्थान सामान्य ज्ञान — नोट्स एवं अध्ययन सामग्री
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-hindi leading-relaxed">
            राजस्थान की सभी प्रतियोगी परीक्षाओं (RAS, REET, Patwar, Police SI, VDO) हेतु 5 प्रमुख विषयों व 75 टॉपिकों के विषयवार PDF नोट्स, ट्रिक्स, तुलनात्मक सारणियाँ एवं संपूर्ण परीक्षा सामग्री।
          </p>
        </div>

        <div className="shrink-0 flex sm:flex-col gap-2">
          <Button asChild className="rounded-xl font-bold text-xs h-9 px-4">
            <Link href="/subjects">अभ्यास सेट हल करें</Link>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-foreground" />
          <span>राजस्थान GK के 5 मूल विषय</span>
          {subjects && <span className="tabular-nums">({subjects.length})</span>}
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="विषय खोजें…"
            className="w-full pl-8.5 pr-3 py-1.5 text-xs sm:text-sm bg-card rounded-xl border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground font-hindi transition-colors"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      {subjects === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-border/80 bg-card p-5 animate-pulse space-y-3"
            >
              <div className="h-9 w-9 rounded-xl bg-muted" />
              <div className="h-5 w-48 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : filteredSubjects && filteredSubjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="कोई विषय नहीं मिला"
          description="आपकी खोज के अनुसार कोई विषय उपलब्ध नहीं है।"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredSubjects?.map((subject, idx) => {
            const IconComponent = SUBJECT_ICONS[subject.slug] || BookOpen;

            return (
              <Link key={subject._id} href={`/notes/${subject.slug}`} className="group">
                <Card className="h-full flex flex-col justify-between p-5 border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all rounded-2xl">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-muted-foreground/60 group-hover:text-primary transition-colors">
                        0{idx + 1}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-base sm:text-lg text-foreground font-hindi group-hover:text-primary transition-colors leading-snug">
                        {getSubjectDisplayName(subject)}
                      </h3>
                      {subject.nameHindi && subject.name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {subject.name}
                        </p>
                      )}
                    </div>

                    {subject.description && (
                      <p className="text-xs text-muted-foreground font-hindi line-clamp-2 leading-relaxed">
                        {subject.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-2 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                    <span className="font-hindi">टॉपिक एवं PDF देखें</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
