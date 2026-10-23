import type { CountryPaymentGateway, CountrySettingsApi } from "@/api/apiRoutes";
import type { PaymentGatewaySettings } from "@/lib/checkout/checkout-types";

interface GeneralSettings {
  currency?: string;
  decimal_point?: string;
  country_currency_code?: string;
}

/** Reshapes the old admin-wide general_settings + payment_gateways_settings
 * blobs into a CountrySettingsApi row — the fallback useCountrySettings
 * serves while the location-resolved settings (currency, date/time format,
 * cod_setting, payment_gateway_setting, payment_gateways) haven't loaded or
 * the location is unknown yet. Keeps the pre-v5.2.0 behavior intact until
 * the new per-country response takes over. */
export function toCountrySettingsFallback(
  generalSettings: GeneralSettings | undefined,
  paymentGatewaySettings: PaymentGatewaySettings | undefined
): CountrySettingsApi {
  return {
    currency: generalSettings?.country_currency_code ?? "USD",
    currency_symbol: generalSettings?.currency ?? "$",
    currency_decimal_places: Number.parseInt(generalSettings?.decimal_point ?? "2", 10) || 2,
    date_format: "",
    time_format: "",
    cod_setting: paymentGatewaySettings?.cod_setting != null ? Number(paymentGatewaySettings.cod_setting) : 1,
    payment_gateway_setting: 1,
    payment_gateways: toFallbackGatewayList(paymentGatewaySettings),
  };
}

/** The old per-gateway <name>_status flags, reshaped into the new
 * country-settings gateway list shape — used only as a fallback, e.g. for a
 * guest request (the real API never returns payment_gateways without auth). */
function toFallbackGatewayList(gw: PaymentGatewaySettings | undefined): CountryPaymentGateway[] {
  if (!gw) return [];
  const list: CountryPaymentGateway[] = [];
  if (gw.stripe_status === "enable") {
    list.push({ gateway: "stripe", label: "Stripe", mode: "", currency: "", publishable_key: gw.stripe_publishable_key });
  }
  if (gw.razorpayApiStatus === "enable") {
    list.push({ gateway: "razorpay", label: "Razorpay", mode: "", currency: gw.razorpay_currency ?? "", key: gw.razorpay_key });
  }
  if (gw.xendit_status === "enable") {
    list.push({ gateway: "xendit", label: "Xendit", mode: "", currency: "" });
  }
  if (gw.cashfree_status === "enable") {
    list.push({ gateway: "cashfree", label: "Cashfree", mode: gw.cashfree_mode ?? "", currency: "" });
  }
  if (gw.paypal_status === "enable") {
    list.push({ gateway: "paypal", label: "PayPal", mode: "", currency: "" });
  }
  if (gw.paystack_status === "enable") {
    list.push({ gateway: "paystack", label: "Paystack", mode: "", currency: gw.paystack_currency ?? "", key: gw.paystack_key });
  }
  if (gw.flutterwave_status === "enable") {
    list.push({ gateway: "flutterwave", label: "Flutterwave", mode: "", currency: "" });
  }
  return list;
}
