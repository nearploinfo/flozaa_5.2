"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, CloseIcon } from "@/components/icons/icons";
import { CouponsModal } from "@/components/checkout/coupons-modal";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { CartGroup } from "@/lib/cart-types";
import { cartPrePromoAmount, cartPromoSaving, toBillLines } from "@/lib/cart-types";
import { BillBreakdown } from "@/components/common/bill-breakdown";
import type { PromoCodeApi } from "@/api/apiRoutes";

const COLLAPSED_ITEM_COUNT = 2;

export function CheckoutOrderSummary({
  cartGroup,
  canCheckout,
  isProcessingCheckout,
  onCheckout,
  finalAmount,
  offers,
  offersStatus,
  appliedPromo,
  promoDiscount,
  promoStatus,
  promoError,
  onApplyPromo,
  onApplyPromoCode,
  onRemovePromo,
}: {
  cartGroup: CartGroup;
  canCheckout: boolean;
  isProcessingCheckout: boolean;
  onCheckout: () => void;
  finalAmount: number;
  offers: PromoCodeApi[];
  offersStatus: "idle" | "loading" | "loaded" | "error";
  appliedPromo: PromoCodeApi | null;
  promoDiscount: number;
  promoStatus: "idle" | "applying" | "error";
  promoError: string | null;
  onApplyPromo: (offer: PromoCodeApi) => void;
  onApplyPromoCode: (code: string) => void;
  onRemovePromo: () => void;
}) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const [showAllItems, setShowAllItems] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponsModalOpen, setCouponsModalOpen] = useState(false);

  const visibleItems =
    showAllItems || cartGroup.items.length <= COLLAPSED_ITEM_COUNT
      ? cartGroup.items
      : cartGroup.items.slice(0, COLLAPSED_ITEM_COUNT);
  const hiddenItemCount = cartGroup.items.length - COLLAPSED_ITEM_COUNT;

  // Every figure here is the server's. The bill is laid out per charged
  // element — Services, Visiting Charges, each fee — with that element's own
  // tax folded into its amount, so the rows add up to final_total on their
  // own instead of needing a pooled "Taxes" row that matches no one charge.
  const billLines = toBillLines(cartGroup);
  const prePromoAmount = cartPrePromoAmount(cartGroup);
  // The discount shown must be the one the server applied — promoDiscount is
  // validate_promo_code's optimistic figure and can differ (max discount,
  // minimum order amount, wrong provider).
  const discount = cartGroup.promo?.discount ?? promoDiscount;
  // The bill lines are pre-promo (so is tax_breakdown), and the promo lowers
  // the tax as well as the price — so the deduction that actually closes the
  // arithmetic is the full saving, not promo.discount on its own.
  const savedAmount = cartGroup.finalTotal !== undefined ? cartPromoSaving(cartGroup) : discount;

  return (
    <div className="relative flex w-full shrink-0 flex-col items-start self-start rounded-2xl border border-border-default bg-bg-primary lg:sticky lg:top-[6.25rem]">
      <div className="flex w-full items-center border-b border-border-default p-6">
        <span className="flex-1 text-xl font-normal text-text-primary">{t("cartPage.orderSummary")}</span>
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
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder={t("cartPage.enterCoupon")}
                  className="h-auto flex-1 rounded-lg border border-border-default bg-bg-primary px-4 py-2 text-base text-text-primary outline-none placeholder:text-text-tertiary focus-visible:border-border-brand"
                />
                <AppButton
                  variant="secondary"
                  size="md"
                  disabled={!couponCode || promoStatus === "applying"}
                  onClick={() => onApplyPromoCode(couponCode)}
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
          {visibleItems.map((item) => {
            const hasDiscount = Boolean(item.discountedPrice && item.discountedPrice < item.price);
            const unitPrice = hasDiscount ? (item.discountedPrice as number) : item.price;
            return (
              <div key={item.serviceId} className="flex w-full flex-col items-start gap-1">
                <span className="line-clamp-1 w-full text-sm font-medium text-text-primary">
                  {item.serviceTitle ?? t("checkoutPage.orderSummary.untitledService")}
                </span>
                <div className="flex w-full items-start gap-1">
                  <div className="flex flex-1 items-center gap-1">
                    <span className="text-sm text-text-secondary">{showPrice(unitPrice)}</span>
                    <span className="text-sm text-text-secondary">
                      {t("checkoutPage.orderSummary.quantity", { count: item.qty })}
                    </span>
                  </div>
                  <span className="line-clamp-1 text-sm font-medium text-text-primary">
                    {showPrice(unitPrice * item.qty)}
                  </span>
                </div>
              </div>
            );
          })}

          {hiddenItemCount > 0 && (
            <AppButton
              variant="link"
              size="sm"
              className="text-text-brand hover:text-text-brand"
              rightIcon={showAllItems ? ChevronUpIcon : ChevronDownIcon}
              onClick={() => setShowAllItems((prev) => !prev)}
            >
              {showAllItems
                ? t("checkoutPage.orderSummary.showLess")
                : t("checkoutPage.orderSummary.moreServices", { count: hiddenItemCount })}
            </AppButton>
          )}
        </div>

        <div className="dashed-divider" />

        <div className="flex w-full flex-col items-start gap-4">
          <BillBreakdown lines={billLines} defaultOpen />
          {/* Only when the server applied it — a promo_error cart is priced
              without the discount, so no line belongs here. */}
          {savedAmount > 0 && !cartGroup.promoError && (
            <div className="flex w-full items-center gap-6">
              <span className="flex-1 text-base text-text-primary">{t("cartPage.couponDiscount")}</span>
              <span className="text-base font-medium text-text-error">-{showPrice(savedAmount)}</span>
            </div>
          )}
          <div className="dashed-divider" />
          <div className="flex w-full items-center gap-6">
            <span className="flex-1 text-lg font-medium text-text-primary">{t("cartPage.finalAmount")}</span>
            <div className="flex items-center gap-2">
              {savedAmount > 0 && (
                <span className="text-sm text-text-tertiary line-through">
                  {showPrice(prePromoAmount)}
                </span>
              )}
              <span className="text-lg font-medium text-text-brand">{showPrice(finalAmount)}</span>
            </div>
          </div>
        </div>

        {savedAmount > 0 && !cartGroup.promoError && (
          <div className="flex w-full items-start gap-2 rounded-lg bg-bg-success-subtle p-3">
            <CheckCircleIcon className="size-6 text-text-success" />
            <span className="text-base text-text-success">
              {t("checkoutPage.orderSummary.savedBanner", { amount: showPrice(savedAmount) })}
            </span>
          </div>
        )}

        <AppButton
          variant="primary"
          size="md"
          className="w-full"
          disabled={!canCheckout || isProcessingCheckout}
          onClick={onCheckout}
        >
          {isProcessingCheckout
            ? t("checkoutPage.orderSummary.processing")
            : t("checkoutPage.orderSummary.proceedWithPayment")}
        </AppButton>
      </div>

      <CouponsModal
        open={couponsModalOpen}
        onOpenChange={setCouponsModalOpen}
        offers={offers}
        offersStatus={offersStatus}
        appliedPromoId={appliedPromo?.id ?? null}
        promoStatus={promoStatus}
        onApply={(offer) => onApplyPromo(offer)}
        onApplyCode={onApplyPromoCode}
      />
    </div>
  );
}
