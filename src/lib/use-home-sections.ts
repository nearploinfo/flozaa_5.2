import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";

/**
 * Central switchboard for which home-page sections render.
 * Today this reads local Redux state (location/auth); once the
 * home feed comes from an API, only this hook needs to change —
 * page.tsx stays untouched.
 *
 * Persisted state (location) only exists after redux-persist
 * rehydrates client-side, so section visibility must stay at its
 * SSR-safe default (no location, logged out) until hydration is
 * confirmed — otherwise the section list/order can differ between
 * the server render and the client's first paint.
 */
export function useHomeSections() {
  const hasHydrated = useHasHydrated();
  const hasLocation = useAppSelector((state) => Boolean(state.location.current));

  return {
    // Nearby/location-scoped feed sections (services, providers, offers,
    // recommendations, blogs) — need a location to be meaningful.
    showLocationSections: hasHydrated && hasLocation,
    // Pre-location guest CTA/FAQ — only relevant before a location is set.
    showGuestSections: !hasHydrated || !hasLocation,
  };
}
