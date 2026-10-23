"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import type { RouteMapProps } from "@/components/maps/route-map";
import { useIsDarkMode } from "@/lib/use-is-dark-mode";

const fromIcon = divIcon({
  className: "",
  html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C7.58 15 4 16.79 4 19V21H20V19C20 16.79 16.42 15 12 15ZM8 9C8 10.0609 8.42143 11.0783 9.17157 11.8284C9.92172 12.5786 10.9391 13 12 13C13.0609 13 14.0783 12.5786 14.8284 11.8284C15.5786 11.0783 16 10.0609 16 9H8ZM11.5 2C11.2 2 11 2.21 11 2.5V5.5H10V3C10 3 7.75 3.86 7.75 6.75C7.75 6.75 7 6.89 7 8H17C16.95 6.89 16.25 6.75 16.25 6.75C16.25 3.86 14 3 14 3V5.5H13V2.5C13 2.21 12.81 2 12.5 2H11.5Z" fill="#0079FF"/>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 28],
});

const toIcon = divIcon({
  className: "",
  html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" fill="#0079FF" stroke="white" stroke-width="3"/>
  </svg>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function FitRoute({ from, to }: RouteMapProps) {
  const map = useMap();
  useEffect(() => {
    if (to) {
      map.fitBounds(
        [
          [from.lat, from.lng],
          [to.lat, to.lng],
        ],
        { padding: [60, 60] }
      );
    } else {
      map.setView(from, 16);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit on coordinate values, not object identity
  }, [map, from.lat, from.lng, to?.lat, to?.lng]);
  return null;
}

// Leaflet computes its container's pixel size once at init — inside a Dialog
// that animates/mounts, the real size isn't final yet, so tiles can render
// into a stale-sized box. Force a recalculation once it settles.
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Softens the raw OSM tiles (light mode only — the dark tileset is already
// styled) to match the app's muted map look instead of stock OSM's saturated
// colors.
function LightTileFilter() {
  const map = useMap();
  useEffect(() => {
    const pane = map.getPane("tilePane");
    if (pane) pane.style.filter = "grayscale(1) brightness(1.08) contrast(0.92)";
    return () => {
      if (pane) pane.style.filter = "";
    };
  }, [map]);
  return null;
}

export function OsmRouteMap({ from, to, className }: RouteMapProps) {
  const isDark = useIsDarkMode();

  return (
    <MapContainer center={from} zoom={16} className={className ?? "size-full"} scrollWheelZoom>
      {isDark ? (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
      ) : (
        <>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            subdomains={["a", "b", "c"]}
            maxZoom={19}
          />
          <LightTileFilter />
        </>
      )}
      <Marker position={from} icon={fromIcon} />
      {to && <Marker position={to} icon={toIcon} />}
      {to && <Polyline positions={[from, to]} pathOptions={{ color: "#1565C0", opacity: 0.8, weight: 4 }} />}
      <FitRoute from={from} to={to} />
      <InvalidateSizeOnMount />
    </MapContainer>
  );
}
