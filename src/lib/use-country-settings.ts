"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCountrySettingsApi, type CountrySettingsApi, type CountrySettingsResponse } from "@/api/apiRoutes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { setCountrySettings } from "@/store/slices/country-settings-slice";

// Country boundaries don't need more precision than this to resolve
// correctly, and rounding keeps the query key (and the backend hit) stable
// while the user drags the map/pin around within the same country.
function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The currency/date/time formatting to use for the customer's current
 * location — v5.2.0 made these country-specific instead of one admin-wide
 * setting. Falls back to `fallback` (the old global general_settings-based
 * values) while the location is unknown or the request hasn't resolved yet,
 * so every price on the page never flashes blank. */
export function useCountrySettings(fallback: CountrySettingsApi): CountrySettingsApi {
  const dispatch = useAppDispatch();
  const hasHydrated = useHasHydrated();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  // get_country_settings only returns the real payment_gateways list (and a
  // country-accurate cod_setting) for an authenticated request — it's
  // silently empty for a guest even when gateways are enabled. Without
  // `authed` in the key, a guest-scoped fetch result (cached for an hour —
  // see `staleTime`) keeps being served as-is after the user logs in, so
  // checkout shows no online payment methods until that hour elapses. Keying
  // on auth forces a fresh, authenticated fetch right after login instead.
  const token = useAppSelector((state) => state.auth.token);
  const authed = hasHydrated && Boolean(token);
  const hasCoords = hasHydrated && typeof lat === "number" && typeof lng === "number";
  const roundedLat = hasCoords ? roundCoord(lat as number) : null;
  const roundedLng = hasCoords ? roundCoord(lng as number) : null;

  const query = useQuery({
    queryKey: ["country-settings", roundedLat, roundedLng, authed],
    queryFn: async (): Promise<CountrySettingsApi | null> => {
      const response: CountrySettingsResponse | null = await getCountrySettingsApi({
        latitude: roundedLat as number,
        longitude: roundedLng as number,
      });
      if (response?.error) throw new Error(response?.message);
      return response?.data ?? null;
    },
    enabled: hasCoords,
    staleTime: 60 * 60 * 1000,
  });

  // Mirror the resolved settings into redux so components that need the
  // customer's current currency/date-time/gateway config can read the last
  // known value synchronously (e.g. right after navigation, before this
  // hook's own query re-resolves) instead of only through this hook's
  // per-component react-query cache.
  useEffect(() => {
    if (query.data) dispatch(setCountrySettings(query.data));
  }, [query.data, dispatch]);

  return query.data ?? fallback;
}
