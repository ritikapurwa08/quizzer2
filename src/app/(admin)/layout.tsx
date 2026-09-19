"use client";

import { Navbar } from "@/components/shared/Navbar";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { ToastProvider } from "@/components/ui/Toast";
import { LoadingState } from "@/components/shared/LoadingState";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdminGuard();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState message="Loading Admin Console..." />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="mx-auto max-w-5xl px-3 sm:px-4 md:px-6 py-5 sm:py-6 min-w-0">{children}</main>
      </div>
    </ToastProvider>
  );
}


