import { Navbar } from "@/components/shared/Navbar";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { ToastProvider } from "@/components/ui/Toast";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ToastProvider>
        <div className="min-h-screen">
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
