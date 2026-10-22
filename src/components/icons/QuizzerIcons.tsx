import React from "react";
import { cn } from "@/lib/utils";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/** Scalable Quizzer brand mark (512x512 master viewBox) */
export function QuizzerLogoIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      className={cn("h-6 w-6 shrink-0", className)}
      aria-label="Quizzer Logo"
      {...props}
    >
      <rect width="512" height="512" rx="140" fill="#09090B" />
      <path
        d="M146 190a132 132 0 1 0 215 137"
        stroke="#F4F4F5"
        strokeWidth="34"
        strokeLinecap="round"
      />
      <path
        d="M174 159a132 132 0 0 1 164 0"
        stroke="#38BDF8"
        strokeWidth="34"
        strokeLinecap="round"
      />
      <path
        d="M347 183a132 132 0 0 1 29 75"
        stroke="#F4F4F5"
        strokeWidth="34"
        strokeLinecap="round"
      />
      <path
        d="M300 302l88 91-20-70-68-21Z"
        fill="#F4F4F5"
        stroke="#F4F4F5"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <path
        d="M350 266l61-61 13 42 42-7-61 61-13-28-42-7Z"
        fill="#0EA5E9"
        stroke="#09090B"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <circle cx="337" cy="325" r="13" fill="#09090B" />
      <path d="M111 125l145-70 145 70-145 63-145-63Z" fill="#F4F4F5" />
      <path d="M256 188v-43" stroke="#09090B" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

/** Section A: Rajasthan Geography & Economy */
export function SectionAGeographyIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      {...props}
    >
      <path d="m2 17 6-9 3 4 3-6 8 11H2Z" />
      <path d="m5 17 3-4 2 2 3-3 5 5" />
      <path d="M3 20c3-1 4 1 7 0s4-1 7 0 4 0 5-1" />
      <circle cx="18" cy="5" r="2" />
      <path d="M18 1.5v1M18 7.5v1M14.5 5h1M20.5 5h1" />
    </svg>
  );
}

/** Section B: Rajasthan History & Freedom Struggle */
export function SectionBHistoryIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      {...props}
    >
      <path d="M3 21V9h4V6h3V9h4V6h3v3h4v12H3Z" />
      <path d="M2 21h20M6 12v2m5-2v2m5-2v2m-10 2v2m5-2v2m5-2v2" />
      <path d="M12 5c-2-2 1-3 1-4 2 2 3 4 1 6-1 1-3 0-2-2Z" />
    </svg>
  );
}

/** Section C: Rajasthan Art & Culture */
export function SectionCCultureIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      {...props}
    >
      <path d="M3 21V10a9 9 0 0 1 18 0v11" />
      <path d="M6 21v-9a6 6 0 0 1 12 0v9M2 21h20M8 15h8" />
      <path d="M18.5 3.5c2 1 3 3 2 5-2-1-3-3-2-5Z" />
      <path d="M19 8c-1 2-2 3-4 4" />
    </svg>
  );
}

/** Section D: Rajasthan Polity & Administration */
export function SectionDPolityIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      {...props}
    >
      <path d="m2 8 10-5 10 5H2Z" />
      <path d="M4 20h16M3 22h18M5 9v10m4-10v10m6-10v10m4-10v10" />
      <path d="M12 12v2m-4 2h8" />
      <path d="M8 16l-2 3h4l-2-3Zm8 0-2 3h4l-2-3Z" />
    </svg>
  );
}

/** Section E: Senior Teacher English (Paper-II) */
export function SectionEEnglishIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      {...props}
    >
      <path d="M2 5.5c4-1 7-.3 10 2v13c-3-2.3-6-3-10-2v-13Zm20 0c-4-1-7-.3-10 2v13c3-2.3 6-3 10-2v-13Z" />
      <path d="m15 4 3-2 3 3-2 3-4 1-1-2 1-3Z" />
      <path d="m14 7-2 5 5-2" />
    </svg>
  );
}

