import type { CountryApi, RegionApi, GeoBoundary } from "@/api/apiRoutes";

export interface ResolvedLocation {
  countryId: string | null;
  regionId: string | null;
}

function pointInBoundary(lat: number, lng: number, boundary: GeoBoundary | null | undefined): boolean {
  if (!boundary) return false;
  return (
    lat >= boundary.min_lat &&
    lat <= boundary.max_lat &&
    lng >= boundary.min_lng &&
    lng <= boundary.max_lng
  );
}

function boundaryArea(boundary: GeoBoundary): number {
  return (boundary.max_lat - boundary.min_lat) * (boundary.max_lng - boundary.min_lng);
}

/** Picks the smallest-area match among every boundary containing the point —
 * bounding boxes aren't real borders, so a point can fall inside several
 * (e.g. France's box, stretched out to its overseas territories, swallows
 * most of the globe's longitude range at some latitudes). The smallest box
 * that still contains the point is the best guess. */
function smallestContaining<T extends { boundary?: GeoBoundary | null }>(
  lat: number,
  lng: number,
  items: T[]
): T | null {
  let best: T | null = null;
  let bestArea = Infinity;
  for (const item of items) {
    if (!pointInBoundary(lat, lng, item.boundary)) continue;
    const area = boundaryArea(item.boundary as GeoBoundary);
    if (area < bestArea) {
      best = item;
      bestArea = area;
    }
  }
  return best;
}

/** Best-effort match only — the backend still infers the authoritative
 * country/region from lat/lng server-side when left unset. This just lets
 * the address form show that same country/region pre-selected instead of a
 * blank placeholder. Pure bounding-box containment, synchronous, no network
 * call — replaces the old reverse-geocode-then-fuzzy-name-match approach,
 * which broke on abbreviated names ("UK" not matching "United Kingdom") and
 * substring collisions ("India" matching inside "British Indian Ocean
 * Territory"). A handful of countries/regions have no boundary data (null)
 * and simply won't auto-resolve — the backend's own server-side inference
 * still applies when the field is left unset either way. */
export function resolveLocationFromBoundaries(
  lat: number,
  lng: number,
  countries: CountryApi[],
  regions: RegionApi[]
): ResolvedLocation {
  const country = smallestContaining(lat, lng, countries);
  const region = smallestContaining(lat, lng, regions);
  return {
    countryId: country ? String(country.id) : null,
    regionId: region ? String(region.id) : null,
  };
}
