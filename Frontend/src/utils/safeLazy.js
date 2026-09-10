import { lazy } from "react";

/**
 * Robust lazy import wrapper for React + Vite single page applications.
 * Automatically catches stale bundle chunk errors (e.g. after a Vercel deployment)
 * and safely reloads the page to load the latest deployment without crashing.
 */
export function safeLazy(importFn) {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.warn("⚡ Dynamic import failed (stale chunk or network error). Reloading page...", error);

      const retryKey = "vegah_lazy_chunk_retry_timestamp";
      const lastRetry = sessionStorage.getItem(retryKey);
      const now = Date.now();

      // Only auto-reload if we haven't reloaded in the last 12 seconds to prevent infinite reload loops
      if (!lastRetry || now - parseInt(lastRetry, 10) > 12000) {
        sessionStorage.setItem(retryKey, String(now));
        window.location.reload();
        return new Promise(() => {}); // Suspend until browser reloads page
      }

      throw error;
    }
  });
}
