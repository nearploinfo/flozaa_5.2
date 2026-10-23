"use client";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import { LocationPinIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Store-mode detail sheet, opened from the distance-warning row's text. */
export function ProviderLocationSheet({
  open,
  onOpenChange,
  providerLatitude,
  providerLongitude,
  providerAddress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerLatitude?: number;
  providerLongitude?: number;
  providerAddress?: string;
}) {
  const { t } = useTranslation();
  const hasCoords = providerLatitude != null && providerLongitude != null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-bg-primary">
        <div className="flex w-full flex-col items-center gap-2 px-4">
          <DrawerTitle className="w-full text-base font-medium text-text-primary">
            {t("checkoutPage.location.locationSheetTitle")}
          </DrawerTitle>
          <div className="dashed-divider" />
        </div>

        <div className="flex w-full flex-col items-start gap-3 p-4">
          <div className="flex w-full flex-col items-start gap-3 rounded-xl border border-border-default bg-bg-primary p-3">
            <div className="flex w-full items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                <LocationPinIcon className="size-6 text-icon-primary" />
              </span>
              <span className="flex-1 text-sm font-semibold text-text-primary">
                {t("checkoutPage.location.providerLocationTitle")}
              </span>
            </div>
            {providerAddress ? (
              <span className="text-xs text-text-secondary">{providerAddress}</span>
            ) : (
              hasCoords && (
                <span className="text-xs text-text-secondary">
                  {providerLatitude!.toFixed(5)}, {providerLongitude!.toFixed(5)}
                </span>
              )
            )}
          </div>
        </div>

        <div className="flex w-full items-center gap-4 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
          <AppButton
            variant="primary"
            size="lg"
            className="flex-1 justify-center"
            disabled={!hasCoords}
            onClick={() => {
              if (!hasCoords) return;
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${providerLatitude},${providerLongitude}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
          >
            {t("checkoutPage.location.getDirection")}
          </AppButton>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
