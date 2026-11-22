"use client";

import Link from "next/link";

interface SubjectCardProps {
  id: string;
  name: string;
  slug?: string;
}

export function SubjectCard({ id, name, slug = "" }: SubjectCardProps) {
  const s = (slug || name).toLowerCase();

  const renderContent = () => {
    if (s.includes("geo") || s.includes("भूगोल")) {
      return (
        <div className="flex items-baseline font-hindi">
          <span className="text-cyan-400 text-3xl sm:text-4xl font-extrabold leading-none">भू</span>
          <span className="text-base sm:text-lg font-semibold text-foreground tracking-tight ml-0.5">गोल</span>
        </div>
      );
    }

    if (s.includes("hist") || s.includes("इतिहास")) {
      return (
        <div className="flex items-baseline font-hindi">
          <span className="text-blue-400 text-3xl sm:text-4xl font-extrabold leading-none">इ</span>
          <span className="text-base sm:text-lg font-semibold text-foreground tracking-tight ml-0.5">तिहास</span>
        </div>
      );
    }

    if (s.includes("art") || s.includes("culture") || s.includes("कला") || s.includes("संस्कृति")) {
      return (
        <div className="flex flex-col justify-center font-hindi">
          <div className="flex items-baseline">
            <span className="text-indigo-400 text-3xl sm:text-4xl font-extrabold leading-none">क</span>
            <span className="text-base sm:text-lg font-semibold text-foreground tracking-tight ml-0.5">ला</span>
          </div>
          <span className="text-xs text-muted-foreground leading-tight mt-0.5">एवं संस्कृति</span>
        </div>
      );
    }

    if (s.includes("polit") || s.includes("राजव्यवस्था") || s.includes("admin")) {
      return (
        <div className="flex items-baseline font-hindi">
          <span className="text-emerald-400 text-3xl sm:text-4xl font-extrabold leading-none">रा</span>
          <span className="text-base sm:text-lg font-semibold text-foreground tracking-tight ml-0.5">जव्यवस्था</span>
        </div>
      );
    }

    if (s.includes("eng") || s.includes("अंग्रेजी")) {
      return (
        <div className="flex items-baseline">
          <span className="text-amber-400 text-3xl sm:text-4xl font-extrabold leading-none">E</span>
          <span className="text-base sm:text-lg font-semibold text-foreground tracking-tight ml-0.5">nglish</span>
        </div>
      );
    }

    return (
      <span className="text-base font-semibold text-foreground">
        {name}
      </span>
    );
  };

  return (
    <Link href={`/subjects/${id}`} className="block focus-visible:outline-hidden group h-full">
      <div className="bg-[#121214] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 sm:p-5 transition-colors cursor-pointer flex items-center h-full min-h-[72px] sm:min-h-[80px]">
        {renderContent()}
      </div>
    </Link>
  );
}
