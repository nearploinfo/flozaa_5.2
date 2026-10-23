"use client";

import dynamic from "next/dynamic";
import { useEffectiveMapProvider } from "@/lib/use-map-provider";
import { cn } from "@/lib/utils";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapPin {
  id: string;
  position: LatLng;
  selected?: boolean;
  /** Shown as a numbered badge instead of the usual pin — used for a cluster of overlapping pins at the same coordinates. */
  label?: string;
  /** Which icon to draw — defaults to "provider". */
  kind?: "service" | "provider";
}

export interface LocationMapProps {
  center: LatLng;
  zoom?: number;
  onCenterChange?: (center: LatLng) => void;
  className?: string;
  pins?: MapPin[];
  onPinClick?: (id: string) => void;
  /** Fires on a click that lands on the map itself, not a pin/marker — used to clear a pin selection. */
  onBackgroundClick?: () => void;
}

const GoogleLocationMap = dynamic(
  () => import("@/components/maps/google-location-map").then((mod) => mod.GoogleLocationMap),
  { ssr: false }
);

const OsmLocationMap = dynamic(
  () => import("@/components/maps/osm-location-map").then((mod) => mod.OsmLocationMap),
  { ssr: false }
);

/**
 * Renders whichever map provider the admin picked (settings.map_provider).
 * Google needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; OSM/Leaflet needs no key.
 *
 * Both providers' internal controls/panes use z-index values up to ~1000
 * (Leaflet's `.leaflet-top`/`.leaflet-control`, Google's own UI chrome) — far
 * above typical page z-index (e.g. a Dialog's z-50 overlay/content). Without
 * a clipping + stacking-context boundary here, any other <LocationMap> on
 * the page (e.g. list-card previews) can visually escape through dialogs,
 * dropdowns, or other overlays rendered above it. `isolate` contains that
 * z-index range to this box; `overflow-hidden` also keeps rounded corners.
 */
export function LocationMap({ className, ...props }: LocationMapProps) {
  const provider = useEffectiveMapProvider();
  const Map = provider === "google" ? GoogleLocationMap : OsmLocationMap;
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <Map {...props} className="size-full" />
    </div>
  );
}
