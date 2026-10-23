"use client";

import { useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/components/home/hero";
import { Hero } from "@/components/home/hero";
import { SectionRenderer } from "@/components/home/section-renderer";
import { getHomeScreenDataApi } from "@/api/apiRoutes";
import type { SliderItem, FeaturedSection } from "@/lib/home-screen";
import { siteConfig } from "@/lib/site-config";
import { HomeSkeleton } from "@/components/home/home-skeleton";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";

function toHeroSlide(slider: SliderItem): HeroSlide {
  return {
    id: slider.id,
    // Desktop uses the web-cropped banner, mobile uses the app-cropped one —
    // each falls back to the other if the backend only sent one.
    webImage: slider.slider_web_image || slider.slider_app_image,
    appImage: slider.slider_app_image || slider.slider_web_image,
    href: slider.url || "/services",
    imageAlt: slider.provider_name || "",
  };
}

export function HomeView({
  sliders: initialSliders,
  featuredSections: initialFeaturedSections,
  initialLat = null,
  initialLng = null,
}: {
  sliders: SliderItem[];
  featuredSections: FeaturedSection[];
  /** Location SSR already used (from the cookie) — lets the client skip a redundant refetch when nothing's changed. */
  initialLat?: number | null;
  initialLng?: number | null;
}) {
  const [sliders, setSliders] = useState(initialSliders);
  const [featuredSections, setFeaturedSections] = useState(initialFeaturedSections);
  // SSR already has data when seoEnabled — only the static-export client
  // fetch needs a loading state.
  const [loading, setLoading] = useState(!siteConfig.seoEnabled);

  const hasHydrated = useHasHydrated();
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);
  const authToken = useAppSelector((state) => state.auth.token);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Wait for redux-persist to rehydrate before trusting the saved location —
    // the first client render always has no persisted state yet.
    if (!hasHydrated) return;

    if (isFirstRun.current) {
      isFirstRun.current = false;
      // SSR already fetched using the location cookie (see app/[lang]/page.tsx)
      // — skip the redundant refetch when the client's redux location (seeded
      // from that same cookie in AppBootstrap) still matches what SSR used.
      // But SSR never has an auth token (it lives in localStorage, which the
      // server can't read), so a user who's already logged in on first load
      // must still refetch once to get personalized data like is_bookmarked —
      // otherwise it's stuck at SSR's anonymous view until authToken changes.
      if (siteConfig.seoEnabled && !authToken && savedLat === initialLat && savedLng === initialLng) return;
    }

    getHomeScreenDataApi({
      platform: "web",
      latitude: savedLat ?? undefined,
      longitude: savedLng ?? undefined,
    }).then((response) => {
      setSliders(response?.data?.sliders ?? []);
      setFeaturedSections(response?.data?.featured_sections ?? []);
      setLoading(false);
    });
    // authToken is intentionally tracked so login/logout re-fetches home
    // data (personalized sections can differ once a user is authenticated).
  }, [hasHydrated, savedLat, savedLng, authToken, initialLat, initialLng]);

  if (loading) return <HomeSkeleton />;

  const heroSlides = sliders
    .filter((slider) => slider.slider_web_image || slider.slider_app_image)
    .map(toHeroSlide);

  return (
    // Mobile Figma stacks every section with a flat 24px gap (and 24px top/bottom
    // page padding) — desktop sections already carry their own py-12 etc, so the
    // gap collapses to 0 there to avoid doubling up.
    <div className="flex flex-col gap-6 py-6 max-xl:[&_.commonPY]:py-0! xl:gap-0 xl:py-0">
      {heroSlides.length > 0 && <Hero slides={heroSlides} />}
      <SectionRenderer sections={featuredSections} />
    </div>
  );
}
