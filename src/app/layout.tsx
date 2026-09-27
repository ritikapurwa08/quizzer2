import type { Metadata, Viewport } from "next";
import { Google_Sans } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/shared/ConvexClientProvider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegistrar } from "@/components/shared/PwaRegistrar";

const googleSans = Google_Sans({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-google-sans",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "Quizzer — Rajasthan GK Revision",
    template: "%s | Quizzer",
  },
  description: "Fast, distraction-free Rajasthan GK revision for RPSC 2nd Grade, CET and competitive exams.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quizzer",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="hi" suppressHydrationWarning className={googleSans.variable}>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <PwaRegistrar />
              <TooltipProvider delay={300}>{children}</TooltipProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
