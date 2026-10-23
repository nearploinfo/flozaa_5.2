import type { ServiceSortBy } from "@/lib/services-catalog";

// Static fallback range — only used to size the price slider before the
// real range (get_all_services' service_min_price/service_max_price) has
// loaded. Never used as an "unset" sentinel; see ServicesQueryState below.
export const PRICE_MIN = 0;
export const PRICE_MAX = 2000;

export interface ServicesQueryState {
  search: string;
  sort: string; // UI dropdown value: all | price-desc | price-asc | rating
  page: number; // 0-indexed
  categorySlugs: string[];
  durations: string[];
  rating: number | null;
  // null = no price filter applied (full range) — NOT the same as PRICE_MIN/
  // PRICE_MAX, which are just the slider's fallback bounds.
  priceMin: number | null;
  priceMax: number | null;
}

export const DEFAULT_SERVICES_QUERY: ServicesQueryState = {
  search: "",
  sort: "all",
  page: 0,
  categorySlugs: [],
  durations: [],
  rating: null,
  priceMin: null,
  priceMax: null,
};

export const SORT_VALUE_TO_API: Record<string, ServiceSortBy | undefined> = {
  all: undefined,
  "price-desc": "price_high_to_low",
  "price-asc": "price_low_to_high",
  rating: "highly_rated",
};

// Duration filter checkboxes represent discrete buckets, but the API only
// takes a single [duration_min, duration_max] range — merge the selected
// buckets into the widest range that covers them.
const DURATION_BUCKETS: Record<string, { min?: number; max?: number }> = {
  under30Min: { max: 29 },
  "30to60Min": { min: 30, max: 60 },
  "1to2Hours": { min: 61, max: 120 },
  "2to4Hours": { min: 121, max: 240 },
  "4PlusHours": { min: 241 },
};

export function toDurationRange(durations: string[]): { min?: number; max?: number } {
  let min: number | undefined;
  let max: number | undefined;
  let unbounded = false;

  for (const key of durations) {
    const bucket = DURATION_BUCKETS[key];
    if (!bucket) continue;
    if (bucket.min !== undefined) min = min === undefined ? bucket.min : Math.min(min, bucket.min);
    if (bucket.max !== undefined) max = max === undefined ? bucket.max : Math.max(max, bucket.max);
    else unbounded = true;
  }

  return { min, max: unbounded ? undefined : max };
}

// `get` abstracts over the different shapes of Next's server-side
// `searchParams` object and the client's `URLSearchParams` so both page.tsx
// (SSR) and ServicesView (client) parse the URL identically.
export function parseServicesQuery(get: (key: string) => string | null): ServicesQueryState {
  const pageParam = Number.parseInt(get("page") ?? "1", 10);
  const ratingParam = Number.parseInt(get("rating") ?? "", 10);
  const priceMinParam = Number.parseInt(get("price_min") ?? "", 10);
  const priceMaxParam = Number.parseInt(get("price_max") ?? "", 10);

  return {
    search: get("q") ?? "",
    sort: get("sort") ?? "all",
    page: Number.isFinite(pageParam) && pageParam > 1 ? pageParam - 1 : 0,
    categorySlugs: (get("categories") ?? "").split(",").filter(Boolean),
    durations: (get("durations") ?? "").split(",").filter(Boolean),
    rating: Number.isFinite(ratingParam) ? ratingParam : null,
    priceMin: Number.isFinite(priceMinParam) ? priceMinParam : null,
    priceMax: Number.isFinite(priceMaxParam) ? priceMaxParam : null,
  };
}

export function buildServicesQueryString(state: ServicesQueryState): string {
  const params = new URLSearchParams();
  if (state.search) params.set("q", state.search);
  if (state.sort !== "all") params.set("sort", state.sort);
  if (state.page > 0) params.set("page", String(state.page + 1));
  if (state.categorySlugs.length > 0) params.set("categories", state.categorySlugs.join(","));
  if (state.durations.length > 0) params.set("durations", state.durations.join(","));
  if (state.rating) params.set("rating", String(state.rating));
  if (state.priceMin != null) params.set("price_min", String(state.priceMin));
  if (state.priceMax != null) params.set("price_max", String(state.priceMax));
  return params.toString();
}
