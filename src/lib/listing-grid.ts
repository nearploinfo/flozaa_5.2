// Shared grid responsive rules for card listings (/services, /providers,
// /search) so they stay in sync instead of each view hand-rolling its own
// breakpoint classes. Mobile is always single-column; `columns` only changes
// the desktop (xl) column count, and in map view the grid collapses back to
// a single column regardless of `columns`.
export function getListingGridClassName(columns: 1 | 2 | 3, viewMode: "list" | "map" = "list"): string {
  if (viewMode === "map") return "grid grid-cols-1 gap-6";
  const breakpoints =
    columns === 3 ? "sm:grid-cols-2 xl:grid-cols-3" : columns === 2 ? "xl:grid-cols-2" : "2xl:grid-cols-2";
  return `grid grid-cols-1 gap-6 ${breakpoints}`;
}
