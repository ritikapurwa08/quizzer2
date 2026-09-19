"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { ToastProvider } from "@/components/ui/Toast";
import { LayoutGrid, Upload, BookOpen, Layers, FileText, HelpCircle, Home, Database } from "lucide-react";

import { LoadingState } from "@/components/shared/LoadingState";
import { ModeToggle } from "@/components/toggle-mode";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();

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
        {/* ── Sidebar ── sticky on lg: stays in view while main scrolls */}
        <aside className="lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between bg-card/50 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          <div>
            {/* Header block — title on its own row, ModeToggle below */}
            <div className="px-5 pt-5 pb-3 border-b border-border/60 space-y-3">
              <div>
                <p className="font-bold text-sm tracking-tight text-foreground">Admin Console</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">System Management</p>
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle />
              </div>
            </div>

            {/* Nav */}
            <nav className="flex lg:flex-col gap-1 overflow-x-auto p-3 lg:pb-0">
              {NAV.map((item) => {
                // Exact match for overview; prefix match for sub-pages
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors group",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom: single back-to-dashboard link */}
          <div className="pt-3 border-t border-border mt-3 p-3">
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

