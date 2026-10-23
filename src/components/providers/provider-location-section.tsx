"use client";

import { Expand, Navigation } from "lucide-react";
import { LocationPinIcon } from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";
import { LocationMap } from "@/components/maps/location-map";
import { useTranslation } from "@/lib/i18n/translation-context";
import { splitAddressLine } from "@/lib/helpers";

export function ProviderLocationSection({
  address,
  latitude,
  longitude,
}: {
  address: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const { t } = useTranslation();
  const hasPosition = latitude != null && longitude != null;

  return (
    <>
      <ProviderLocationMobile address={address} latitude={latitude} longitude={longitude} />

      <div className="hidden flex-col items-start gap-6 self-stretch rounded-xl border border-border-default bg-bg-primary p-6 xl:flex">
        <h2 className="self-stretch text-lg font-medium text-text-primary">
          {t("providerDetails.location.title")}
        </h2>

        <div className="flex items-center gap-6 self-stretch rounded-lg border border-border-default px-4 py-3">
          <div className="flex flex-1 items-center gap-2 self-stretch">
            <span className="flex size-12 items-center justify-center rounded-full border border-border-default bg-bg-secondary p-2">
              <LocationPinIcon className="size-6 text-icon-secondary" />
            </span>
            <div className="flex flex-1 flex-col items-start gap-1">
              <span className="text-base text-text-secondary">{t("providerDetails.location.address")}</span>
              <span className="text-base font-medium text-text-primary">{address}</span>
            </div>
          </div>
          {hasPosition && (
            <AppButton
              variant="primary"
              size="md"
              leftIcon={Navigation}
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              {t("providerDetails.location.viewOnMap")}
            </AppButton>
          )}
        </div>

        {hasPosition && (
          <LocationMap center={{ lat: latitude, lng: longitude }} zoom={14} className="h-96 w-full rounded-xl" />
        )}
      </div>
    </>
  );
}

/** max-lg layout: map first with a jump-to-maps action, address summary below. */
function ProviderLocationMobile({
  address,
  latitude,
  longitude,
}: {
  address: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const { t } = useTranslation();
  const hasPosition = latitude != null && longitude != null;
  const { primary, secondary } = splitAddressLine(address);

  const openDirections = () =>
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      "_blank",
      "noopener,noreferrer"
    );

  return (
    <section className="flex flex-col items-start gap-3 self-stretch rounded-xl bg-bg-primary p-4 xl:hidden">
      <h2 className="text-base font-semibold text-text-primary">
        {t("providerDetails.location.title")}
      </h2>

      {hasPosition && (
        <div className="relative w-full">
          <LocationMap
            center={{ lat: latitude, lng: longitude }}
            zoom={14}
            className="h-48 w-full rounded-xl"
          />
          <button
            type="button"
            onClick={openDirections}
            aria-label={t("providerDetails.location.openInMaps")}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-bg-inverse"
          >
            <Expand className="size-4 text-icon-inverse" />
          </button>
        </div>
      )}

      <div className="flex w-full items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-brand-subtle">
          <LocationPinIcon className="size-5 text-icon-brand" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-text-primary">{primary}</span>
          {secondary && (
            <span className="truncate text-xs text-text-secondary">{secondary}</span>
          )}
        </div>
        {hasPosition && (
          <AppButton
            variant="link"
            size="sm"
            iconOnly
            leftIcon={Navigation}
            aria-label={t("providerDetails.location.viewOnMap")}
            onClick={openDirections}
            className="shrink-0 p-0 text-icon-brand"
          >
            {t("providerDetails.location.viewOnMap")}
          </AppButton>
        )}
      </div>
    </section>
  );
}
