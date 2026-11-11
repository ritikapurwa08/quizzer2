import {
  LayoutGrid,
  BookOpen,
  ListChecks,
  BarChart2,
  History,
  Bookmark,
  Shield,
  Database,
  FileUp,
  GitCompare,
  Pencil,
  User,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string | number;
}

// Strictly 5 items for mobile bottom nav bar (grid-cols-5, no 6th button)
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutGrid, exact: true },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Tests", href: "/history", icon: History, exact: true },
  { label: "Analytics", href: "/analytics", icon: BarChart2, exact: true },
  { label: "Profile", href: "#profile", icon: User },
];

// Full student nav for desktop sidebar
export const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid, exact: true },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Syllabus Tracker", href: "/syllabus", icon: ListChecks, exact: true },
  { label: "Analytics", href: "/analytics", icon: BarChart2, exact: true },
  { label: "Test History", href: "/history", icon: History, exact: true },
  { label: "Saved Questions", href: "/saved-questions", icon: Bookmark },
];

// Admin navigation items
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Admin Overview", href: "/admin", icon: Shield, exact: true },
  { label: "Question Editor", href: "/admin/questions", icon: Pencil, exact: true },
  { label: "55 Topics Pool", href: "/admin/pool", icon: Database, exact: true },
  { label: "Dedup Review", href: "/admin/dedup", icon: GitCompare, exact: true },
  { label: "Import Sets", href: "/admin/import", icon: FileUp, exact: true },
];
