"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { CheckCircleIcon, CloseIcon } from "@/components/icons/icons";
import { CouponsModal } from "@/components/checkout/coupons-modal";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useIsMobile } from "@/lib/use-is-mobile";
import type { PromoCodeApi } from "@/api/apiRoutes";
import type { BillLine } from "@/lib/cart-types";
import { BillBreakdown } from "@/components/common/bill-breakdown";

export function OrderSummary({
  subtotal,
  taxes,
  fees,
  visitingCharges,
  finalAmount,
  servicesCount,
  canCheckout,
  onCheckout,
  offers,
  offersStatus,
  appliedPromo,
  promoDiscount,
  promoStatus,
  promoError,
  onApplyPromo,
  onApplyPromoCode,
  onRemovePromo,
  prePromoAmount,
  savedAmount,
  billLines,
}: {
  /** Pre-tax subtotal (sub_total_without_tax) — sub_total from the API is already tax-inclusive. */
  subtotal: number;
  taxes: number;
  fees: number;
  visitingCharges: number;
  /** The cart's `final_total` — what place_order will charge. Never derived here. */
  finalAmount: number;
  servicesCount: number;
  canCheckout: boolean;
  onCheckout: () => void;
  offers: PromoCodeApi[];
  offersStatus: "idle" | "loading" | "loaded" | "error";
  appliedPromo: PromoCodeApi | null;
  promoDiscount: number;
  promoStatus: "idle" | "applying" | "error";
  promoError: string | null;
  onApplyPromo: (offer: PromoCodeApi) => void;
  onApplyPromoCode: (code: string) => void;
  onRemovePromo: () => void;
  /** `overall_amount` — the price before the promo, for the struck-through figure. */
  prePromoAmount?: number;
  /** The real saving: the pre-tax discount plus the tax it removed. */
  savedAmount?: number;
  /** Per-element bill rows (Services, Visiting Charges, each fee), each
   * already including its own tax. Replaces the flat subtotal/taxes/fees
   * rows below when the cart was priced server-side. */
  billLines?: BillLine[];
}) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const isMobile = useIsMobile();
  const [coupon, setCoupon] = useState("");
  // The discount on the pre-tax price plus the tax it removed — the figure the
  // customer actually sees come off the total. Falls back to the plain
  // discount for a cart the server hasn't priced.
  const saved = savedAmount ?? promoDiscount;
  const [couponsModalOpen, setCouponsModalOpen] = useState(false);

  return (
    <div className="relative flex w-full shrink-0 flex-col items-start self-start rounded-2xl border border-border-default bg-bg-primary lg:sticky lg:top-[6.25rem] lg:w-[520px]">
      <div className="flex w-full items-center border-b border-border-default p-6">
        <span className="flex-1 text-xl font-medium text-text-primary">
          {t("cartPage.orderSummary")}
        </span>
      </div>

      <div className="flex w-full flex-col items-start gap-4 p-6">
        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex w-full items-center justify-end gap-2">
            <span className="flex-1 text-base text-text-primary">{t("cartPage.promocode")}</span>
            <AppButton
              variant="link"
              size="sm"
              className="text-sm text-text-brand hover:opacity-70"
              onClick={() => setCouponsModalOpen(true)}
            >
              {t("cartPage.viewCoupons")}
            </AppButton>
          </div>

          {appliedPromo ? (
            <div className="flex w-full items-center gap-2 rounded-lg border border-border-default bg-bg-primary px-4 py-2">
              <span className="flex-1 text-base font-medium text-text-primary">{appliedPromo.promo_code}</span>
              <AppButton
                variant="secondary-outline"
                size="sm"
                iconOnly
                leftIcon={CloseIcon}
                aria-label={t("checkoutPage.orderSummary.removePromoAriaLabel")}
                onClick={onRemovePromo}
              >
                {t("checkoutPage.orderSummary.removePromoAriaLabel")}
              </AppButton>
            </div>
          ) : (
            <div className="flex w-full flex-col items-start gap-1">
              <div className="flex w-full items-start gap-2">
                <input
                  type="text"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  placeholder={t("cartPage.enterCoupon")}
                  className="h-auto flex-1 rounded-lg border border-border-default bg-bg-primary px-4 py-2 text-base text-text-primary outline-none placeholder:text-text-tertiary focus-visible:border-border-brand"
                />
                <AppButton
                  variant="secondary"
                  size="md"
                  disabled={!coupon || promoStatus === "applying"}
                  onClick={() => onApplyPromoCode(coupon)}
                >
                  {promoStatus === "applying" ? t("checkoutPage.orderSummary.applying") : t("cartPage.apply")}
                </AppButton>
              </div>
              {promoStatus === "error" && promoError && (
                <span className="text-sm text-text-error">{promoError}</span>
              )}
            </div>
          )}
        </div>

        <div className="dashed-divider" />

        <div className="flex w-full flex-col items-start gap-4">
          {billLines && billLines.length > 0 ? (
            <BillBreakdown lines={billLines} defaultOpen={!isMobile} />
          ) : (
            <>
              {/* Pre-v5.2.0 shape: no per-element breakdown came back, so the
                  pooled rows are all there is to show. */}
              <div className="flex w-full items-center gap-6">
                <span className="flex-1 text-base text-text-primary">
                  {t("cartPage.subtotalCount", { count: servicesCount })}
                </span>
                <span className="text-base font-medium text-text-primary">{showPrice(subtotal)}</span>
              </div>
              {taxes > 0 && (
                <div className="flex w-full items-center gap-6">
                  <span className="flex-1 text-base text-text-primary">{t("cartPage.taxesLabel")}</span>
                  <span className="text-base font-medium text-text-primary">+{showPrice(taxes)}</span>
                </div>
              )}
              {fees > 0 && (
                <div className="flex w-full items-center gap-6">
                  <span className="flex-1 text-base text-text-primary">{t("cartPage.feesLabel")}</span>
                  <span className="text-base font-medium text-text-primary">+{showPrice(fees)}</span>
                </div>
              )}
              {visitingCharges > 0 && (
                <div className="flex w-full items-center gap-6">
                  <span className="flex-1 text-base text-text-primary">
                    {t("cartPage.visitingChargesLabel")}
                  </span>
                  <span className="text-base font-medium text-text-primary">
                    +{showPrice(visitingCharges)}
                  </span>
                </div>
              )}
            </>
          )}
          {saved > 0 && (
            <div className="flex w-full items-center gap-6">
              <span className="flex-1 text-base text-text-primary">{t("cartPage.couponDiscount")}</span>
              <span className="text-base font-medium text-text-error">-{showPrice(saved)}</span>
            </div>
          )}
          <div className="dashed-divider" />
          <div className="flex w-full items-center gap-6">
            <span className="flex-1 text-lg font-medium text-text-primary">
              {t("cartPage.finalAmount")}
            </span>
            <div className="flex items-center gap-2">
              {saved > 0 && prePromoAmount !== undefined && (
                <span className="text-sm text-text-tertiary line-through">
                  {showPrice(prePromoAmount)}
                </span>
              )}
              <span className="text-lg font-medium text-text-brand">{showPrice(finalAmount)}</span>
            </div>
          </div>
        </div>

        {saved > 0 && (
          <div className="flex w-full items-start gap-2 rounded-lg bg-bg-success-subtle p-3">
            <CheckCircleIcon className="size-6 text-text-success" />
            <span className="text-base text-text-success">
              {t("checkoutPage.orderSummary.savedBanner", { amount: showPrice(saved) })}
            </span>
          </div>
        )}

        <AppButton
          variant="primary"
          size="md"
          className="w-full"
          disabled={!canCheckout}
          onClick={onCheckout}
        >
          {t("cartPage.proceedToCheckout")}
        </AppButton>
      </div>

      <CouponsModal
        open={couponsModalOpen}
        onOpenChange={setCouponsModalOpen}
        offers={offers}
        offersStatus={offersStatus}
        appliedPromoId={appliedPromo?.id ?? null}
        promoStatus={promoStatus}
        onApply={onApplyPromo}
        onApplyCode={onApplyPromoCode}
      />
    </div>
  );
}
