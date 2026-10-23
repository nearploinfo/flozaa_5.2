"use client";

import { useEffect, useState } from "react";
import { usePathnameCompat } from "@/lib/next-router-compat";
import { ServiceDetailsView } from "@/components/services/service-details-view";
import { getServiceDetailsApi } from "@/api/apiRoutes";
import type { ServiceDetailApi, ServiceDetailResponse } from "@/lib/services-catalog";
import { ServiceDetailsSkeleton } from "@/components/services/service-details-skeleton";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { LocationModal } from "@/components/layout/location-modal";

// Used when siteConfig.seoEnabled is false (static export/shared hosting).
// The HTML file actually served may be the shared fallback shell (built for
// a placeholder slug, since real slugs aren't enumerable at build time) —
// so the real slug is read from the live browser URL, not a build-time prop,
// then fetched client-side.
export function ServiceDetailsLoader() {
  const pathname = usePathnameCompat();
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);
  const hasHydrated = useHasHydrated();
  const needsLocation = hasHydrated && savedLat == null && savedLng == null;
  const locationGate = <LocationModal open={needsLocation} onOpenChange={() => {}} required />;

  const [service, setService] = useState<ServiceDetailApi | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!hasHydrated || savedLat == null || savedLng == null) return;
    let cancelled = false;
    getServiceDetailsApi({ slug, latitude: savedLat, longitude: savedLng }).then((response: ServiceDetailResponse | null) => {
      if (cancelled) return;
      if (!response || response.error || !response.data) {
        setNotFoundState(true);
        return;
      }
      setService(response.data);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, savedLat, savedLng, hasHydrated]);

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
  if (!service) {
    return (
      <>
        {locationGate}
        <ServiceDetailsSkeleton />
      </>
    );
  }

  return <ServiceDetailsView service={service} />;
}
