import { AppSidebar } from "@/components/shared/AppSidebar";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { ToastProvider } from "@/components/ui/Toast";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ToastProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row print:min-h-0 print:bg-white print:text-slate-900 print:block print:p-0 print:m-0">
          <AppSidebar />
          <div className="flex-1 min-w-0 md:pl-64 flex flex-col print:pl-0 print:m-0 print:p-0 print:block print:w-full">
            <main className="mx-auto max-w-5xl w-full px-3.5 sm:px-6 md:px-8 py-5 sm:py-7 print:max-w-none print:w-full print:p-0 print:m-0 print:block">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
