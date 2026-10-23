"use client";

import { useEffect } from "react";
import { getCartApi } from "@/api/apiRoutes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { setCartData, setCartStatus } from "@/store/slices/cart-slice";
import { normalizeCartResponse } from "@/lib/cart-types";

// Several components mount useCart() in the same initial render (cart mini
// bar, header cart dropdown, sheets, etc). They all render before any of
// their effects run, so every instance's `status` closure still reads the
// pre-fetch "idle" value from Redux — the per-instance status check alone
// can't stop them from all firing get_cart at once. This module-level flag
// is read fresh (not from a stale render closure) so the first effect to
// run wins and the rest bail out, in dev and in production alike.
let cartFetchInFlight = false;

// The cart response's is_online_payment_allowed/is_pay_later_allowed (and
// other location-gated fields) only come back accurate when lat/lng are
// sent. The location cookie isn't always readable yet on the very first
// fetch (e.g. it hasn't been set this browser session), so that first
// fetch can land without coordinates and get flagged "loaded" — after
// which the idle-only guard below would never fetch again even once
// location becomes available, silently freezing checkout on a COD-only
// cart until a manual refresh. Track the coordinates the last fetch
// actually used (not just whether it had any) so every subsequent
// location *change* — not only the first "none -> some" transition —
// triggers its own refetch too (e.g. switching the saved address in
// LocationModal while the cart drawer is open).
let lastFetchedLat: number | null = null;
let lastFetchedLng: number | null = null;

/** Loads the logged-in user's active carts (get_cart_new) into redux once per session; every component reads the same store slice afterwards. */
export function useCart() {
  const dispatch = useAppDispatch();
  const hasHydrated = useHasHydrated();
  const loggedIn = useAppSelector((state) => Boolean(state.auth.token));
  const status = useAppSelector((state) => state.cart.status);
  const rawData = useAppSelector((state) => state.cart.data);
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);

  useEffect(() => {
    if (!hasHydrated || !loggedIn || cartFetchInFlight) return;
    const locationReady = lat != null && lng != null;
    const needsInitialFetch = status === "idle";
    const locationChanged = locationReady && (lat !== lastFetchedLat || lng !== lastFetchedLng);
    const needsLocationRefetch = status === "loaded" && locationChanged;
    if (!needsInitialFetch && !needsLocationRefetch) return;
    cartFetchInFlight = true;
    if (locationReady) {
      lastFetchedLat = lat;
      lastFetchedLng = lng;
    }
    dispatch(setCartStatus("loading"));
    getCartApi({
      from_new_app: 1,
      ...(locationReady ? { latitude: lat, longitude: lng } : {}),
    })
      .then((response) => {
        if (response?.error) throw new Error(response?.message);
        dispatch(setCartData(normalizeCartResponse(response?.data)));
      })
      .catch(() => dispatch(setCartStatus("error")))
      .finally(() => {
        cartFetchInFlight = false;
      });
  }, [hasHydrated, loggedIn, status, lat, lng, dispatch]);

  // Cart is fetched client-side only — never expose it before hydration so
  // consumers can't render a value the server's markup never had.
  const data = hasHydrated ? rawData : null;

  return { data, status: hasHydrated ? status : "idle", loggedIn: hasHydrated && loggedIn };
}
