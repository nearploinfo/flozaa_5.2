"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { usePathnameCompat } from "@/lib/next-router-compat";
import { ProviderDetailsView } from "@/components/providers/provider-details-view";
import { OpenInAppSheet } from "@/components/providers/open-in-app-sheet";
import { getAllServicesApi, getProviderDetailsApi } from "@/api/apiRoutes";
import {
  type ProviderDetailApi,
  type ProviderDetailResponse,
} from "@/lib/providers-catalog";
import {
  flattenProviderServices,
  toServiceCardData,
  type ProviderServicesGroupedResponse,
  type ServiceCardData,
} from "@/lib/services-catalog";
import { ProviderDetailsSkeleton } from "@/components/providers/provider-details-skeleton";
import { SomethingWentWrong } from "@/components/layout/something-went-wrong";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { LocationModal } from "@/components/layout/location-modal";
import { siteConfig } from "@/lib/site-config";
import { PRICE_MAX, PRICE_MIN } from "@/lib/services-query";

// Two callers:
// 1. siteConfig.seoEnabled off (static export/shared hosting) — no SSR data
//    at all, this does the full client fetch from a cold start.
// 2. siteConfig.seoEnabled on — getServerSideProps already fetched provider +
//    services and seeds initialProvider/initialServices, but that fetch runs
//    unauthenticated (the token lives in localStorage, unreachable
//    server-side) so personalized fields like is_bookmarked are wrong for a
//    logged-in user until this refetches once client-side (same pattern as
//    home-view.tsx).
export function ProviderDetailsLoader({
  initialProvider = null,
  initialServices = [],
  initialPriceBounds = null,
}: {
  initialProvider?: ProviderDetailApi | null;
  initialServices?: ServiceCardData[];
  initialPriceBounds?: { min: number; max: number } | null;
}) {
  const pathname = usePathnameCompat();
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";
  const router = useRouter();
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);
  const authToken = useAppSelector((state) => state.auth.token);
  // A shared link (`?share=true`) carries the sharer's lat/lng so distance
  // calc matches what they saw — used for this fetch only, not written to
  // the location redux/cookie (that would silently override the visitor's
  // own saved address for the rest of the site).
  const queryLat = Number(router.query.lat);
  const queryLng = Number(router.query.lng);
  const hasQueryLocation = router.isReady && Number.isFinite(queryLat) && Number.isFinite(queryLng);
  const lat = hasQueryLocation ? queryLat : savedLat;
  const lng = hasQueryLocation ? queryLng : savedLng;
  const hasHydrated = useHasHydrated();
  const isFirstRun = useRef(true);
  // No saved location (and no share-link override) once hydration finished
  // — gate instead of silently querying with a default location.
  const needsLocation = hasHydrated && !hasQueryLocation && savedLat == null && savedLng == null;
  const locationGate = <LocationModal open={needsLocation} onOpenChange={() => {}} required />;

  const [provider, setProvider] = useState<ProviderDetailApi | null>(initialProvider);
  const [services, setServices] = useState<ServiceCardData[]>(initialServices);
  const [priceBounds, setPriceBounds] = useState(
    initialPriceBounds ?? { min: PRICE_MIN, max: PRICE_MAX }
  );
  const [notFoundState, setNotFoundState] = useState(false);
  const [fetchFailedState, setFetchFailedState] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (isFirstRun.current) {
      isFirstRun.current = false;
      // SSR already fetched this provider — skip the redundant refetch
      // unless the user is logged in (SSR never had their auth token, so
      // is_bookmarked etc. would be stuck anonymous otherwise).
      if (siteConfig.seoEnabled && initialProvider && !authToken) return;
    }

    if (lat == null || lng == null) return;

    let cancelled = false;
    getProviderDetailsApi({ slug, latitude: lat, longitude: lng }).then(
      (providerResponse: ProviderDetailResponse | null) => {
        if (cancelled) return;
        // A null response means the request itself failed (network/server
        // down) — that's not a 404, show the retryable fallback instead.
        if (providerResponse === null) {
          setFetchFailedState(true);
          return;
        }
        if (providerResponse.error || !providerResponse.data) {
          setNotFoundState(true);
          return;
        }
        setProvider(providerResponse.data);

        getAllServicesApi({
          provider_id: providerResponse.data.partner_id,
          limit: 12,
          latitude: lat,
          longitude: lng,
        }).then((servicesResponse: ProviderServicesGroupedResponse | null) => {
          if (cancelled) return;
          setServices(flattenProviderServices(servicesResponse).map(toServiceCardData));
          if (
            servicesResponse?.service_min_price != null &&
            servicesResponse?.service_max_price != null
          ) {
            setPriceBounds({
              min: servicesResponse.service_min_price,
              max: servicesResponse.service_max_price,
            });
          }
        });
      }
    );
    return () => {
      cancelled = true;
    };
    // authToken is intentionally tracked so login/logout re-fetches this
    // provider's data (is_bookmarked differs once authenticated).
  }, [hasHydrated, slug, lat, lng, authToken, initialProvider]);

  if (fetchFailedState) {
    return (
      <>
        {locationGate}
        <SomethingWentWrong
          onRetry={() => {
            setFetchFailedState(false);
            isFirstRun.current = false;
          }}
        />
      </>
    );
  }

  // Pages Router client components can't call the App-Router-only
  // notFound() — render the same 404 content pages/404.tsx shows instead.
  if (notFoundState) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">404 — Page Not Found</h1>
        <p className="text-muted-foreground">
          The page you are looking for does not exist.
        </p>
      </div>
    );
  }
  if (!provider) {
    return (
      <>
        {locationGate}
        <ProviderDetailsSkeleton />
      </>
    );
  }

  return (
    <>
      {locationGate}
      <ProviderDetailsView provider={provider} services={services} priceBounds={priceBounds} />
      <OpenInAppSheet />
    </>
  );
}
