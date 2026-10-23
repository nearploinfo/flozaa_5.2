"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { parse, format, isValid } from "date-fns";
import { ArrowLeftIcon } from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import type { PromoCodeApi } from "@/api/apiRoutes";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";

function formatExpiry(rawDate: string): string {
  const parsed = parse(rawDate, "dd-MM-yyyy", new Date());
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : rawDate;
}

/** Mobile-only full-screen counterpart to coupons-modal.tsx's desktop
 * Dialog — same offers list, promo-code input, and apply/applied logic,
 * just pushed as a full page instead of a centered modal. */
export function MobileCouponsScreen({
  open,
  onOpenChange,
  offers,
  offersStatus,
  appliedPromoId,
  promoStatus,
  onApply,
  onApplyCode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offers: PromoCodeApi[];
  offersStatus: "idle" | "loading" | "loaded" | "error";
  appliedPromoId: number | null;
  promoStatus: "idle" | "applying" | "error";
  onApply: (offer: PromoCodeApi) => void;
  onApplyCode: (code: string) => void;
}) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const [couponCode, setCouponCode] = useState("");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col items-start overflow-y-auto bg-bg-primary xl:hidden"
        >
          <div className="flex w-full items-center gap-2 border-b border-border-default p-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={t("checkoutPage.back")}
              className="flex items-center justify-center p-2"
            >
              <ArrowLeftIcon className="size-6 text-icon-primary rtl:rotate-180" />
            </button>
            <span className="text-base font-bold text-text-primary">
              {t("checkoutPage.coupons.offersTitle")}
            </span>
          </div>

          <div className="flex w-full flex-col items-start gap-4 p-4">
            <div className="flex w-full items-center gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder={t("cartPage.enterCoupon")}
                className="h-12 flex-1 rounded-xl bg-bg-secondary px-4 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
              />
              <AppButton
                variant="primary"
                size="sm"
                disabled={!couponCode || promoStatus === "applying"}
                onClick={() => onApplyCode(couponCode)}
              >
                {t("cartPage.apply")}
              </AppButton>
            </div>

            {offersStatus === "loading" && (
              <div className="flex w-full flex-col gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            )}

            {offersStatus === "loaded" && offers.length === 0 && (
              <span className="text-sm text-text-secondary">{t("checkoutPage.coupons.noOffers")}</span>
            )}

            <div className="flex w-full flex-col items-start gap-3">
              {offers.map((offer) => {
                const discountLabel =
                  offer.discount_type === "percentage"
                    ? t("checkoutPage.coupons.percentOff", { percent: offer.discount })
                    : t("checkoutPage.coupons.amountOff", { amount: showPrice(Number(offer.discount)) });
                const isApplied = offer.id === appliedPromoId;

                const terms = [
                  offer.message || null,
                  t("checkoutPage.coupons.minimumOrderTerm", { amount: showPrice(offer.minimum_order_amount) }),
                  t("checkoutPage.coupons.maxDiscountTerm", { amount: showPrice(offer.max_discount_amount) }),
                  t("checkoutPage.coupons.validFromTerm", {
                    start: formatExpiry(offer.start_date),
                    end: formatExpiry(offer.end_date),
                  }),
                ].filter((term): term is string => Boolean(term));

                return (
                  <div
                    key={offer.id}
                    className="flex w-full flex-col items-start gap-2 rounded-xl bg-bg-primary p-3 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)]"
                  >
                    <div className="flex w-full items-center gap-3">
                      {offer.image && (
                        <AppImage
                          src={offer.image}
                          alt={offer.promo_code}
                          className="size-12 rounded-[10px] object-cover"
                        />
                      )}
                      <div className="flex flex-1 flex-col items-start gap-1">
                        <span className="text-sm font-semibold text-text-primary">{offer.promo_code}</span>
                        <span className="rounded-sm bg-bg-brand-subtle px-1 py-1 text-xs text-text-brand">
                          {discountLabel}
                        </span>
                      </div>
                      <AppButton
                        variant="primary"
                        size="sm"
                        disabled={isApplied || promoStatus === "applying"}
                        onClick={() => onApply(offer)}
                      >
                        {isApplied ? t("checkoutPage.coupons.applied") : t("cartPage.apply")}
                      </AppButton>
                    </div>

                    {terms.length > 0 && (
                      <>
                        <div className="dashed-divider" />
                        <ul className="flex w-full flex-col items-start gap-3">
                          {terms.map((term) => (
                            <li key={term} className="line-clamp-2 w-full text-xs text-text-secondary">
                              • {term}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
