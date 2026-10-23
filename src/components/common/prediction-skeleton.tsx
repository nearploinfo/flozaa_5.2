"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder rows for a place-search dropdown while the search is in flight —
 * including the debounce before the request goes out.
 *
 * The previous query's predictions are stale the moment the input changes, so
 * this stands in for them. Without it the dropdown falls through to "no
 * locations found" on every keystroke, which reads as a failed search when the
 * request simply hasn't happened yet. The empty state belongs only to a
 * response that actually came back with nothing.
 *
 * `className` carries the dropdown's own positioning/border classes so it sits
 * exactly where the results list would.
 */
export function PredictionSkeleton({ className }: { className: string }) {
  return (
    <div className={className}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex w-full flex-col gap-1.5 px-3 py-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}
