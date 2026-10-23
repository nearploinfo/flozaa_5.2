"use client";

import { useEffect, useState } from "react";
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api";
import type { RouteMapProps } from "@/components/maps/route-map";
import { useIsDarkMode } from "@/lib/use-is-dark-mode";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

const PROVIDER_ICON_SVG =
  '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15C7.58 15 4 16.79 4 19V21H20V19C20 16.79 16.42 15 12 15ZM8 9C8 10.0609 8.42143 11.0783 9.17157 11.8284C9.92172 12.5786 10.9391 13 12 13C13.0609 13 14.0783 12.5786 14.8284 11.8284C15.5786 11.0783 16 10.0609 16 9H8ZM11.5 2C11.2 2 11 2.21 11 2.5V5.5H10V3C10 3 7.75 3.86 7.75 6.75C7.75 6.75 7 6.89 7 8H17C16.95 6.89 16.25 6.75 16.25 6.75C16.25 3.86 14 3 14 3V5.5H13V2.5C13 2.21 12.81 2 12.5 2H11.5Z" fill="#0079FF"/></svg>';

function providerIcon() {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PROVIDER_ICON_SVG)}`,
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 28),
  };
}

export function GoogleRouteMap({ from, to, className }: RouteMapProps) {
  const { isLoaded } = useJsApiLoader({ id: "google-map-script", googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const isDark = useIsDarkMode();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!map) return;
    if (to) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(from);
      bounds.extend(to);
      map.fitBounds(bounds, 60);
    } else {
      map.panTo(from);
      map.setZoom(16);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit on coordinate values, not object identity
  }, [map, from.lat, from.lng, to?.lat, to?.lng]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`${className ?? "size-full"} flex items-center justify-center rounded-xl bg-bg-secondary text-center text-sm text-text-secondary`}>
        Google Maps API key missing — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={`${className ?? "size-full"} animate-pulse rounded-xl bg-bg-secondary`} />;
  }

  return (
    <GoogleMap
      center={from}
      zoom={16}
      mapContainerClassName={className ?? "size-full"}
      options={{ styles: isDark ? DARK_MAP_STYLES : undefined }}
      onLoad={(instance) => setMap(instance)}
    >
      <MarkerF position={from} icon={providerIcon()} />
      {to && (
        <MarkerF
          position={to}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#0079FF",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
        />
      )}
      {to && (
        <PolylineF path={[from, to]} options={{ strokeColor: "#1565C0", strokeOpacity: 0.8, strokeWeight: 4 }} />
      )}
    </GoogleMap>
  );
}
