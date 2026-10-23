"use client";

import { useEffect } from "react";
import { getSettingsApi } from "@/api/apiRoutes";
import type { CountryPaymentGateway, CountrySettingsApi } from "@/api/apiRoutes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSettings } from "@/store/slices/settings-slice";
import { useCountrySettings } from "@/lib/use-country-settings";
import { toCountrySettingsFallback } from "@/lib/country-settings-fallback";
import type { PaymentGatewaySettings } from "@/lib/checkout/checkout-types";
import { useHasHydrated } from "@/lib/use-has-hydrated";

// get_settings only includes payment_gateways_settings for an authenticated
// request. AppBootstrap's own fetch can land before login (guest browsing,
// or a race with auth rehydration) and nothing there re-fetches afterward —
// so checkout, the one place this data actually matters, refreshes it itself
// on mount instead of trusting whatever AppBootstrap already cached.
let gatewaySettingsFetchInFlight = false;

/** The real get_country_settings endpoint only returns payment_gateways for
 * an authenticated request — it's always [] for a guest, even when gateways
 * are genuinely enabled. So for a guest we can't tell "nothing enabled" apart
 * from "not allowed to see the list" — fall back to the old admin-wide
 * <gateway>_status flags instead of trusting an empty array as gospel. */
function resolveGatewayList(
  authed: boolean,
  country: CountrySettingsApi,
  fallbackList: CountryPaymentGateway[]
): CountryPaymentGateway[] {
  if (!authed) return fallbackList;
  return country.payment_gateways ?? fallbackList;
}

/** Merges the location-resolved country settings into the old
 * get_settings-shaped PaymentGatewaySettings object, so every existing
 * consumer (enable checks, SDK key/currency reads) keeps working unchanged.
 * A gateway's status now comes from the country's gateway list (gated off
 * entirely when payment_gateway_setting === 0); its SDK key/currency come
 * from that list entry when present, otherwise stay as the old blob had
 * them (secrets/mode the country payload doesn't carry). */
function mergeGatewaySettings(
  old: PaymentGatewaySettings,
  country: CountrySettingsApi,
  authed: boolean,
  fallbackList: CountryPaymentGateway[]
): PaymentGatewaySettings {
  const list = country.payment_gateway_setting === 0 ? [] : resolveGatewayList(authed, country, fallbackList);
  const byName = new Map(list.map((g) => [g.gateway, g]));
  const has = (name: string) => byName.has(name);
  const entry = (name: string) => byName.get(name);

  return {
    ...old,
    stripe_status: has("stripe") ? "enable" : "disable",
    stripe_publishable_key: entry("stripe")?.publishable_key ?? old.stripe_publishable_key,
    razorpayApiStatus: has("razorpay") ? "enable" : "disable",
    razorpay_key: entry("razorpay")?.key ?? old.razorpay_key,
    razorpay_currency: entry("razorpay")?.currency || old.razorpay_currency,
    xendit_status: has("xendit") ? "enable" : "disable",
    cashfree_status: has("cashfree") ? "enable" : "disable",
    cashfree_mode: (entry("cashfree")?.mode as PaymentGatewaySettings["cashfree_mode"]) || old.cashfree_mode,
    cod_setting: country.cod_setting != null ? String(country.cod_setting) : old.cod_setting,
    paypal_status: has("paypal") ? "enable" : "disable",
    paystack_status: has("paystack") ? "enable" : "disable",
    paystack_key: entry("paystack")?.key ?? old.paystack_key,
    paystack_currency: entry("paystack")?.currency || old.paystack_currency,
    flutterwave_status: has("flutterwave") ? "enable" : "disable",
  };
}

export function usePaymentGatewaySettings(): PaymentGatewaySettings {
  const dispatch = useAppDispatch();
  const hasHydrated = useHasHydrated();
  const authed = Boolean(useAppSelector((state) => state.auth.token));

  // Wait for redux-persist's auth rehydration first — same reasoning as
  // AppBootstrap's own get_settings fetch: payment_gateways_settings only
  // comes back for an authenticated request, and firing before the
  // persisted token lands in the auth slice sends this unauthenticated,
  // showing no online payment methods at checkout until a full remount.
  useEffect(() => {
    if (!hasHydrated) return;
    if (gatewaySettingsFetchInFlight) return;
    gatewaySettingsFetchInFlight = true;
    getSettingsApi()
      .then((response) => {
        if (response?.data) dispatch(setSettings(response.data));
      })
      .finally(() => {
        gatewaySettingsFetchInFlight = false;
      });
  }, [dispatch, hasHydrated]);

  const generalSettings = useAppSelector(
    (state) => state.settings.data?.general_settings as { currency?: string; decimal_point?: string; country_currency_code?: string } | undefined
  );
  const oldGatewaySettings = useAppSelector(
    (state) => (state.settings.data?.payment_gateways_settings as PaymentGatewaySettings | undefined) ?? {}
  );

  const fallback = toCountrySettingsFallback(generalSettings, oldGatewaySettings);
  const countrySettings = useCountrySettings(fallback);

  return mergeGatewaySettings(oldGatewaySettings, countrySettings, authed, fallback.payment_gateways ?? []);
}
