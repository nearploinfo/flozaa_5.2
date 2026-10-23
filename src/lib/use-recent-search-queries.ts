import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "edemand-recent-search-queries";
const MAX_ENTRIES = 6;

function readStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/** Recent header-search text queries — sessionStorage (clears when the tab
 * closes), same pattern as useRecentLocationSearches. */
export function useRecentSearchQueries() {
  const [queries, setQueries] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from sessionStorage, not derivable from props/state
    setQueries(readStored());
  }, []);

  const addRecentQuery = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQueries((current) => {
      const deduped = current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...deduped].slice(0, MAX_ENTRIES);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // sessionStorage unavailable (private mode, quota) — keep the in-memory list only.
      }
      return next;
    });
  }, []);

  const clearRecentQueries = useCallback(() => {
    setQueries([]);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { recentQueries: queries, addRecentQuery, clearRecentQueries };
}
