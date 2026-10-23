"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { getCartApi } from "@/api/apiRoutes";
import { normalizeReorderGroup } from "@/lib/cart-types";
import { extractErrorMessage } from "@/lib/checkout/checkout-types";
import { setReorderCartGroup } from "@/store/slices/reorder-slice";
import { useAppDispatch } from "@/store/hooks";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";

/** "Book Again" from a past order: fetches that order's reorder-shaped cart
 * group and hands it to checkout via the reorder redux slice + a
 * `reorderOrderId` query param, mirroring the custom-job checkout seam. */
export function useRebook() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, lang, defaultLocale } = useTranslation();
  const [rebookingId, setRebookingId] = useState<number | null>(null);

  const rebook = async (orderId: number) => {
    if (rebookingId !== null) return;
    setRebookingId(orderId);
    try {
      const response = await getCartApi({ order_id: orderId });
      if (response?.error) throw new Error(response?.message);
      const reorderData = response?.data?.reorder_data;
      if (!reorderData) throw new Error(t("bookings.detail.bookAgainFailed"));
      dispatch(
        setReorderCartGroup({ orderId, cartGroup: normalizeReorderGroup(reorderData, orderId) })
      );
      router.push(localizePath("/checkout", lang, defaultLocale) + `?reorderOrderId=${orderId}`);
    } catch (error) {
      toast.error(extractErrorMessage(error, t("bookings.detail.bookAgainFailed")));
    } finally {
      setRebookingId(null);
    }
  };

  return { rebook, isRebooking: (orderId: number) => rebookingId === orderId };
}
