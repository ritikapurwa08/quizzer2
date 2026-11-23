"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SubjectCardProps {
  id: string;
  name: string;
  slug?: string;
  setCount?: number;
}

interface SubjectMeta {
  topicCount: number;
  badgeClass: string;
  glowClass: string;
}

function getSubjectMeta(slug: string, name: string): SubjectMeta {
  const s = (slug || name).toLowerCase();
  if (s.includes("geo") || s.includes("भूगोल")) {
    return {
      topicCount: 15,
      badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      glowClass: "bg-cyan-500",
    };
  }
  if (s.includes("hist") || s.includes("इतिहास")) {
    return {
      topicCount: 8,
      badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      glowClass: "bg-blue-500",
    };
  }
  if (s.includes("art") || s.includes("culture") || s.includes("कला") || s.includes("संस्कृति")) {
    return {
      topicCount: 15,
      badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      glowClass: "bg-indigo-500",
    };
  }
  if (s.includes("polit") || s.includes("राजव्यवस्था") || s.includes("admin")) {
    return {
      topicCount: 9,
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      glowClass: "bg-emerald-500",
    };
  }
  if (s.includes("eng") || s.includes("अंग्रेजी")) {
    return {
      topicCount: 33,
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      glowClass: "bg-amber-500",
    };
  }
  return {
    topicCount: 10,
    badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
    glowClass: "bg-zinc-500",
  };
}

export function SubjectCard({ id, name, slug = "", setCount = 0 }: SubjectCardProps) {
  const s = (slug || name).toLowerCase();
  const meta = getSubjectMeta(slug, name);

  const renderTypography = () => {
    const subjectStyle = { fontFamily: "var(--font-subject), Poppins, 'Google Sans', 'Noto Sans Devanagari', sans-serif" };

    if (s.includes("geo") || s.includes("भूगोल")) {
      return (
        <div className="flex items-baseline font-subject" style={subjectStyle}>
          <span className="text-cyan-400 text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">भू</span>
          <span className="text-base sm:text-lg font-bold text-foreground tracking-tight ml-0.5">गोल</span>
        </div>
      );
    }

    if (s.includes("hist") || s.includes("इतिहास")) {
      return (
        <div className="flex items-baseline font-subject" style={subjectStyle}>
          <span className="text-blue-400 text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">इ</span>
          <span className="text-base sm:text-lg font-bold text-foreground tracking-tight ml-0.5">तिहास</span>
        </div>
      );
    }

    if (s.includes("art") || s.includes("culture") || s.includes("कला") || s.includes("संस्कृति")) {
      return (
        <div className="flex flex-col justify-center font-subject" style={subjectStyle}>
          <div className="flex items-baseline">
            <span className="text-indigo-400 text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">क</span>
            <span className="text-base sm:text-lg font-bold text-foreground tracking-tight ml-0.5">ला</span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground leading-tight mt-0.5 tracking-tight">एवं संस्कृति</span>
        </div>
      );
    }

    if (s.includes("polit") || s.includes("राजव्यवस्था") || s.includes("admin")) {
      return (
        <div className="flex items-baseline font-subject" style={subjectStyle}>
          <span className="text-emerald-400 text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">रा</span>
          <span className="text-base sm:text-lg font-bold text-foreground tracking-tight ml-0.5">जव्यवस्था</span>
        </div>
      );
    }

    if (s.includes("eng") || s.includes("अंग्रेजी")) {
      return (
        <div className="flex items-baseline font-subject" style={subjectStyle}>
          <span className="text-amber-400 text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">E</span>
          <span className="text-base sm:text-lg font-bold text-foreground tracking-tight ml-0.5">nglish</span>
        </div>
      );
    }

    return (
      <span className="text-base font-bold text-foreground font-subject tracking-tight" style={subjectStyle}>
        {name}
      </span>
    );
  };

  return (
    <Link href={`/subjects/${id}`} className="block focus-visible:outline-hidden group h-full">
      <Card className="rounded-md border border-border bg-card hover:border-border/80 p-4 sm:p-4.5 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full min-h-[105px] relative overflow-hidden select-none shadow-xs">
        {/* Subtle hover accent illumination */}
        <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-300 pointer-events-none ${meta.glowClass}`} />

        {/* Top Row: Drop-Cap Typography + Topics Pill Badge */}
        <div className="flex items-start justify-between gap-2">
          {renderTypography()}
          <span className={`text-[10px] font-semibold font-subject px-1.5 py-0.5 rounded-md border shrink-0 ${meta.badgeClass}`}>
            {meta.topicCount} Topics
          </span>
        </div>

        {/* Bottom Row: Dynamic Practice Sets Count + Interactive Hover Arrow */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground font-subject">
          <span className="text-[11px] font-medium tracking-tight text-muted-foreground group-hover:text-foreground/90 transition-colors">
            {setCount > 0 ? `${setCount} Practice Sets` : `${meta.topicCount * 5}+ Sets Available`}
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
        </div>
      </Card>
    </Link>
  );
}
