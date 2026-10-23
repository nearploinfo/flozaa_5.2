"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getAllPromocodesApi, validatePromoCodeApi, type PromoCodeApi } from "@/api/apiRoutes";
import { extractErrorMessage } from "@/lib/checkout/checkout-types";
import { getAppliedPromoId, setAppliedPromoId, clearAppliedPromoId } from "@/lib/checkout/applied-promo";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Shared promo-code state/logic between checkout (one fixed provider) and
 * the cart page (provider can change via the radio select) — refetches
 * offers and resets any applied promo whenever `providerId` changes.
 *
 * `cartId` (the cart row, or the order/custom-job id standing in for one)
 * persists which promo was applied to localStorage, and re-applies it once
 * the offers list loads — the applied promo itself is otherwise just local
 * state on whichever page mounted this hook, so without this a code applied
 * on /cart silently vanishes on navigating to /checkout (a fresh hook
 * instance starts empty), or on a plain page reload (redux resets too, not
 * just this hook) — get_cart only re-prices with the promo that's actually
 * passed to it, never one it "remembers" server-side. */
export function usePromoCode(providerId: number | null, subtotal: number, cartId?: number | null) {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<PromoCodeApi[]>([]);
  const [offersStatus, setOffersStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeApi | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoStatus, setPromoStatus] = useState<"idle" | "applying" | "error">("idle");
  const [promoError, setPromoError] = useState<string | null>(null);
  // Only auto-reapply once per mount — otherwise removePromo() (which sets
  // appliedPromo back to null) would have this effect immediately undo it.
  const hasAutoAppliedRef = useRef(false);

  useEffect(() => {
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoStatus("idle");
    setPromoError(null);
    hasAutoAppliedRef.current = false;
    if (providerId == null) {
      setOffers([]);
      setOffersStatus("idle");
      return;
    }
    let cancelled = false;
    setOffersStatus("loading");
    getAllPromocodesApi({ provider_id: providerId, limit: 50 })
      .then((response) => {
        if (cancelled) return;
        setOffers(response?.error ? [] : (response?.data ?? []));
        setOffersStatus("loaded");
      })
      .catch(() => {
        if (cancelled) return;
        setOffers([]);
        setOffersStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const applyPromo = async (offer: PromoCodeApi, options?: { silent?: boolean }) => {
    if (providerId == null) return;
    setPromoStatus("applying");
    setPromoError(null);
    try {
      const response = await validatePromoCodeApi({
        partner_id: providerId,
        promo_code_id: offer.id,
        final_total: subtotal,
      });
      if (response?.error) throw new Error(response?.message);
      const discount = Number(response?.data?.[0]?.final_discount ?? 0);
      setAppliedPromo(offer);
      setPromoDiscount(Number.isFinite(discount) ? discount : 0);
      setPromoStatus("idle");
      if (cartId != null) setAppliedPromoId(cartId, offer.id);
      // Not shown for the silent auto-reapply on checkout mount — that's
      // carrying forward a choice the user already made and confirmed on
      // /cart, not a new action of theirs to congratulate.
      if (!options?.silent) {
        toast.success(t("checkoutPage.coupons.applySuccess", { code: offer.promo_code }));
      }
    } catch (error) {
      const message = extractErrorMessage(error, t("checkoutPage.errors.promoInvalid"));
      setPromoStatus("error");
      setPromoError(message);
      toast.error(message);
    }
  };

  useEffect(() => {
    if (offersStatus !== "loaded" || cartId == null || hasAutoAppliedRef.current) return;
    const storedId = getAppliedPromoId(cartId);
    if (storedId == null) return;
    const offer = offers.find((item) => item.id === storedId);
    if (!offer) return;
    hasAutoAppliedRef.current = true;
    applyPromo(offer, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyPromo is redefined every render but stable enough per call; re-running on its identity would refire this
  }, [offersStatus, offers, cartId]);

  const applyPromoCode = (code: string) => {
    const offer = offers.find((item) => item.promo_code.toLowerCase() === code.trim().toLowerCase());
    if (!offer) {
      setPromoStatus("error");
      setPromoError(t("checkoutPage.errors.promoInvalid"));
      return;
    }
    applyPromo(offer);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoStatus("idle");
    setPromoError(null);
    if (cartId != null) clearAppliedPromoId(cartId);
  };

  return {
    offers,
    offersStatus,
    appliedPromo,
    promoDiscount,
    promoStatus,
    promoError,
    applyPromo,
    applyPromoCode,
    removePromo,
  };
}
