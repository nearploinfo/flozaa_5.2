import { useEffect, useState } from "react";

/**
 * Theme lives as a `dark` class on <html> (see theme-toggle.tsx), not in
 * Redux — no dispatched event on change, so a MutationObserver is the only
 * way for other mounted components to notice a toggle.
 */
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from DOM class set by the theme init script, not derivable from props/state
    setIsDark(root.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
