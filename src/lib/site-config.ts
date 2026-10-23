export const siteConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "flozaa",
  version: process.env.NEXT_PUBLIC_VERSION ?? "5.2.0",
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "",
  title: "Flozaa - Your water sports Service Booking Platform",
  description:
    "Discover and book incredible water sports experiences with Flozaa! Find trusted local providers for surfing lessons, scuba diving trips, jet ski rentals, paddleboarding adventures, boat tours, and more. Easily compare options, check availability, and book your next aquatic adventure.",
  keywords: [
    "water sport in sri lanka",
    "Surfing",
    "service booking app",
    "professional services",
    "local service providers",
    "handyman services",
    "surfing in sri lanka",
    "scuba diving in sri lanka",
    "jet ski rentals in sri lanka",
    "paddle boarding in sri lanka",
    "boat tours in sri lanka",
    "watersport booking",
    "water activities",
    "adventure sports",
    "water sports near me",
    "water sport package",
    "best water sport in sri lanka",
    "weligama water sport",
    "mirissa water sport",
    "hikkaduwa water sport",
    "unawatuna water sport",
  ],
  pwaEnabled: true,
  // Parent guard for server-side data fetching. true = dynamic/VPS deploy,
  // pages fetch server-side for SEO. false = static export/shared hosting,
  // no server exists at request time so pages must fetch client-side only.
  seoEnabled: process.env.NEXT_PUBLIC_SEO !== "false",
  // Absolute site origin (e.g. "https://edemand.example.com") — needed to
  // build absolute canonical/OG/twitter URLs. Empty string degrades to
  // relative URLs (still valid HTML) if the env var isn't set.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  // Existing asset (public/icon.png) — used as the OG/twitter image
  // fallback when a page's SEO settings don't specify one.
  defaultOgImage: "/icon.png",
  // GA4 measurement + Microsoft Clarity project id — loaded only after
  // analytics consent is granted (see components/layout/consent-scripts.tsx).
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  // Google AdSense publisher id (e.g. "ca-pub-1234567890123456"). Loaded
  // unconditionally in pages/_document.tsx — Google's Consent Mode v2 stub
  // (also in _document.tsx) already tells adsbygoogle.js to serve
  // non-personalized ads only until consent is granted, so no separate
  // consent gate is needed here the way GA4/Clarity have one.
  adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  // Purely cosmetic: where a map's pin starts before geolocation resolves
  // or the user searches/drags/picks a spot — never sent to an API, never
  // auto-saved as a real location. Each brand running this app should set
  // these to their own service area instead of inheriting eDemand's.
  defaultMapCenter: {
    lat: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_LAT) || 6.9271,
    lng: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_LNG) || 79.8612,
  },
};
