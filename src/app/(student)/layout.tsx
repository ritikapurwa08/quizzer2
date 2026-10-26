import { AppSidebar } from "@/components/shared/AppSidebar";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { ToastProvider } from "@/components/ui/Toast";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ToastProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
          <AppSidebar />
          <div className="flex-1 min-w-0 md:pl-64 flex flex-col">
            <main className="mx-auto max-w-5xl w-full px-3.5 sm:px-6 md:px-8 py-5 sm:py-7">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
