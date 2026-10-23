"use client";

import { useEffect, useRef } from "react";

/**
 * Watches a sentinel element and calls `onLoadMore` once it enters the
 * viewport. Callers own the actual fetch/append + `hasMore`/`loading`
 * bookkeeping — this only decides *when* to ask for more.
 */
export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Effect deps below intentionally exclude onLoadMore — callers pass a new
  // function identity every render, and re-creating the observer on every
  // render would be wasteful. Read the latest via a ref instead.
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreRef.current();
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return sentinelRef;
}
