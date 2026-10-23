"use client";

import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { getAllProvidersApi } from "@/api/apiRoutes";
import {
  toNearbyProviderCard,
  type ProviderListItemApi,
  type NearbyProvider,
} from "@/lib/providers-catalog";
import { DISTANCE_OPTION_TO_RANGE } from "@/lib/providers-query";
import type { ProviderFiltersValue } from "@/components/providers/provider-filters";
import { siteConfig } from "@/lib/site-config";

const PAGE_SIZE = 9;

interface ProvidersPage {
  items: NearbyProvider[];
  total: number;
  priceBounds: { min: number; max: number } | null;
}

/**
 * Infinite-scroll providers listing, cached and paginated by TanStack Query.
 * Same shape as useServicesListing — see that file for the queryKey/
 * initialData/placeholderData reasoning.
 */
export function useProvidersListing(params: {
  search: string;
  sort: string;
  sortApi: string | undefined;
  filters: ProviderFiltersValue;
  lat: number | null;
  lng: number | null;
  authed: boolean;
  enabled: boolean;
  // See useServicesListing — same guard against re-seeding a new queryKey
  // with a stale SSR snapshot once params diverge from what SSR fetched.
  isInitialParams: boolean;
  initialProviders: NearbyProvider[];
  initialTotal: number;
}) {
  const distanceRanges = params.filters.distanceRanges.map((key) => DISTANCE_OPTION_TO_RANGE[key]).filter(Boolean);

  const query = useInfiniteQuery({
    queryKey: ["providers", params.search, params.sort, params.filters, params.lat, params.lng, params.authed],
    queryFn: async ({ pageParam }): Promise<ProvidersPage> => {
      const response = await getAllProvidersApi({
        latitude: params.lat ?? undefined,
        longitude: params.lng ?? undefined,
        search: params.search || undefined,
        limit: PAGE_SIZE,
        offset: pageParam,
        category_slug: params.filters.categorySlugs.length > 0 ? params.filters.categorySlugs : undefined,
        service_mode: params.filters.serviceModes.length > 0 ? params.filters.serviceModes : undefined,
        distance_range: distanceRanges.length > 0 ? distanceRanges : undefined,
        rating_min: params.filters.rating ?? undefined,
        price_min: params.filters.priceMin ?? undefined,
        price_max: params.filters.priceMax ?? undefined,
        sort_by: params.sortApi,
      });
      const items: ProviderListItemApi[] = response?.data ?? [];
      return {
        items: items.map(toNearbyProviderCard),
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
    initialData: siteConfig.seoEnabled && params.isInitialParams
      ? { pages: [{ items: params.initialProviders, total: params.initialTotal, priceBounds: null }], pageParams: [0] }
      : undefined,
    placeholderData: keepPreviousData,
    enabled: params.enabled,
  });

  const providers = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages.at(-1)?.total ?? params.initialTotal;
  const priceBounds = query.data?.pages.map((page) => page.priceBounds).find(Boolean) ?? null;

  return {
    providers,
    total,
    priceBounds,
    hasFetched: query.data !== undefined,
    isRefetching: query.isFetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
  };
}
