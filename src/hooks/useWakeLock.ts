"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Screen Wake Lock hook for PWA:
 * Prevents mobile screens from sleeping/dimming during active quiz sessions or long reading.
 */
export function useWakeLock(autoRequest: boolean = false) {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "wakeLock" in navigator);
  }, []);

  const request = useCallback(async () => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return false;
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      wakeLockRef.current = sentinel;
      setIsLocked(true);

      sentinel.addEventListener("release", () => {
        setIsLocked(false);
        wakeLockRef.current = null;
      });
      return true;
    } catch (err) {
      console.warn("[PWA WakeLock] Could not acquire lock:", err);
      setIsLocked(false);
      return false;
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    if (autoRequest && isSupported) {
      request();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && autoRequest && !wakeLockRef.current) {
        request();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      release();
    };
  }, [autoRequest, isSupported, request, release]);

  return { isSupported, isLocked, request, release };
}
