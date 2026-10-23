import { useState } from "react";
import { toast } from "sonner";
import { manageCartApi, removeFromCartApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCartData } from "@/store/slices/cart-slice";
import { normalizeCartResponse, mergeCartData, findCartItem } from "@/lib/cart-types";
import { useHasHydrated } from "@/lib/use-has-hydrated";

/** Wires a service card's quantity stepper to manage_cart/remove_from_cart (from_new_app=1 multi-provider cart flow), reading/writing the shared cart redux slice. */
export function useCartQuantity({ serviceId }: { serviceId?: number }) {
  const { t } = useTranslation();
  const { requireAuth } = useRequireAuth();
  const dispatch = useAppDispatch();
  const hasHydrated = useHasHydrated();
  const rawCartData = useAppSelector((state) => state.cart.data);
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  // Cart data only ever exists client-side (fetched post-mount) — reading it
  // before hydration would render a value the server's markup never had.
  const cartData = hasHydrated ? rawCartData : null;
  const [override, setOverride] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  const remoteItem = serviceId ? findCartItem(cartData, serviceId) : undefined;
  const quantity = override ?? remoteItem?.qty ?? 0;
  const maxQuantity = remoteItem?.maxQuantityAllowed;

  const setCartQuantity = async (nextQuantity: number) => {
    if (!serviceId || pending) return;
    if (maxQuantity && nextQuantity > maxQuantity) {
      toast.error(t("common.cart.maxQuantityReached", { count: maxQuantity }));
      return;
    }

    setOverride(nextQuantity);
    setPending(true);

    try {
      const isRemoval = nextQuantity <= 0;
      const response = isRemoval
        ? await removeFromCartApi({
            service_id: serviceId,
            from_new_app: 1,
            ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
          })
        : await manageCartApi({
            service_id: serviceId,
            qty: nextQuantity,
            from_new_app: 1,
            // Same coords as remove_from_cart/get_cart: manage_cart resolves
            // the customer's country from them, and v5.2.0 rejects a provider
            // that doesn't serve the location. Without them it falls back to
            // the saved profile location, which can be a different country
            // than the cart the user is looking at.
            ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
          });
      if (response?.error) throw new Error(response?.message);
      // remove_from_cart answers with the full remaining cart snapshot (every
      // provider, not just the one touched) — replace outright instead of
      // merging, otherwise a provider that just emptied out survives the
      // merge as a stale "untouched" group. manage_cart only patches the one
      // touched provider's group, so that still needs the merge.
      dispatch(
        setCartData(
          isRemoval
            ? normalizeCartResponse(response?.data)
            : mergeCartData(cartData, normalizeCartResponse(response?.data))
        )
      );
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("common.cart.error"));
    } finally {
      setOverride(null);
      setPending(false);
    }
  };

  const addToCart = () => requireAuth(() => setCartQuantity(1));
  const increase = () => requireAuth(() => setCartQuantity(quantity + 1));
  const decrease = () => requireAuth(() => setCartQuantity(Math.max(0, quantity - 1)));

  return { quantity, maxQuantity, pending, addToCart, increase, decrease };
}
