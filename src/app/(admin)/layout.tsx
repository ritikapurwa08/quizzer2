"use client";

import Link from "next/link";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { ToastProvider } from "@/components/ui/Toast";
import { LayoutGrid, Upload, BookOpen, Layers, FileText, HelpCircle, ArrowLeft, Home } from "lucide-react";

import { LoadingState } from "@/components/shared/LoadingState";
import { ModeToggle } from "@/components/toggle-mode";

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState message="Admin Console लोड हो रहा है…" />
      </div>
    );
  }
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
              <div className="flex items-center gap-1.5">
                <ModeToggle />
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded-lg border border-border transition-colors"
                  title="Go to Student Dashboard"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </div>
            </div>

            <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground text-muted-foreground whitespace-nowrap transition-colors group"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-4 border-t border-border mt-4 hidden lg:block">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 w-full py-2 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-medium transition-colors group"
            >
              <Home className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              Back to Dashboard
            </Link>
          </div>
        </aside>
        <main className="flex-1 p-4 lg:p-6 min-w-0">{children}</main>
      </div>
    </ToastProvider>
  );
}
