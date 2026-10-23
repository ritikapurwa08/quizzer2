"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { NetworkStatusBanner } from "./NetworkStatusBanner";
import { PwaInstallPrompt } from "./PwaInstallPrompt";

export function PwaRegistrar() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // If a worker is already waiting (e.g. from a background check)
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdateToast(true);
        }

        // Listen for updates found
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version is installed and waiting
              setWaitingWorker(newWorker);
              setShowUpdateToast(true);
            }
          });
        });
      } catch (error) {
        console.warn("[PWA] Service Worker registration failed:", error);
      }
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }

    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    setShowUpdateToast(false);
  };

  return (
    <>
      <NetworkStatusBanner />
      <PwaInstallPrompt />

      {showUpdateToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-xl bg-zinc-900 border border-sky-500/40 p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-zinc-100">
                नया अपडेट उपलब्ध है
              </p>
              <p className="text-[11px] text-zinc-400">
                नवीनतम फीचर्स और सुधार लागू करने के लिए रिफ्रेश करें।
              </p>
            </div>
            <button
              type="button"
              onClick={handleUpdate}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors shrink-0 cursor-pointer"
            >
              रिफ्रेश
            </button>
          </div>
        </div>
      )}
    </>
  );
}
