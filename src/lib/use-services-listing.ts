"use client";

import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { getAllServicesApi } from "@/api/apiRoutes";
import { toServiceCardData, type ServiceListItemApi, type ServiceCardData } from "@/lib/services-catalog";
import { toDurationRange } from "@/lib/services-query";
import type { ServiceFiltersValue } from "@/components/services/service-filters";
import { siteConfig } from "@/lib/site-config";

const PAGE_SIZE = 10;

interface ServicesPage {
  items: ServiceCardData[];
  total: number;
  priceBounds: { min: number; max: number } | null;
}

/**
 * Infinite-scroll services listing, cached and paginated by TanStack Query.
 * A queryKey change (filters/search/sort/location/auth) refetches from
 * offset 0; `fetchNextPage` appends the next page under the same key.
 * `placeholderData: keepPreviousData` keeps the last-known list on screen
 * through both kinds of transition instead of flashing a blank grid.
 */
export function useServicesListing(params: {
  search: string;
  sort: string;
  sortApi: string | undefined;
  filters: ServiceFiltersValue;
  lat: number | null;
  lng: number | null;
  authed: boolean;
  enabled: boolean;
  // True only while search/sort/filters/lat/lng/authed still match exactly
  // what getServerSideProps fetched with. Once any of those diverge (user
  // changes a filter, or the location cookie resolves to something SSR
  // didn't see), this must flip false — otherwise `initialData` below keeps
  // re-seeding every new queryKey with that stale, no-longer-matching SSR
  // snapshot instead of letting TanStack actually fetch for the new key.
  isInitialParams: boolean;
  initialServices: ServiceCardData[];
  initialTotal: number;
}) {
  const durationRange = toDurationRange(params.filters.durations);

  const query = useInfiniteQuery({
    queryKey: ["services", params.search, params.sort, params.filters, params.lat, params.lng, params.authed],
    queryFn: async ({ pageParam }): Promise<ServicesPage> => {
      const response = await getAllServicesApi({
        latitude: params.lat ?? undefined,
        longitude: params.lng ?? undefined,
        search: params.search || undefined,
        limit: PAGE_SIZE,
        offset: pageParam,
        category_slugs: params.filters.categorySlugs.length > 0 ? params.filters.categorySlugs : undefined,
        duration_min: durationRange.min,
        duration_max: durationRange.max,
        rating_min: params.filters.rating ?? undefined,
        price_min: params.filters.priceMin ?? undefined,
        price_max: params.filters.priceMax ?? undefined,
        sort_by: params.sortApi,
      });
      const items: ServiceListItemApi[] = response?.data ?? [];
      return {
        items: items.map(toServiceCardData),
        total: response?.total ?? items.length,
        priceBounds:
          response?.service_min_price != null && response?.service_max_price != null
            ? { min: response.service_min_price, max: response.service_max_price }
            : null,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    // Only seed the SSR page's own data, and only for the exact queryKey SSR
    // fetched it for — when SEO/SSR is off, or once any param (filters,
    // location, auth) has diverged from what SSR saw, fall through to a
    // real fetch (and a skeleton/spinner) instead of showing a stale or
    // mismatched snapshot as if it were already-loaded data.
    initialData: siteConfig.seoEnabled && params.isInitialParams
      ? { pages: [{ items: params.initialServices, total: params.initialTotal, priceBounds: null }], pageParams: [0] }
      : undefined,
    placeholderData: keepPreviousData,
    enabled: params.enabled,
  });

  const services = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages.at(-1)?.total ?? params.initialTotal;
  const priceBounds = query.data?.pages.map((page) => page.priceBounds).find(Boolean) ?? null;

  return {
    services,
    total,
    priceBounds,
    hasFetched: query.data !== undefined,
    isRefetching: query.isFetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
  };
}
