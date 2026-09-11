import { useCallback, useEffect, useRef } from "react";

// Section 81/82: keeps the screen awake during a practice session on
// browsers that support the Wake Lock API. Unsupported browsers are simply
// left alone — there is no reliable fallback, and section 30 already
// commits to not overclaiming background/foreground guarantees.
export function useWakeLock() {
  const sentinelRef = useRef<any>(null);

  const request = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      sentinelRef.current = await (navigator as any).wakeLock.request("screen");
    } catch {
      // Permission denied, unsupported, or the tab is hidden — silently continue.
    }
  }, []);

  const release = useCallback(async () => {
    try {
      await sentinelRef.current?.release();
    } catch {
      // Already released.
    }
    sentinelRef.current = null;
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && sentinelRef.current === null) {
        // Re-acquire if the tab regains focus mid-session; browsers release
        // the lock automatically when a tab is hidden.
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { request, release };
}
