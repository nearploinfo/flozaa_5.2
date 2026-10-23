import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "edemand-recent-location-searches";
const MAX_ENTRIES = 5;

export interface RecentLocationSearch {
  line: string;
  lat: number;
  lng: number;
}

function readStored(): RecentLocationSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Recently picked search results in the location picker — sessionStorage
 * (not localStorage), so it clears when the browser tab/session ends rather
 * than persisting indefinitely like a saved address would. */
export function useRecentLocationSearches() {
  const [entries, setEntries] = useState<RecentLocationSearch[]>([]);

  // Reads sessionStorage after mount only — SSR has no access to it, and
  // reading during render would make the first client render diverge from
  // the server-rendered (empty) markup.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from sessionStorage, not derivable from props/state
    setEntries(readStored());
  }, []);

  const persist = (next: RecentLocationSearch[]) => {
    setEntries(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // sessionStorage unavailable (private mode, quota) — keep the in-memory list only.
    }
  };

  const addRecentSearch = useCallback((entry: RecentLocationSearch) => {
    setEntries((current) => {
      const deduped = current.filter((item) => item.line !== entry.line);
      const next = [entry, ...deduped].slice(0, MAX_ENTRIES);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // sessionStorage unavailable (private mode, quota) — keep the in-memory list only.
      }
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => persist([]), []);

  return { recentSearches: entries, addRecentSearch, clearRecentSearches };
}
