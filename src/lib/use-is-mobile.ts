import { useEffect, useState } from "react";

/** Matches this app's `xl:` Tailwind breakpoint (1200px) — the mobile app
 * shell (bottom nav, full-screen sheets) stays up through tablet, only
 * switching to desktop-style centered dialogs from xl. */
const MOBILE_QUERY = "(max-width: 1199px)";

/** SSR-safe: starts `false` (matching the server's markup) and updates after
 * mount, so it never causes a hydration mismatch — only read from effects
 * and event handlers, never used to conditionally render server-rendered
 * markup directly. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from window.matchMedia, not derivable from props/state
    setIsMobile(mql.matches);
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
