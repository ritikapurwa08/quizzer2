"use client";

import Link from "next/link";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { LayoutGrid, Upload, BookOpen, Layers, FileText, HelpCircle } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/import", label: "Import", icon: Upload },
  { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { href: "/admin/topics", label: "Topics", icon: Layers },
  { href: "/admin/test-sets", label: "Test Sets", icon: FileText },
  { href: "/admin/questions", label: "Questions", icon: HelpCircle },
];

/**
 * Client-side redirect only, for UX. The real boundary is requireAdmin()
 * inside every admin Convex mutation/query — SRD Section 5.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdminGuard();

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-border p-4">
        <p className="font-semibold mb-4 px-2">Admin</p>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-muted whitespace-nowrap"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 lg:p-6">{children}</main>
    </div>
  );
}
