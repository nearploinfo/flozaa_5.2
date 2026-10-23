"use client";

import { useQuery } from "@tanstack/react-query";
import { getCountriesApi, type CountryApi, type CountryListResponse } from "@/api/apiRoutes";

/** Public list of active countries — no auth, used to populate address-form country selects. */
export function useCountries() {
  const query = useQuery({
    queryKey: ["countries"],
    queryFn: async (): Promise<CountryApi[]> => {
      const response: CountryListResponse | null = await getCountriesApi();
      if (response?.error) throw new Error(response?.message);
      return response?.data ?? [];
    },
    staleTime: 60 * 60 * 1000,
  });

  return {
    countries: query.data ?? [],
    loading: query.isPending,
  } as const;
}
