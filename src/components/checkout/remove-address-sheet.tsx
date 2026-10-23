"use client";

import { Trash2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Confirmation sheet before deleting a saved address from ManageLocationSheet
 * — same visual pattern as clear-cart-sheet.tsx / remove-provider-sheet.tsx,
 * but the actual deleteAddressApi call is owned by location-section.tsx
 * since it already has the delete-in-flight state and toast handling. */
export function RemoveAddressSheet({
  open,
  onOpenChange,
  removing,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  removing: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-bg-primary">
        <div className="flex flex-col items-center gap-4 px-4 pb-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-bg-brand-subtle">
            <Trash2 className="size-8 text-icon-brand" />
          </div>

          <div className="flex flex-col items-center gap-1 self-stretch">
            <DrawerTitle className="text-center text-base font-bold text-text-primary">
              {t("checkoutPage.location.confirmRemoveAddressTitle")}
            </DrawerTitle>
            <p className="text-center text-xs text-text-secondary">
              {t("checkoutPage.location.confirmRemoveAddressDescription")}
            </p>
          </div>

          <div className="flex w-full items-start gap-3 pt-2">
            <AppButton
              variant="primary-outline"
              size="md"
              className="flex-1 justify-center"
              disabled={removing}
              onClick={() => onOpenChange(false)}
            >
              {t("checkoutPage.location.keepAddress")}
            </AppButton>
            <AppButton
              variant="primary"
              size="md"
              className="flex-1 justify-center"
              disabled={removing}
              onClick={onConfirm}
            >
              {removing ? t("auth.pleaseWait") : t("checkoutPage.location.removeAddress")}
            </AppButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
