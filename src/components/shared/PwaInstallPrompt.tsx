"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari navigator.standalone check
      window.navigator.standalone === true;

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // Check dismissal cooldown (7 days)
    const dismissedAt = localStorage.getItem("quizzer_pwa_dismissed");
    if (dismissedAt) {
      const timePassed = Date.now() - parseInt(dismissedAt, 10);
      if (timePassed < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If on iOS and not standalone, show prompt after 4 seconds of engagement
    if (isIosDevice && !isStandaloneMode && !dismissedAt) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("quizzer_pwa_dismissed", Date.now().toString());
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="rounded-2xl bg-zinc-900/95 border border-sky-500/30 p-4 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-amber-400 to-sky-500" />

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white shadow-md">
            <Smartphone className="h-5 w-5" />
          </div>

          <div className="flex-1 pr-6">
            <h4 className="text-sm font-semibold text-zinc-100">
              Quizzer PWA ऐप इंस्टॉल करें
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              तेज़ स्पीड, ऑफ़लाइन मोड और बिना किसी रुकावट के राजस्थान GK रिवीज़न जारी रखें।
            </p>

            {isIOS && !deferredPrompt ? (
              <div className="mt-2.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-2">
                <Share className="h-4 w-4 text-sky-400 shrink-0" />
                <span>Safari में <strong>Share</strong> दबाएँ फिर <strong>&quot;Add to Home Screen&quot;</strong> चुनें।</span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  इंस्टॉल करें
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
                >
                  बाद में
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="बंद करें"
            className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-200 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
