"use client";

import { useMemo } from "react";
import { LocationMap, type MapPin } from "@/components/maps/location-map";
import { getDefaultLatLng } from "@/lib/helpers";

export interface ListingMapPin extends MapPin {
  href: string;
}

// Pins whose lat/lng round to the same 5th decimal (~1m) are treated as the
// same location — that's exact-match in practice (multiple services from one
// provider all carry that provider's own coordinates).
function coordKey(pin: ListingMapPin): string {
  return `${pin.position.lat.toFixed(5)},${pin.position.lng.toFixed(5)}`;
}

export function ListingMapView({
  pins,
  kind,
  selectedIds,
  onSelect,
  onDeselect,
  savedLat,
  savedLng,
}: {
  pins: ListingMapPin[];
  kind: "service" | "provider";
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  onDeselect?: () => void;
  savedLat?: number | null;
  savedLng?: number | null;
}) {
  const center = pins[0]?.position ?? getDefaultLatLng(savedLat, savedLng);

  const { renderPins, idsByGroup } = useMemo(() => {
    const groups = new Map<string, ListingMapPin[]>();
    for (const pin of pins) {
      const key = coordKey(pin);
      const group = groups.get(key);
      if (group) group.push(pin);
      else groups.set(key, [pin]);
    }

    const idsByGroup = new Map<string, string[]>();
    const renderPins: MapPin[] = [];
    for (const [key, group] of groups) {
      idsByGroup.set(key, group.map((pin) => pin.id));
      renderPins.push(
        group.length > 1
          ? { id: key, position: group[0].position, label: String(group.length) }
          : { id: group[0].id, position: group[0].position, kind }
      );
    }
    return { renderPins, idsByGroup };
  }, [pins, kind]);

  return (
    <LocationMap
      center={center}
      zoom={12}
      pins={renderPins.map((pin) => ({
        ...pin,
        selected: (idsByGroup.get(pin.id) ?? [pin.id]).some((id) => selectedIds?.includes(id)),
      }))}
      onPinClick={(id) => onSelect?.(idsByGroup.get(id) ?? [id])}
      onBackgroundClick={onDeselect}
      className="size-full"
    />
  );
}
