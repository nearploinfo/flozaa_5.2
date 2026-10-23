"use client";

import dynamic from "next/dynamic";
import { useEffectiveMapProvider } from "@/lib/use-map-provider";
import type { LatLng } from "@/components/maps/location-map";
import { cn } from "@/lib/utils";

export interface RouteMapProps {
  from: LatLng;
  to?: LatLng | null;
  className?: string;
}

const GoogleRouteMap = dynamic(
  () => import("@/components/maps/google-route-map").then((mod) => mod.GoogleRouteMap),
  { ssr: false }
);

const OsmRouteMap = dynamic(() => import("@/components/maps/osm-route-map").then((mod) => mod.OsmRouteMap), {
  ssr: false,
});

/** Two-point map (from → to) with a connecting line — for live-tracking-style
 * views where LocationMap's single draggable pin doesn't fit. Separate from
 * LocationMap so the address-picker use case (draggable single pin) never
 * has to carry this component's center-management/fitBounds behavior. */
export function RouteMap({ className, ...props }: RouteMapProps) {
  const provider = useEffectiveMapProvider();
  const Map = provider === "google" ? GoogleRouteMap : OsmRouteMap;
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <Map {...props} className="size-full" />
    </div>
  );
}
