"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { ListingMapView, type ListingMapPin } from "@/components/layout/listing-map-view";
import { useTranslation } from "@/lib/i18n/translation-context";

// Fullscreen below-`lg` counterpart to MapViewOverlay (which only shows the
// real map at `lg`+) — same idea as /search's own mapOpen overlay: a plain
// map with a close button, plus an optional floating card for whichever pin
// is selected.
export function ListingMobileMapOverlay({
  kind,
  pins,
  selectedIds,
  onSelect,
  onDeselect,
  savedLat,
  savedLng,
  onClose,
  cardsRow,
}: {
  kind: "service" | "provider";
  pins: ListingMapPin[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onDeselect: () => void;
  savedLat?: number | null;
  savedLng?: number | null;
  onClose: () => void;
  cardsRow?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary xl:hidden">
      <div className="flex items-center gap-4 border-b border-border-default px-4 py-3">
        <span className="flex-1 text-base font-semibold text-text-primary">
          {t("common.mapViewTitle")}
        </span>
        <AppButton
          variant="secondary-outline"
          size="sm"
          iconOnly
          leftIcon={(iconProps) => <X {...iconProps} />}
          aria-label={t("common.close")}
          onClick={onClose}
        >
          {t("common.close")}
        </AppButton>
      </div>
      <div className="relative flex-1">
        <ListingMapView
          pins={pins}
          kind={kind}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onDeselect={onDeselect}
          savedLat={savedLat}
          savedLng={savedLng}
        />
        {cardsRow && (
          <div className="absolute inset-x-0 bottom-4 flex gap-4 overflow-x-auto scrollbar-none px-4 pb-1">
            {cardsRow}
          </div>
        )}
      </div>
    </div>
  );
}
