"use client";

import { useEffect, useState } from "react";
import { getCartApi } from "@/api/apiRoutes";
import {
  normalizeCartResponse,
  normalizeReorderGroup,
  normalizeCustomJobGroup,
  type CartGroup,
} from "@/lib/cart-types";
import { useAppSelector } from "@/store/hooks";

/**
 * Re-prices one cart the way place_order will charge it.
 *
 * As of v5.2.0 the cart total is no longer something the client can derive:
 * `final_total` folds in the tax rules of the customer's country AND region,
 * the tax on the visiting charge, per-fee tax, and the tax the promo removes.
 * get_cart is the only thing that knows those numbers, and it only knows them
 * when it's told which address and which promo to price for — so every change
 * of cart, address or promo has to go back to it (per the 2.13 integrator
 * notes) rather than being patched up locally.
 *
 * Returns the server-priced group, falling back to `fallback` (the redux cart
 * group, or the custom-job/reorder shim) until the first response lands so
 * checkout never renders an empty summary.
 */
export function useCartPricing({
  fallback,
  cartId,
  orderId,
  customJobRequestId,
  bidderId,
  addressId,
  promoCodeId,
  enabled = true,
}: {
  fallback: CartGroup;
  /** The cart row to price. Omit for a custom job (no cart row exists). */
  cartId?: number | null;
  /** Reorder preview instead of a cart — priced the same way. */
  orderId?: number | null;
  /** Custom-job bid preview instead of a cart — must be sent with `bidderId`. */
  customJobRequestId?: number | null;
  /** The bid's provider — must be sent with `customJobRequestId`. */
  bidderId?: number | null;
  /** Decides the country/region the tax and fees come from. */
  addressId?: string | number | null;
  /** Previews the promo; an unusable code comes back as `promoError`. */
  promoCodeId?: number | null;
  enabled?: boolean;
}) {
  // Quantities and line-up change the price too, and a cart mutation
  // (manage_cart/remove_from_cart) answers with its own unpriced snapshot —
  // so the contents are part of what this re-prices on, not just the address
  // and promo. Derived from the fallback group, which is the redux one that
  // those mutations write back to.
  const contentsKey = `${fallback.totalQuantity}:${fallback.subTotal}:${fallback.items.length}`;
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const [priced, setPriced] = useState<CartGroup | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");

  const canPrice = enabled && (cartId != null || orderId != null || customJobRequestId != null);

  useEffect(() => {
    if (!canPrice) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- tracking the fetch this effect owns, not deriving state from props
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    getCartApi({
      from_new_app: 1,
      ...(customJobRequestId != null
        ? { custom_job_request_id: customJobRequestId, bidder_id: bidderId as number }
        : orderId != null
          ? { order_id: orderId }
          : { cart_id: cartId as number }),
      ...(addressId != null ? { address_id: addressId } : {}),
      ...(promoCodeId != null ? { promo_code_id: promoCodeId } : {}),
      // Still sent alongside address_id — the address decides the country and
      // region, these decide the distance (and stand in as the location when
      // there's no usable address).
      ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
    })
      .then((response) => {
        if (cancelled) return;
        if (response?.error) throw new Error(response?.message);
        if (customJobRequestId != null) {
          const group = normalizeCustomJobGroup(response?.data?.custom_job_data, customJobRequestId);
          if (!group) throw new Error("custom_job_data missing");
          setPriced(group);
        } else if (orderId != null) {
          const reorderData = response?.data?.reorder_data;
          if (!reorderData) throw new Error("reorder_data missing");
          setPriced(normalizeReorderGroup(reorderData, orderId));
        } else {
          // cart_id scopes the response to this one cart — and comes back as
          // `cart_data: null` when that cart's provider is in another country,
          // which is a pricing failure, not an empty cart.
          const group = normalizeCartResponse(response?.data)?.carts.find(
            (entry) => entry.cartId === cartId
          );
          if (!group) throw new Error("cart not priced");
          setPriced(group);
        }
        setStatus("loaded");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [canPrice, cartId, orderId, customJobRequestId, bidderId, addressId, promoCodeId, contentsKey, lat, lng]);

  // The last good pricing is kept on screen while the next one is in flight
  // (address or promo change) — dropping back to the unpriced redux group
  // would flash a different total between the two. An outright failure does
  // fall back, since stale numbers there would be wrong rather than just old.
  const group = status === "error" ? fallback : (priced ?? fallback);

  return {
    group,
    /** True when the shown group carries server-side v5.2.0 pricing. */
    isPriced: group === priced,
    status,
  };
}