/** Navigation: Dashboard */
export function NavDashboardIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      {...props}
    >
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

/** Navigation: Syllabus Tracker */
export function NavSyllabusIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      {...props}
    >
      <circle cx="10.5" cy="13.5" r="8" />
      <circle cx="10.5" cy="13.5" r="4" />
      <path d="m8.5 13.5 1.5 1.5L22 3" />
    </svg>
  );
}

/** Navigation: Practice Quiz */
export function NavQuizIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      {...props}
    >
      <circle cx="12" cy="13" r="9" />
      <path d="M9 2h6M12 4v2m6.4 1.6L20 6" />
      <path d="M8 10h1m3 0h4M8 14h1m3 0h4M8 18h1m3 0h4" />
    </svg>
  );
}

/** Navigation: Analytics */
export function NavAnalyticsIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      {...props}
    >
      <path d="M3 21h18" />
      <rect x="4" y="13" width="4" height="8" rx="1" />
      <rect x="10" y="9" width="4" height="12" rx="1" />
      <rect x="16" y="4" width="4" height="17" rx="1" />
      <path d="m4 10 6-4 4 1 6-5m-4 0h4v4" />
    </svg>
  );
}

/** Navigation: Bookmarks */
export function NavBookmarksIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      {...props}
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
      <path d="m12 7 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4L12 7Z" />
    </svg>
  );
}

/** Navigation: Notes Directory */
export function NavNotesIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      {...props}
    >
      <path d="M5 3h14v18H5zM3 6h2m-2 4h2m-2 4h2m-2 4h2" />
      <path d="m13 15 5-5 2 2-5 5-3 1 1-3Z" />
    </svg>
  );
}

/** Feature: Admin Question Pool */
export function AdminPoolIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      {...props}
    >
      <ellipse cx="10" cy="5" rx="7" ry="3" />
      <path d="M3 5v5c0 1.7 3.1 3 7 3 1.5 0 2.8-.2 4-.6M3 10v5c0 1.7 3.1 3 7 3 1 0 2-.1 2.8-.3M3 15v4c0 1.7 3.1 3 7 3 1 0 2-.1 2.8-.3" />
      <path d="m18 12 .8 2.2L21 15l-2.2.8L18 18l-.8-2.2L15 15l2.2-.8L18 12Z" />
    </svg>
  );
}

/** Feature: Weak Areas Diagnostic */
export function CardWeakAreasIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      {...props}
    >
      <circle cx="10" cy="12" r="9" />
      <circle cx="10" cy="12" r="5" />
      <circle cx="10" cy="12" r="1" />
      <path d="m16.5 16.5 2 2M19 4v4m-2-2h4" />
    </svg>
  );
}

/**
 * Returns the customized SVG icon component corresponding to a subject or section code.
 */
export function getSubjectSectionIcon(codeOrSlug?: string): React.ComponentType<IconProps> {
  if (!codeOrSlug) return SectionAGeographyIcon;
  const s = codeOrSlug.toLowerCase();

  if (s === "a" || s.includes("geography") || s.includes("bhugol") || s.includes("भूगोल")) {
    return SectionAGeographyIcon;
  }
  if (s === "b" || s.includes("history") || s.includes("itihas") || s.includes("इतिहास")) {
    return SectionBHistoryIcon;
  }
  if (s === "c" || s.includes("culture") || s.includes("kala") || s.includes("कला") || s.includes("संस्कृति")) {
    return SectionCCultureIcon;
  }
  if (s === "d" || s.includes("polity") || s.includes("rajvyavastha") || s.includes("राजव्यवस्था") || s.includes("प्रशासन")) {
    return SectionDPolityIcon;
  }
  if (s === "e" || s.includes("english") || s.includes("अंग्रेजी")) {
    return SectionEEnglishIcon;
  }

  return SectionAGeographyIcon;
}
