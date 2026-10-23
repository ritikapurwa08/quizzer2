/**
 * PWA Badging API utilities:
 * Allows setting an unread / due revision badge on the installed PWA app icon.
 */
export async function setAppBadge(count?: number): Promise<boolean> {
  if (typeof window === "undefined" || !("setAppBadge" in navigator)) {
    return false;
  }
  try {
    if (typeof count === "number" && count > 0) {
      await (navigator as Navigator & { setAppBadge: (c: number) => Promise<void> }).setAppBadge(count);
    } else {
      await (navigator as Navigator & { setAppBadge: () => Promise<void> }).setAppBadge();
    }
    return true;
  } catch (err) {
    console.debug("[PWA Badge] Failed to set badge:", err);
    return false;
  }
}

export async function clearAppBadge(): Promise<boolean> {
  if (typeof window === "undefined" || !("clearAppBadge" in navigator)) {
    return false;
  }
  try {
    await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
    return true;
  } catch (err) {
    console.debug("[PWA Badge] Failed to clear badge:", err);
    return false;
  }
}
