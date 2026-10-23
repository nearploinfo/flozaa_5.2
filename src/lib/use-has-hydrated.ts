import { useEffect, useState } from "react";

/**
 * True only after the client has mounted and redux-persist has
 * rehydrated. Guard any UI that reads persisted state (location,
 * addresses) with this so the first client render matches the SSR
 * markup exactly, avoiding a hydration mismatch — the persisted
 * value then swaps in a tick later.
 */
export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}
