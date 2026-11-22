"use client";

import Link from "next/link";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  CheckCircle2,
} from "lucide-react";

const CET_SECTIONAL_SETS = [
  { id: "cet-set-01", name: "Part 1 — Art, Culture & Computer", questions: "Q.1 – 20", section: "Rajasthan Culture & IT" },
  { id: "cet-set-02", name: "Part 2 — Polity & Reasoning", questions: "Q.21 – 40", section: "Polity & Logical Ability" },
  { id: "cet-set-03", name: "Part 3 — Aptitude, Geography & Economy", questions: "Q.41 – 60", section: "Quant & Geo-Economy" },
  { id: "cet-set-04", name: "Part 4 — General Science & History", questions: "Q.61 – 80", section: "Science & Rajasthan History" },
  { id: "cet-set-05", name: "Part 5 — Current Affairs & Hindi", questions: "Q.81 – 100", section: "Current Affairs & General Hindi" },
  { id: "cet-set-06", name: "Part 6 — General English", questions: "Q.101 – 120", section: "Grammar & Comprehension" },
];

export default function TestsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0 overflow-x-hidden">
      {/* ── Breadcrumb Navigation ── */}
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mock Tests & Exam Simulation" },
        ]}
      />

      {/* ── Header ── */}
      <div className="space-y-1.5 border-b border-border/70 pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs font-semibold px-2.5 py-0.5">
            <Sparkles className="h-3 w-3 mr-1" />
            Exam Simulation Hub
          </Badge>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground font-hindi">
          मॉडल टेस्ट एवं परीक्षा सिमुलेशन
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          असली परीक्षा के टाइमर और नेगेटिव मार्किंग मानकों पर आधारित संपूर्ण मॉक पेपर्स एवं सेक्शनल प्रैक्टिस सेट्स।
        </p>
      </div>

      {/* ── Featured Full-Length Mock Test ── */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Award className="h-3.5 w-3.5 text-primary" />
          Full-Length Mock Paper (संपूर्ण मॉडल पेपर)
        </h2>

        <Card className="p-4 sm:p-5 border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 rounded-xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-primary text-primary-foreground text-[11px] font-bold">
                  CET 10+2 Model Exam
                </Badge>
                <Badge variant="outline" className="text-muted-foreground text-[11px]">
                  RSMSSB Exam Standard
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground font-hindi">
                समान पात्रता परीक्षा (CET 10+2) Final Mock Test - 01
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                राजस्थान सामान्य ज्ञान, इतिहास, कला-संस्कृति, भूगोल, राजव्यवस्था, सामान्य विज्ञान, गणित, रीजनिंग, हिन्दी, अंग्रेजी एवं करेंट अफेयर्स का संपूर्ण 120 प्रश्नों का प्रामाणिक टेस्ट।
              </p>
            </div>

            <Link href="/quiz/cet-final-01" className="shrink-0 w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-bold gap-2 cursor-pointer shadow-sm">
                <span>Start Full Mock Test</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Test Specs Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span><strong>120</strong> Questions</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span><strong>150</strong> Minutes (2.5 Hr)</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="h-4 w-4 text-primary shrink-0" />
              <span><strong>240</strong> Max Marks</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-destructive shrink-0" />
              <span><strong>-0.66</strong> (1/3rd Negative)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Modular Sectional Practice Sets (20 Questions each) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-primary" />
            CET Sectional Practice Sets (20 प्रश्न प्रति सेट)
          </h2>
          <span className="text-xs text-muted-foreground">6 Sets Available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {CET_SECTIONAL_SETS.map((item, idx) => (
            <Link key={item.id} href={`/quiz/${item.id}`} className="block focus-visible:outline-hidden">
              <Card className="p-3.5 border border-border bg-card hover:border-primary/50 hover:shadow-xs transition-all group rounded-xl flex flex-col justify-between min-h-[5.5rem] select-none">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex h-5 w-5 items-center justify-center rounded-sm text-[11px] font-bold bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground/80 tabular-nums">
                      {item.questions}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.section}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-primary font-semibold">
                  <span>Start Practice (20 Qs)</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Marathons & Syllabus Fast Access ── */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          More Specialized Practice
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* English Marathon Card */}
          <Link
            href="/subjects/k97dhqwj29j3cgm6wj9ngkyg3x8gr3yg/kh7b51w8xzbz3s6wx6437zzhg18gs4zm"
            className="block focus-visible:outline-hidden"
          >
            <Card className="p-4 border border-border bg-card hover:border-foreground/30 hover:shadow-xs transition-all rounded-xl flex items-center justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <Badge variant="outline" className="text-[10px] text-primary border-primary/20 bg-primary/5">
                  500 MCQs Series
                </Badge>
                <h4 className="font-bold text-sm text-foreground">
                  CET 2026 English Marathon
                </h4>
                <p className="text-xs text-muted-foreground">
                  25 Topic-wise practice sets with authentic answers & 4 options.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/60 shrink-0" />
            </Card>
          </Link>

          {/* Rajasthan GK Syllabus Card */}
          <Link href="/subjects" className="block focus-visible:outline-hidden">
            <Card className="p-4 border border-border bg-card hover:border-foreground/30 hover:shadow-xs transition-all rounded-xl flex items-center justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <Badge variant="outline" className="text-[10px] text-foreground border-border bg-muted">
                  RPSC Master Syllabus
                </Badge>
                <h4 className="font-bold text-sm text-foreground">
                  Rajasthan GK Topic Practice
                </h4>
                <p className="text-xs text-muted-foreground">
                  47 Master topics across Geography, History, Culture & Polity.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/60 shrink-0" />
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
