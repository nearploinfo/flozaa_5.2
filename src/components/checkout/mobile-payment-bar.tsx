"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { PAYMENT_METHODS } from "@/components/checkout/payment-method-section";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { CheckoutPaymentMethod, PaymentGatewaySettings } from "@/lib/checkout/checkout-types";
import { cn } from "@/lib/utils";

/** Mobile-only sticky bottom bar — replaces the desktop payment-method grid
 * with a compact "Pay Using [method] ⌄ ... Pay $X" bar; the method itself is
 * still picked from the same PAYMENT_METHODS list, just in a sheet instead
 * of an inline grid. */
export function MobilePaymentBar({
  isPayLaterAllowed,
  isOnlinePaymentAllowed,
  gatewaySettings,
  paymentMethod,
  onPaymentMethodChange,
  finalAmount,
  canCheckout,
  isProcessingCheckout,
  onCheckout,
}: {
  isPayLaterAllowed: boolean;
  isOnlinePaymentAllowed: boolean;
  gatewaySettings: PaymentGatewaySettings;
  paymentMethod: CheckoutPaymentMethod | null;
  onPaymentMethodChange: (method: CheckoutPaymentMethod) => void;
  finalAmount: number;
  canCheckout: boolean;
  isProcessingCheckout: boolean;
  onCheckout: () => void;
}) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const [pickerOpen, setPickerOpen] = useState(false);

  const enabledMethods = PAYMENT_METHODS.filter((method) =>
    method.enabled(isPayLaterAllowed, isOnlinePaymentAllowed, gatewaySettings)
  );
  const selected = enabledMethods.find((method) => method.value === paymentMethod);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 flex w-full flex-col items-start gap-1.5 overflow-hidden bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)] xl:hidden">
        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            onClick={() => enabledMethods.length > 0 && setPickerOpen(true)}
            disabled={enabledMethods.length === 0}
            className="flex flex-1 flex-col items-start gap-2 text-left"
          >
            <span className="text-xs text-text-secondary">{t("checkoutPage.payment.payUsing")}</span>
            {selected ? (
              <span className="flex items-center gap-1">
                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-sm", selected.badgeClass)}>
                  <AppImage src={selected.logo} alt="" className="size-3" />
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {t(`checkoutPage.payment.${selected.labelKey}`)}
                </span>
                <ChevronDownIcon className="size-5 text-icon-primary" />
              </span>
            ) : (
              <span className="text-sm text-text-tertiary">{t("checkoutPage.payment.noMethodsAvailable")}</span>
            )}
          </button>

          <AppButton
            variant="primary"
            size="lg"
            className="flex-1 justify-center"
            disabled={!canCheckout || isProcessingCheckout}
            onClick={onCheckout}
          >
            {isProcessingCheckout
              ? t("checkoutPage.orderSummary.processing")
              : t("checkoutPage.payment.payAmount", { amount: showPrice(finalAmount) })}
          </AppButton>
        </div>
      </div>

      <Drawer open={pickerOpen} onOpenChange={setPickerOpen}>
        <DrawerContent className="max-h-[85vh] bg-bg-primary">
          <div className="flex w-full flex-col items-center gap-2 px-4">
            <DrawerTitle className="w-full text-base font-medium text-text-primary">
              {t("checkoutPage.payment.title")}
            </DrawerTitle>
            <div className="dashed-divider" />
          </div>

          <div className="flex w-full flex-col items-start gap-3 overflow-y-auto p-4">
            {enabledMethods.map((method) => {
              const isSelected = paymentMethod === method.value;
              const label = t(`checkoutPage.payment.${method.labelKey}`);
              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => {
                    onPaymentMethodChange(method.value);
                    setPickerOpen(false);
                  }}
                  className="flex w-full shrink-0 items-center gap-3 rounded-xl border border-border-default bg-bg-primary p-3 text-left"
                >
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", method.badgeClass)}>
                    <AppImage src={method.logo} alt={label} className="size-5" />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-text-primary">{label}</span>
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border-black p-1">
                    <span
                      className={cn(
                        "size-3.5 rounded-full bg-bg-brand transition-opacity",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
