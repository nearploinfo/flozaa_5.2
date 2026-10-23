"use client";

import { useLayoutEffect } from "react";
import { applyThemeColors, fetchThemeColors } from "@/lib/theme-colors";
import { applyDynamicFavicon } from "@/lib/dynamic-favicon";
import { getSettingsApi } from "@/api/apiRoutes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setThemeColors } from "@/store/slices/theme-colors-slice";
import { setSettings } from "@/store/slices/settings-slice";
import { setLocation } from "@/store/slices/location-slice";
import { readLocationCookieFromDocument } from "@/lib/location-cookie";
import { useCart } from "@/lib/use-cart";
import { useChatUnreadCounts } from "@/lib/chats/use-chat-unread-counts";
import { useHasHydrated } from "@/lib/use-has-hydrated";

export function AppBootstrap() {
  const dispatch = useAppDispatch();
  const storedColors = useAppSelector((state) => state.themeColors.data);
  const hasHydrated = useHasHydrated();
  useCart();
  useChatUnreadCounts();

  // Apply last-known (persisted) colors immediately, before the network round-trip,
  // so reloads don't flash the fallback palette baked into globals.css.
  useLayoutEffect(() => {
    applyThemeColors(storedColors);
  }, [storedColors]);

  // Location is persisted via a cookie, not redux-persist/localStorage (the
  // server needs to read it too — see app/[lang]/page.tsx). Seed redux from
  // it once on mount; this useLayoutEffect runs before any other component's
  // regular useEffect, so views that read location on mount always see the
  // real value, never the null initial state.
  useLayoutEffect(() => {
    const cookieLocation = readLocationCookieFromDocument();
    if (cookieLocation) dispatch(setLocation(cookieLocation));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    fetchThemeColors().then((fresh) => {
      if (!fresh) return;
      if (storedColors && fresh.updated_at === storedColors.updated_at) return;
      applyThemeColors(fresh);
      dispatch(setThemeColors(fresh));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wait for redux-persist's auth rehydration (signaled by hasHydrated) before
  // fetching — get_settings only includes payment_gateways_settings for an
  // authenticated request, and firing this before the persisted token lands
  // in the auth slice sends it unauthenticated, silently dropping that key
  // for the rest of the session (nothing re-triggers this effect afterward).
  useLayoutEffect(() => {
    if (!hasHydrated) return;
    getSettingsApi().then((response) => {
      if (!response?.data) return;
      dispatch(setSettings(response.data));
      const webSettings = response.data.web_settings as { web_favicon?: string } | undefined;
      applyDynamicFavicon(webSettings?.web_favicon);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  return null;
}
