"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import { manageCartApi, removeFromCartApi } from "@/api/apiRoutes";
import { normalizeCartResponse, mergeCartData } from "@/lib/cart-types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCartData } from "@/store/slices/cart-slice";
import { useCart } from "@/lib/use-cart";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { CartGroup } from "@/lib/cart-types";

/** Mobile-only checkout items card — desktop shows the same items read-only
 * in CheckoutOrderSummary's sidebar; mobile gets its own editable list with
 * qty steppers (mirrors /cart's mutation pattern: manageCartApi for qty,
 * removeFromCartApi to drop an item down to zero). */
export function MobileItemsSection({
  cartGroup,
  deliveryNote,
  onDeliveryNoteChange,
}: {
  cartGroup: CartGroup;
  deliveryNote: string;
  onDeliveryNoteChange: (note: string) => void;
}) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const { data } = useCart();
  const showPrice = usePriceFormatter();
  const [pending, setPending] = useState(false);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);

  const updateQuantity = async (serviceId: number, qty: number) => {
    if (pending) return;
    setPending(true);
    try {
      const response = await manageCartApi({
        service_id: serviceId,
        qty,
        from_new_app: 1,
        ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
      });
      if (response?.error) throw new Error(response?.message);
      dispatch(setCartData(mergeCartData(data, normalizeCartResponse(response?.data))));
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("common.cart.error"));
    } finally {
      setPending(false);
    }
  };

  const removeItem = async (serviceId: number) => {
    if (pending) return;
    setPending(true);
    try {
      const response = await removeFromCartApi({
        service_id: serviceId,
        from_new_app: 1,
        ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
      });
      if (response?.error) throw new Error(response?.message);
      // remove_from_cart answers with the full remaining cart snapshot, so
      // replace outright — merging would keep stale groups around.
      dispatch(setCartData(normalizeCartResponse(response?.data)));
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("common.cart.error"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-xl bg-bg-primary p-3 xl:hidden">
      <div className="flex w-full flex-col items-start gap-3">
        {cartGroup.items.map((item, index) => {
          const hasDiscount = Boolean(item.discountedPrice && item.discountedPrice < item.price);
          const unitPrice = hasDiscount ? (item.discountedPrice as number) : item.price;
          return (
            <div key={item.serviceId} className="flex w-full flex-col items-start gap-3">
              {index > 0 && <div className="dashed-divider" />}
              <div className="flex w-full items-start justify-center gap-3">
                <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-bg-secondary">
                  {item.image && (
                    <AppImage src={item.image} alt={item.serviceTitle ?? ""} className="size-11 object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col items-start gap-2">
                  <span className="text-xs font-medium text-text-primary">{item.serviceTitle ?? ""}</span>
                  <span className="text-xs text-text-primary">{showPrice(unitPrice)}</span>
                </div>
                <QuantitySelector
                  quantity={item.qty}
                  onDecrease={() =>
                    item.qty <= 1 ? removeItem(item.serviceId) : updateQuantity(item.serviceId, item.qty - 1)
                  }
                  onIncrease={() => {
                    if (item.maxQuantityAllowed && item.qty >= item.maxQuantityAllowed) return;
                    updateQuantity(item.serviceId, item.qty + 1);
                  }}
                  decreaseLabel={t("common.decreaseQuantityAriaLabel", { title: item.serviceTitle ?? "" })}
                  increaseLabel={t("common.increaseQuantityAriaLabel", { title: item.serviceTitle ?? "" })}
                  className="rounded-lg bg-bg-brand-subtle px-2 py-1"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex w-full items-start gap-2">
        {cartGroup.providerSlug && (
          <Link
            href={`/provider-details/${cartGroup.providerSlug}`}
            className="flex items-center gap-2 rounded-xl border border-border-default bg-bg-secondary px-3 py-2"
          >
            <Plus className="size-4 text-icon-primary" />
            <span className="text-xs text-text-primary">{t("checkoutPage.items.addMoreItem")}</span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setNoteSheetOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-border-default bg-bg-secondary px-3 py-2"
        >
          <Pencil className="size-4 text-icon-primary" />
          <span className="text-xs text-text-primary">{t("checkoutPage.items.writeInstruction")}</span>
        </button>
      </div>

      <Drawer open={noteSheetOpen} onOpenChange={setNoteSheetOpen}>
        <DrawerContent className="bg-bg-primary">
          <div className="flex w-full flex-col items-center gap-2 px-4">
            <DrawerTitle className="w-full text-base font-medium text-text-primary">
              {deliveryNote.trim()
                ? t("checkoutPage.items.editInstructionTitle")
                : t("checkoutPage.items.addInstructionTitle")}
            </DrawerTitle>
            <div className="dashed-divider" />
          </div>
          <div className="flex w-full flex-col items-start gap-4 p-4">
            <textarea
              value={deliveryNote}
              onChange={(event) => onDeliveryNoteChange(event.target.value)}
              placeholder={t("checkoutPage.location.addInstructionsPlaceholder")}
              className="h-32 w-full resize-none rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-text-primary outline-none placeholder:text-form-field-placeholder focus-visible:border-border-brand"
            />
            <AppButton variant="primary" size="lg" className="w-full justify-center" onClick={() => setNoteSheetOpen(false)}>
              {t("common.save")}
            </AppButton>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
