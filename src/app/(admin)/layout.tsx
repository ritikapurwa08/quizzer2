"use client";

import Link from "next/link";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { ToastProvider } from "@/components/ui/Toast";
import { LayoutGrid, Upload, BookOpen, Layers, FileText, HelpCircle, ArrowLeft, Home } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/import", label: "Import", icon: Upload },
  { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { href: "/admin/topics", label: "Topics", icon: Layers },
  { href: "/admin/test-sets", label: "Test Sets", icon: FileText },
  { href: "/admin/questions", label: "Questions", icon: HelpCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdminGuard();

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground animate-pulse">Loading Admin Console...</p>;
  if (!isAdmin) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col lg:flex-row">
        <aside className="lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-border p-4 flex flex-col justify-between bg-card/50">
          <div>
            <div className="flex items-center justify-between mb-5 px-2">
              <div>
                <p className="font-bold text-base tracking-tight">Admin Console</p>
                <p className="text-[11px] text-muted-foreground">System Management</p>
              </div>
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2 py-1 rounded bg-primary/10"
                title="Go to Student Dashboard"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
              </Link>
            </div>

            <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground text-muted-foreground whitespace-nowrap transition-colors"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-primary" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-4 border-t border-border mt-4 hidden lg:block">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg border border-border bg-card hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-all shadow-sm group"
            >
              <Home className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
              Back to Dashboard
            </Link>
          </div>
        </aside>
        <main className="flex-1 p-4 lg:p-6 min-w-0">{children}</main>
      </div>
    </ToastProvider>
  );
}
