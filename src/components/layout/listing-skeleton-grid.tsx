import type { ComponentType } from "react";
import { getListingGridClassName } from "@/lib/listing-grid";

// Shared loading-state grid for card listings (/services, /providers) — same
// responsive rules as the real grid via getListingGridClassName, just filled
// with skeleton cards instead of data.
export function ListingSkeletonGrid({
  columns,
  viewMode = "list",
  count,
  Skeleton,
}: {
  columns: 1 | 2 | 3;
  viewMode?: "list" | "map";
  count: number;
  Skeleton: ComponentType;
}) {
  return (
    <div className={getListingGridClassName(columns, viewMode)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} />
      ))}
    </div>
  );
}
