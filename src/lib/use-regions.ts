"use client";

import { useQuery } from "@tanstack/react-query";
import { getRegionsApi, type RegionApi, type RegionListResponse } from "@/api/apiRoutes";

/** Regions of a single country — fetched after the user picks a country in an address form. */
export function useRegions(countryId: number | string | null | undefined) {
  const query = useQuery({
    queryKey: ["regions", countryId],
    queryFn: async (): Promise<RegionApi[]> => {
      const response: RegionListResponse | null = await getRegionsApi({ country_id: countryId as string | number });
      if (response?.error) throw new Error(response?.message);
      return response?.data ?? [];
    },
    enabled: Boolean(countryId),
    staleTime: 60 * 60 * 1000,
  });

  return {
    regions: query.data ?? [],
    loading: query.isPending && Boolean(countryId),
  } as const;
}
