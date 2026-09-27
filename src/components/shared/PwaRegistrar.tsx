"use client";

import { useEffect } from "react";

export function PwaRegistrar() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Service worker registered safely
          })
          .catch((error) => {
            console.warn("PWA Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}
