import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { useCountrySettings } from "@/lib/use-country-settings";
import { toCountrySettingsFallback } from "@/lib/country-settings-fallback";
import type { CountrySettingsApi } from "@/api/apiRoutes";
import type { PaymentGatewaySettings } from "@/lib/checkout/checkout-types";

/** A booking/transaction/order carries its own currency, fixed at the
 * country it was created in — pass this to override the viewer's current
 * location currency when formatting that record's amounts. */
export interface CurrencyOverride {
  symbol: string;
  decimalPlaces?: number;
}

function formatPrice(
  price: number | string | null | undefined,
  currency: CountrySettingsApi | undefined,
  override?: CurrencyOverride
): string {
  if (price === null || price === undefined || price === "" || price === "null") {
    return price as string;
  }

  const currencyCode = currency?.currency || "USD";
  const currencySymbol = override?.symbol || currency?.currency_symbol || "$";
  const decimalPointsRaw = override?.decimalPlaces ?? currency?.currency_decimal_places;

  let decimalDigits =
    typeof decimalPointsRaw === "number" ? decimalPointsRaw : parseInt(decimalPointsRaw ?? "", 10);
  if (isNaN(decimalDigits) || decimalDigits < 0 || decimalDigits > 20) {
    decimalDigits = 2;
  }

  const numericPrice = parseFloat(price.toString().replace(/,/g, ""));
  if (isNaN(numericPrice)) {
    return `${currencySymbol}${(0).toFixed(decimalDigits)}`;
  }

  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";

  try {
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      throw new Error("Invalid currency code format");
    }

    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
    });
    const formattedNumber = formatter.format(numericPrice);

    const currencyFormatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "symbol",
    });
    const sampleFormatted = currencyFormatter.format(1);
    const isSymbolPrefix = /^[^\d]/.test(sampleFormatted);

    return isSymbolPrefix
      ? `${currencySymbol}${formattedNumber}`
      : `${formattedNumber} ${currencySymbol}`;
  } catch {
    const numberFormatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
    });
    const formattedNumber = numberFormatter.format(numericPrice);
    return `${currencySymbol}${formattedNumber}`;
  }
}

/** Resolves the full country-settings row (currency, date/time format, …) for the
 * customer's current location — shared by `useShowPrice` and the date/time
 * formatting hooks in `use-date-time-formatter.ts`. */
export function useResolvedCountrySettings(): CountrySettingsApi {
  const generalSettings = useAppSelector(
    (state) => state.settings.data?.general_settings as { currency?: string; decimal_point?: string; country_currency_code?: string } | undefined
  );
  const paymentGatewaySettings = useAppSelector(
    (state) => state.settings.data?.payment_gateways_settings as PaymentGatewaySettings | undefined
  );
  return useCountrySettings(toCountrySettingsFallback(generalSettings, paymentGatewaySettings));
}

function useResolvedCurrency(): CountrySettingsApi {
  return useResolvedCountrySettings();
}

/**
 * Formats a price using the currency/decimal-places for the customer's
 * current location (v5.2.0 — country-specific, via get_country_settings),
 * falling back to the old admin-wide general_settings currency while that
 * hasn't resolved yet. Pass `override` for a record that carries its own
 * fixed currency (a past booking/transaction) instead of the current
 * location's. The settings slice is persisted to localStorage, so it's
 * readable before the client has hydrated — reading it unconditionally
 * would make the first client render disagree with the settings-less SSR
 * markup. Guard with useHasHydrated so the first client render matches SSR
 * exactly, then the real formatting swaps in a tick later.
 */
export function useShowPrice(
  price: number | string | null | undefined,
  override?: CurrencyOverride
): string {
  const hasHydrated = useHasHydrated();
  const currency = useResolvedCurrency();

  return formatPrice(price, hasHydrated ? currency : undefined, override);
}

/**
 * Just the currency symbol for the customer's current location (e.g. "$",
 * "₹") — for inline prefixes on price inputs, not a fully formatted amount.
 * Same hydration guard as useShowPrice.
 */
export function useCurrencySymbol(): string {
  const hasHydrated = useHasHydrated();
  const currency = useResolvedCurrency();
  return hasHydrated ? currency.currency_symbol : "$";
}

/**
 * Same as useShowPrice but returns a formatter function instead of a single
 * formatted value — for lists (e.g. cart items in a .map()) where calling a
 * hook once per item would violate the rules of hooks. Each call can pass
 * its own `override` for records with a fixed currency of their own.
 */
export function usePriceFormatter(): (
  price: number | string | null | undefined,
  override?: CurrencyOverride
) => string {
  const hasHydrated = useHasHydrated();
  const currency = useResolvedCurrency();

  return (price, override) => formatPrice(price, hasHydrated ? currency : undefined, override);
}
