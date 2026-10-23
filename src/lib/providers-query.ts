import type { ProviderSortBy, ServiceMode } from "@/lib/providers-catalog";

// Static fallback range — only used to size the price slider before the
// real range (get_all_providers' service_min_price/service_max_price) has
// loaded. Never used as an "unset" sentinel; see ProvidersQueryState below.
export const PRICE_MIN = 0;
export const PRICE_MAX = 2000;

export interface ProvidersQueryState {
  search: string;
  sort: string; // UI dropdown value: all | price-desc | price-asc | rating
  page: number; // 0-indexed
  categorySlugs: string[];
  serviceModes: ServiceMode[];
  distanceRanges: string[];
  rating: number | null;
  // null = no price filter applied (full range) — see the matching note in
  // services-query.ts.
  priceMin: number | null;
  priceMax: number | null;
}

export const DEFAULT_PROVIDERS_QUERY: ProvidersQueryState = {
  search: "",
  sort: "all",
  page: 0,
  categorySlugs: [],
  serviceModes: [],
  distanceRanges: [],
  rating: null,
  priceMin: null,
  priceMax: null,
};

export const SORT_VALUE_TO_API: Record<string, ProviderSortBy | undefined> = {
  all: undefined,
  "price-desc": "price_high_to_low",
  "price-asc": "price_low_to_high",
  rating: "highly_rated",
};

// Distance filter checkboxes map 1:1 to "min-max" km buckets the API takes.
export const DISTANCE_OPTION_KEYS = [
  "within1to10",
  "within10to20",
  "within20to30",
  "within30to40",
  "within40to50",
] as const;

export const DISTANCE_OPTION_TO_RANGE: Record<string, string> = {
  within1to10: "1-10",
  within10to20: "10-20",
  within20to30: "20-30",
  within30to40: "30-40",
  within40to50: "40-50",
};

export const SERVICE_MODE_OPTIONS: { key: string; value: ServiceMode }[] = [
  { key: "atYourDoorstep", value: "at_doorstep" },
  { key: "atProviderStore", value: "at_store" },
];

// `get` abstracts over the different shapes of Next's server-side
// `searchParams` object and the client's `URLSearchParams` so both page.tsx
// (SSR) and ProvidersView (client) parse the URL identically.
export function parseProvidersQuery(get: (key: string) => string | null): ProvidersQueryState {
  const pageParam = Number.parseInt(get("page") ?? "1", 10);
  const ratingParam = Number.parseInt(get("rating") ?? "", 10);
  const priceMinParam = Number.parseInt(get("price_min") ?? "", 10);
  const priceMaxParam = Number.parseInt(get("price_max") ?? "", 10);

  return {
    search: get("q") ?? "",
    sort: get("sort") ?? "all",
    page: Number.isFinite(pageParam) && pageParam > 1 ? pageParam - 1 : 0,
    categorySlugs: (get("categories") ?? "").split(",").filter(Boolean),
    serviceModes: (get("service_mode") ?? "")
      .split(",")
      .filter(Boolean) as ServiceMode[],
    distanceRanges: (get("distance") ?? "").split(",").filter(Boolean),
    rating: Number.isFinite(ratingParam) ? ratingParam : null,
    priceMin: Number.isFinite(priceMinParam) ? priceMinParam : null,
    priceMax: Number.isFinite(priceMaxParam) ? priceMaxParam : null,
  };
}

export function buildProvidersQueryString(state: ProvidersQueryState): string {
  const params = new URLSearchParams();
  if (state.search) params.set("q", state.search);
  if (state.sort !== "all") params.set("sort", state.sort);
  if (state.page > 0) params.set("page", String(state.page + 1));
  if (state.categorySlugs.length > 0) params.set("categories", state.categorySlugs.join(","));
  if (state.serviceModes.length > 0) params.set("service_mode", state.serviceModes.join(","));
  if (state.distanceRanges.length > 0) params.set("distance", state.distanceRanges.join(","));
  if (state.rating) params.set("rating", String(state.rating));
  if (state.priceMin != null) params.set("price_min", String(state.priceMin));
  if (state.priceMax != null) params.set("price_max", String(state.priceMax));
  return params.toString();
}
