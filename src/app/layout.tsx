import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/shared/ConvexClientProvider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Inter — primary Latin/UI font.
 * next/font automatically self-hosts it and injects a preload <link>.
 * Using `display: optional` avoids layout shift; the browser falls back to
 * the system font on first paint and swaps on subsequent loads.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "optional",
});

/** Noto Sans Devanagari — Hindi/Devanagari content only */
const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hindi",
  display: "optional",
});

export const metadata: Metadata = {
  title: "Quizzer",
  description: "Fast, distraction-free revision for competitive exams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className={`${inter.variable} ${notoSansDevanagari.variable}`}>
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
