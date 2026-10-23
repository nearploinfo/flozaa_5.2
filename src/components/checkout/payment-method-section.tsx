"use client";

import { CreditCard } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { CheckoutPaymentMethod, PaymentGatewaySettings } from "@/lib/checkout/checkout-types";
import { cn } from "@/lib/utils";
import stripeLogo from "@/assets/payment-methods/stripe.svg";
import razorpayLogo from "@/assets/payment-methods/razorpay.svg";
import xenditLogo from "@/assets/payment-methods/xendit.svg";
import cashfreeLogo from "@/assets/payment-methods/cashfree.svg";
import codLogo from "@/assets/payment-methods/cod.svg";
import paypalLogo from "@/assets/payment-methods/paypal.svg";
import paystackLogo from "@/assets/payment-methods/paystack.svg";
import flutterwaveLogo from "@/assets/payment-methods/flutterwave.svg";

export type PaymentMethodOption = {
  value: CheckoutPaymentMethod;
  labelKey: "stripe" | "razorpay" | "xendit" | "cashfree" | "paypal" | "paystack" | "flutterwave" | "payOnService";
  logo: typeof stripeLogo;
  badgeClass: string;
  enabled: (
    isPayLaterAllowed: boolean,
    isOnlinePaymentAllowed: boolean,
    gw: PaymentGatewaySettings
  ) => boolean;
};

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    value: "stripe",
    labelKey: "stripe",
    logo: stripeLogo,
    badgeClass: "bg-indigo-500/10",
    enabled: (_later, online, gw) => online && gw.stripe_status === "enable",
  },
  {
    value: "razorpay",
    labelKey: "razorpay",
    logo: razorpayLogo,
    badgeClass: "bg-blue-500/10",
    enabled: (_later, online, gw) => online && gw.razorpayApiStatus === "enable",
  },
  {
    value: "xendit",
    labelKey: "xendit",
    logo: xenditLogo,
    badgeClass: "bg-slate-500/10",
    enabled: (_later, online, gw) => online && gw.xendit_status === "enable",
  },
  {
    value: "cashfree",
    labelKey: "cashfree",
    logo: cashfreeLogo,
    badgeClass: "bg-teal-500/10",
    enabled: (_later, online, gw) => online && gw.cashfree_status === "enable",
  },
  {
    value: "paypal",
    labelKey: "paypal",
    logo: paypalLogo,
    badgeClass: "bg-sky-500/10",
    enabled: (_later, online, gw) => online && gw.paypal_status === "enable",
  },
  {
    value: "paystack",
    labelKey: "paystack",
    logo: paystackLogo,
    badgeClass: "bg-cyan-500/10",
    enabled: (_later, online, gw) => online && gw.paystack_status === "enable",
  },
  {
    value: "flutterwave",
    labelKey: "flutterwave",
    logo: flutterwaveLogo,
    badgeClass: "bg-orange-500/10",
    enabled: (_later, online, gw) => online && gw.flutterwave_status === "enable",
  },
  {
    value: "cod",
    labelKey: "payOnService",
    logo: codLogo,
    badgeClass: "bg-blue-600/10",
    // cod_setting comes from the resolved country (via usePaymentGatewaySettings)
    // — "0" hides COD outright regardless of this cart group's own flag.
    enabled: (isPayLaterAllowed, _online, gw) => isPayLaterAllowed && gw.cod_setting !== "0",
  },
];

export function PaymentMethodSection({
  isPayLaterAllowed,
  isOnlinePaymentAllowed,
  gatewaySettings,
  paymentMethod,
  onPaymentMethodChange,
}: {
  isPayLaterAllowed: boolean;
  isOnlinePaymentAllowed: boolean;
  gatewaySettings: PaymentGatewaySettings;
  paymentMethod: CheckoutPaymentMethod | null;
  onPaymentMethodChange: (method: CheckoutPaymentMethod) => void;
}) {
  const { t } = useTranslation();
  const enabledMethods = PAYMENT_METHODS.filter((method) =>
    method.enabled(isPayLaterAllowed, isOnlinePaymentAllowed, gatewaySettings)
  );

  return (
    <div className="hidden w-full flex-col items-start rounded-2xl border border-border-default bg-bg-primary xl:flex">
      <div className="flex w-full items-center gap-4 border-b border-border-default p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-3xl border border-border-default bg-bg-secondary p-2">
          <CreditCard className="size-6 text-icon-primary" />
        </span>
        <span className="flex-1 text-base font-medium text-text-primary">
          {t("checkoutPage.payment.title")}
        </span>
      </div>

      {enabledMethods.length === 0 ? (
        <div className="flex w-full items-center p-4">
          <span className="text-sm text-text-secondary">{t("checkoutPage.payment.noMethodsAvailable")}</span>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 md:grid-cols-3 items-start gap-3 p-4">
          {enabledMethods.map((method) => {
            const isSelected = paymentMethod === method.value;
            const label = t(`checkoutPage.payment.${method.labelKey}`);
            return (
              <AppButton
                key={method.value}
                variant="secondary-outline"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onPaymentMethodChange(method.value)}
                aria-label={t("checkoutPage.payment.selectAriaLabel", { method: label })}
                className="w-full items-center justify-start gap-3 border-border-default bg-bg-primary p-3 text-left"
              >
                <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-lg", method.badgeClass)}>
                  <AppImage src={method.logo} alt={label} className="size-6" />
                </span>
                <span className="flex flex-1 flex-col items-start gap-0.5">
                  <span className="text-base text-text-primary">{label}</span>
                </span>
                <span className="flex items-center justify-center rounded-3xl border border-border-black p-0.5">
                  <span
                    className={cn(
                      "size-3.5 rounded-full bg-bg-brand transition-opacity",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                </span>
              </AppButton>
            );
          })}
        </div>
      )}
    </div>
  );
}
