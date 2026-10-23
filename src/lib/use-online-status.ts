import { useEffect, useState } from "react";

/**
 * True once the client has mounted and detected it's offline (browser
 * `online`/`offline` events). Starts `false` on both server and first
 * client render — `navigator.onLine` is unavailable during SSR and reading
 * it immediately would cause a hydration mismatch — then updates a tick
 * later once mounted, same pattern as `useHasHydrated`.
 */
export function useOnlineStatus(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
}
