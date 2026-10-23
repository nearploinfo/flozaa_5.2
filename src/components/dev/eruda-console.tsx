"use client";

import { useEffect } from "react";

// Dev-only on-device console overlay for testing on real phones over LAN,
// where remote Chrome/Safari inspector isn't available (no USB/wireless
// debugging set up). eruda's UMD bundle references `self` at module-eval
// time, which crashes SSR — must only ever be imported client-side, inside
// this effect, never at module top level.
export function ErudaConsole() {
  useEffect(() => {
    let cancelled = false;
    import("eruda")
      .then(({ default: eruda }) => {
        if (cancelled) return;
        if (!document.getElementById("eruda")) eruda.init();
      })
      .catch((error) => {
        console.error("eruda failed to load", error);
        alert(`eruda failed to load: ${String(error)}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
