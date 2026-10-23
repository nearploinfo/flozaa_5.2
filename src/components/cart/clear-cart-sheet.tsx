"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import { removeFromCartApi } from "@/api/apiRoutes";
import { normalizeCartResponse } from "@/lib/cart-types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCartData } from "@/store/slices/cart-slice";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Confirmation sheet before wiping every provider/service out of the cart —
 * triggered from the cart mini bar's close button so a stray tap can't
 * silently drop the whole cart. */
export function ClearCartSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      const response = await removeFromCartApi({
        clear_all: 1,
        from_new_app: 1,
        ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
      });
      if (response?.error) throw new Error(response?.message);
      // remove_from_cart answers with the full remaining cart snapshot, so
      // replace outright — merging would keep stale groups around.
      dispatch(setCartData(normalizeCartResponse(response?.data)));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("common.cart.error"));
    } finally {
      setClearing(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-bg-primary">
        <div className="flex flex-col items-center gap-4 px-4 pb-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-bg-brand-subtle">
            <Trash2 className="size-8 text-icon-brand" />
          </div>

          <div className="flex flex-col items-center gap-1 self-stretch">
            <DrawerTitle className="text-center text-base font-bold text-text-primary">
              {t("cartDropdown.confirmClearTitle")}
            </DrawerTitle>
            <p className="text-center text-xs text-text-secondary">
              {t("cartDropdown.confirmClearDescription")}
            </p>
          </div>

          <div className="flex w-full items-start gap-3 pt-2">
            <AppButton
              variant="primary-outline"
              size="lg"
              className="flex-1 justify-center"
              disabled={clearing}
              onClick={() => onOpenChange(false)}
            >
              {t("cartDropdown.keepCart")}
            </AppButton>
            <AppButton
              variant="primary"
              size="lg"
              className="flex-1 justify-center"
              disabled={clearing}
              onClick={handleClear}
            >
              {clearing ? t("auth.pleaseWait") : t("cartDropdown.clearCart")}
            </AppButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
