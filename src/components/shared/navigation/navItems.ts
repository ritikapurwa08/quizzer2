import {
  LayoutGrid,
  BarChart2,
  History,
  Bookmark,
  Shield,
  Database,
  FileUp,
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

// Strictly 5 items for Mobile Bottom Bar & Desktop Sidebar (student-identical)
export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutGrid, exact: true },
  { label: "Tests", href: "/history", icon: History, exact: true },
  { label: "Saved", href: "/saved-questions", icon: Bookmark, exact: true },
  { label: "Analytics", href: "/analytics", icon: BarChart2, exact: true },
  { label: "Profile", href: "/profile", icon: User, exact: true },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = MAIN_NAV_ITEMS;
export const STUDENT_NAV_ITEMS: NavItem[] = MAIN_NAV_ITEMS;

// Exactly 4 Admin links (opened via long-press on Profile or Ctrl+Shift+A)
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Admin Overview", href: "/admin", icon: Shield, exact: true },
  { label: "Question Editor", href: "/admin/questions", icon: Pencil, exact: true },
  { label: "55 Topic Pool", href: "/admin/pool", icon: Database, exact: true },
  { label: "Import Set", href: "/admin/import", icon: FileUp, exact: true },
];
