"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div
        role="status"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top duration-300"
      >
        <Wifi className="h-4 w-4 text-emerald-400 animate-pulse" />
        <span>नेटवर्क पुनः जुड़ गया • सिंक सक्रिय</span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-medium shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top duration-300"
    >
      <WifiOff className="h-4 w-4 text-amber-400" />
      <span>आप ऑफ़लाइन हैं • पहले से खुले पेजेस सुरक्षित हैं</span>
    </div>
  );
}
