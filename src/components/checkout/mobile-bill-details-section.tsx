"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText } from "lucide-react";
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon } from "@/components/icons/icons";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { CartGroup } from "@/lib/cart-types";
import { cartPrePromoAmount, cartPromoSaving, toBillLines } from "@/lib/cart-types";
import { BillBreakdown } from "@/components/common/bill-breakdown";

/** Mobile-only collapsible bill summary — same numbers desktop shows inline
 * in CheckoutOrderSummary's sidebar (item total, visiting charge, taxes,
 * fees, promo discount, final amount), just its own expandable card here.
 * Collapsed state is a compact "Total Bill $X, $Y · Saved $Z" summary row;
 * expanded shows the full breakdown. */
export function MobileBillDetailsSection({
  cartGroup,
  finalAmount,
  promoDiscount,
}: {
  cartGroup: CartGroup;
  finalAmount: number;
  promoDiscount: number;
}) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const [expanded, setExpanded] = useState(true);

  // Same per-element bill as the desktop summary: each charge carries its own
  // tax, so the rows add up to the final amount without a pooled "Taxes" row.
  const billLines = toBillLines(cartGroup);
  const originalTotal = cartPrePromoAmount(cartGroup);
  // The server's discount, not validate_promo_code's optimistic one; a cart
  // with promo_error was priced without any discount at all.
  const discount = cartGroup.promoError ? 0 : (cartGroup.promo?.discount ?? promoDiscount);
  // The bill rows are pre-promo, and the promo lowers the tax too — the full
  // saving is what makes the rows reconcile with the final amount.
  const savedAmount =
    cartGroup.finalTotal !== undefined ? cartPromoSaving(cartGroup) : discount;

  return (
    <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3 xl:hidden">
      {expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex w-full items-center justify-between gap-2"
        >
          <span className="text-sm font-semibold text-text-primary">
            {t("checkoutPage.orderSummary.billDetails")}
          </span>
          <span className="flex size-9 items-center justify-center rounded-full bg-bg-secondary">
            <ChevronUpIcon className="size-5 text-icon-primary" />
          </span>
        </button>
      ) : (
        <button type="button" onClick={() => setExpanded(true)} className="flex w-full items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-bg-secondary">
            <FileText className="size-4 text-icon-primary" />
          </span>
          <div className="flex flex-1 flex-col items-start gap-1">
            <span className="text-sm text-text-primary">
              {t("checkoutPage.orderSummary.totalBillLabel")}{" "}
              {savedAmount > 0 && <span className="line-through">{showPrice(originalTotal)}</span>}
              {savedAmount > 0 && ", "}
              <span className="font-semibold">{showPrice(finalAmount)}</span>
            </span>
            {savedAmount > 0 && (
              <span className="rounded-sm bg-bg-brand-subtle px-1 py-1 text-xs text-text-brand">
                {t("checkoutPage.orderSummary.savedAmount", { amount: showPrice(savedAmount) })}
              </span>
            )}
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-bg-secondary">
            <ChevronDownIcon className="size-5 text-icon-primary" />
          </span>
        </button>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="bill-details-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex w-full flex-col items-start gap-3 overflow-hidden"
          >
            <div className="dashed-divider" />
            <div className="flex w-full flex-col items-start gap-2">
              <BillBreakdown lines={billLines} size="sm" />
              {savedAmount > 0 && (
                <div className="flex w-full items-center gap-1">
                  <span className="flex-1 text-sm text-text-secondary">
                    {t("cartPage.couponDiscount")}
                  </span>
                  <span className="text-sm text-text-error">-{showPrice(savedAmount)}</span>
                </div>
              )}
              <div className="dashed-divider" />
              <div className="flex w-full items-center gap-1">
                <span className="flex-1 text-sm font-semibold text-text-primary">
                  {t("cartPage.finalAmount")}
                </span>
                <span className="text-base font-bold text-text-brand">{showPrice(finalAmount)}</span>
              </div>
            </div>

            {savedAmount > 0 && (
              <div className="flex w-full items-center gap-2 rounded-lg bg-bg-success-subtle p-2">
                <CheckCircleIcon className="size-6 shrink-0 text-text-success" />
                <span className="text-xs text-text-success">
                  {t("checkoutPage.orderSummary.savedBanner", { amount: showPrice(savedAmount) })}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
