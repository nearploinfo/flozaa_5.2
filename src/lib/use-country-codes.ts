"use client";

import { useQuery } from "@tanstack/react-query";
import { getCountryCodesApi, type CountryCodeApi, type CountryCodeListResponse } from "@/api/apiRoutes";

/** Admin-managed dial codes + real flag images, for the phone number field's
 * country picker — replaces react-phone-input-2's built-in flag sprite. */
export function useCountryCodes() {
  const query = useQuery({
    queryKey: ["country-codes"],
    queryFn: async (): Promise<CountryCodeApi[]> => {
      const response: CountryCodeListResponse | null = await getCountryCodesApi();
      if (response?.error) throw new Error(response?.message);
      return response?.data ?? [];
    },
    staleTime: 60 * 60 * 1000,
  });

  return {
    countryCodes: query.data ?? [],
    loading: query.isPending,
  } as const;
}
