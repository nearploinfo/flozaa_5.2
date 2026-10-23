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


export function RemoveProviderSheet({
  open,
  onOpenChange,
  providerId,
  providerName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number | null;
  providerName: string;
}) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!providerId) return;
    setRemoving(true);
    try {
      const response = await removeFromCartApi({
        provider_id: providerId,
        from_new_app: 1,
        ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
      });
      if (response?.error) throw new Error(response?.message);
      // remove_from_cart answers with the full remaining cart snapshot (every
      // provider, not just the one touched) — replace outright instead of
      // merging, otherwise a provider that just emptied out survives the
      // merge as a stale "untouched" group.
      dispatch(setCartData(normalizeCartResponse(response?.data)));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("common.cart.error"));
    } finally {
      setRemoving(false);
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
              {t("cartDropdown.confirmRemoveProviderTitle")}
            </DrawerTitle>
            <p className="text-center text-xs text-text-secondary">
              {t("cartDropdown.confirmRemoveProviderDescription", { provider: providerName })}
            </p>
          </div>

          <div className="flex w-full items-start gap-3 pt-2">
            <AppButton
              variant="primary-outline"
              size="lg"
              className="flex-1 justify-center"
              disabled={removing}
              onClick={() => onOpenChange(false)}
            >
              {t("cartDropdown.keepCart")}
            </AppButton>
            <AppButton
              variant="primary"
              size="lg"
              className="flex-1 justify-center"
              disabled={removing || !providerId}
              onClick={handleRemove}
            >
              {removing ? t("auth.pleaseWait") : t("cartDropdown.removeProviderCta")}
            </AppButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
