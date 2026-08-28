import { Navbar } from "@/components/shared/Navbar";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { ToastProvider } from "@/components/ui/Toast";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ToastProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Navbar />
          <main className="mx-auto max-w-5xl px-3 sm:px-4 md:px-6 py-5 sm:py-6">{children}</main>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
