import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/shared/ConvexClientProvider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { TooltipProvider } from "@/components/ui/tooltip";

const googleSans = Google_Sans({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-google-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quizzer",
  description: "Fast, distraction-free revision for competitive exams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="hi" className={googleSans.variable}>
        <body className="antialiased">
          <ConvexClientProvider>
            <TooltipProvider delay={300}>
              {children}
            </TooltipProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
