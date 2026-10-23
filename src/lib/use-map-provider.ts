import { useAppSelector } from "@/store/hooks";
import { useConsent } from "@/lib/consent-context";

export type MapProvider = "google" | "osm";

/** Admin's raw map_provider setting, with no consent gating applied. */
export function useMapProvider(): MapProvider {
  const mapProvider = useAppSelector((state) => state.settings.data?.map_provider);
  return mapProvider === "google" ? "google" : "osm";
}

/**
 * Google Maps is a third-party script (functional cookie category) — only
 * load it once the visitor has granted functional consent. Falls back to
 * OSM (no third-party script, no consent needed) until then, so the map
 * stays usable instead of going blank. `consent === null` (not yet resolved
 * from the cookie) is treated as not-granted, same as a fresh decline.
 */
export function useEffectiveMapProvider(): MapProvider {
  const provider = useMapProvider();
  const { consent } = useConsent();
  if (provider === "google" && !consent?.functional) return "osm";
  return provider;
}
