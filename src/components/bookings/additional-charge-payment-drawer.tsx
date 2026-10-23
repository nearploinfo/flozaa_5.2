"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AppImage } from "@/components/ui/app-image";
import { PAYMENT_METHODS } from "@/components/checkout/payment-method-section";
import { usePaymentGatewaySettings } from "@/lib/checkout/use-payment-gateway-settings";
import { usePriceFormatter, type CurrencyOverride } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useIsMobile } from "@/lib/use-is-mobile";
import type { CheckoutPaymentMethod } from "@/lib/checkout/checkout-types";
import { cn } from "@/lib/utils";

function PaymentMethodList({
  onSelect,
  isProcessing,
  columns = 1,
}: {
  onSelect: (method: CheckoutPaymentMethod) => void;
  isProcessing: boolean;
  columns?: 1 | 2;
}) {
  const { t } = useTranslation();
  const gatewaySettings = usePaymentGatewaySettings();

  // No per-booking pay-later/online-payment restriction exists on
  // BookingDetailApi — offer every site-enabled gateway.
  const enabledMethods = PAYMENT_METHODS.filter((method) => method.enabled(true, true, gatewaySettings));

  return (
    <div
      className={cn(
        "w-full items-start gap-3 overflow-y-auto p-4",
        columns === 2 ? "grid grid-cols-2" : "flex flex-col"
      )}
    >
      {enabledMethods.map((method) => {
        const label = t(`checkoutPage.payment.${method.labelKey}`);
        return (
          <button
            key={method.value}
            type="button"
            disabled={isProcessing}
            onClick={() => onSelect(method.value)}
            className="flex w-full shrink-0 items-center gap-3 rounded-xl border border-border-default bg-bg-primary p-3 text-left disabled:opacity-60"
          >
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", method.badgeClass)}>
              <AppImage src={method.logo} alt={label} className="size-5" />
            </span>
            <span className="flex-1 text-sm font-semibold text-text-primary">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PickerHeader({
  amount,
  currencyOverride,
}: {
  amount: number;
  currencyOverride?: CurrencyOverride;
}): { title: ReactNode; subtitle: ReactNode } {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  return {
    title: t("bookings.detail.additionalChargePickerTitle"),
    subtitle: t("bookings.detail.payAdditional", { amount: showPrice(amount, currencyOverride) }),
  };
}

export function AdditionalChargePaymentDrawer({
  open,
  onOpenChange,
  amount,
  currencyOverride,
  onSelect,
  isProcessing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  /** The booking's own fixed currency — the amount shown here always belongs to one booking. */
  currencyOverride?: CurrencyOverride;
  onSelect: (method: CheckoutPaymentMethod) => void;
  isProcessing: boolean;
}) {
  const { title, subtitle } = PickerHeader({ amount, currencyOverride });
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] bg-bg-primary">
          <div className="flex w-full flex-col items-center gap-2 px-4">
            <DrawerTitle className="w-full text-base font-medium text-text-primary">{title}</DrawerTitle>
            <span className="w-full text-sm text-text-secondary">{subtitle}</span>
            <div className="dashed-divider" />
          </div>
          <PaymentMethodList onSelect={onSelect} isProcessing={isProcessing} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[600px] max-w-[calc(100%-2rem)] flex-col gap-0 rounded-xl bg-bg-primary p-0 sm:max-w-[600px]">
        <div className="flex w-full flex-col items-start gap-1 border-b border-border-default p-4">
          <DialogTitle className="text-base font-medium text-text-primary">{title}</DialogTitle>
          <span className="text-sm text-text-secondary">{subtitle}</span>
        </div>
        <PaymentMethodList onSelect={onSelect} isProcessing={isProcessing} columns={2} />
      </DialogContent>
    </Dialog>
  );
}
