import { useEffect, useState } from "react";

export interface GeocodeResult {
  lat: number;
  lng: number;
}

// Module-level so repeated opens of the same tracking modal (or any other
// caller) don't re-hit Nominatim for an address we've already resolved —
// its usage policy caps unauthenticated client-side use at ~1 req/sec.
const cache = new Map<string, GeocodeResult | null>();

/** Turns a free-text address into a lat/lng via OpenStreetMap's Nominatim
 * (no API key, works regardless of which map_provider renders the tiles) —
 * used where the backend only gives us an address string, not coordinates
 * (e.g. a booking's customer address for the live-tracking route line). */
export function useGeocode(address: string | null | undefined): GeocodeResult | null {
  const [result, setResult] = useState<GeocodeResult | null>(() =>
    address ? (cache.get(address) ?? null) : null
  );

  useEffect(() => {
    if (!address) {
      setResult(null);
      return;
    }
    if (cache.has(address)) {
      setResult(cache.get(address) ?? null);
      return;
    }
    let cancelled = false;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`)
      .then((response) => response.json())
      .then((data: { lat: string; lon: string }[]) => {
        if (cancelled) return;
        const match = data[0];
        const geocoded = match ? { lat: Number(match.lat), lng: Number(match.lon) } : null;
        cache.set(address, geocoded);
        setResult(geocoded);
      })
      .catch(() => {
        if (!cancelled) {
          cache.set(address, null);
          setResult(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return result;
}
