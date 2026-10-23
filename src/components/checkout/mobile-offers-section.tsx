"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { CheckCircleIcon } from "@/components/icons/icons";
import { MobileCouponsScreen } from "@/components/checkout/mobile-coupons-screen";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { PromoCodeApi } from "@/api/apiRoutes";

/** Mobile-only compact "Offer & Coupons" card — shows just the first
 * available offer inline with Apply/Remove; "View All" opens the same
 * CouponsModal the desktop sidebar uses for the full list. */
export function MobileOffersSection({
  offers,
  offersStatus,
  appliedPromo,
  promoStatus,
  promoError,
  onApplyPromo,
  onApplyPromoCode,
  onRemovePromo,
}: {
  offers: PromoCodeApi[];
  offersStatus: "idle" | "loading" | "loaded" | "error";
  appliedPromo: PromoCodeApi | null;
  promoStatus: "idle" | "applying" | "error";
  promoError: string | null;
  onApplyPromo: (offer: PromoCodeApi) => void;
  onApplyPromoCode: (code: string) => void;
  onRemovePromo: () => void;
}) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const [modalOpen, setModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  // Only "idle" (offers haven't been requested yet — no providerId resolved)
  // hides the card entirely; "loading"/"error"/an empty list must still show
  // the manual code entry below, same as desktop's persistent order summary.
  if (offersStatus === "idle") return null;

  const featured = offersStatus === "loaded" ? offers[0] : undefined;
  const featuredIsApplied = featured ? appliedPromo?.id === featured.id : false;
  const featuredDiscountLabel = featured
    ? featured.discount_type === "percentage"
      ? t("checkoutPage.coupons.percentOff", { percent: featured.discount })
      : t("checkoutPage.coupons.amountOff", { amount: showPrice(Number(featured.discount)) })
    : null;

  return (
    <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3 xl:hidden">
      <div className="flex w-full items-center gap-1">
        <span className="flex-1 text-sm font-semibold text-text-primary">
          {t("checkoutPage.coupons.offersTitle")}
        </span>
        <AppButton variant="link" size="sm" onClick={() => setModalOpen(true)}>
          {t("common.view")}
        </AppButton>
      </div>
      <div className="dashed-divider" />

      {appliedPromo ? (
        <div className="flex w-full items-center gap-2 rounded-lg border border-border-default bg-bg-primary px-3 py-2">
          <span className="flex-1 text-sm font-medium text-text-primary">{appliedPromo.promo_code}</span>
          <button type="button" onClick={onRemovePromo} className="text-sm text-text-error">
            {t("checkoutPage.coupons.remove")}
          </button>
        </div>
      ) : (
        <>
          {featured && featuredDiscountLabel && (
            <div className="flex w-full items-center gap-3">
              <div className="flex flex-1 items-center gap-3">
                <CheckCircleIcon className="size-6 shrink-0 text-icon-brand" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-text-primary">{featuredDiscountLabel}</span>
                  <span className="text-xs text-text-tertiary">
                    {t("checkoutPage.coupons.minimumOrderTerm", {
                      amount: showPrice(featured.minimum_order_amount),
                    })}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={promoStatus === "applying" || featuredIsApplied}
                onClick={() => onApplyPromo(featured)}
                className="text-sm text-text-brand disabled:opacity-50"
              >
                {t("cartPage.apply")}
              </button>
            </div>
          )}

          <div className="flex w-full items-start gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder={t("cartPage.enterCoupon")}
              className="h-auto flex-1 rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus-visible:border-border-brand"
            />
            <AppButton
              variant="secondary"
              size="sm"
              disabled={!couponCode || promoStatus === "applying"}
              onClick={() => onApplyPromoCode(couponCode)}
            >
              {promoStatus === "applying" ? t("checkoutPage.orderSummary.applying") : t("cartPage.apply")}
            </AppButton>
          </div>
          {promoStatus === "error" && promoError && (
            <span className="text-sm text-text-error">{promoError}</span>
          )}
        </>
      )}

      <MobileCouponsScreen
        open={modalOpen}
        onOpenChange={setModalOpen}
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
