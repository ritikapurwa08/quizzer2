"use client";

import { AppSidebar } from "@/components/shared/AppSidebar";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { ToastProvider } from "@/components/ui/Toast";
import { LoadingState } from "@/components/shared/LoadingState";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdminGuard();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState message="Verifying Admin Privileges..." />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <AuthGuard>
      <ToastProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
          <AppSidebar />
          <div className="flex-1 min-w-0 md:pl-64 flex flex-col">
            <main className="mx-auto max-w-6xl w-full px-3.5 sm:px-6 md:px-8 py-5 sm:py-7 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
