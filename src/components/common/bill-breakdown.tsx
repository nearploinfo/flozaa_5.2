"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDownIcon } from "@/components/icons/icons";
import { usePriceFormatter, type CurrencyOverride } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { BillLine } from "@/lib/cart-types";

/**
 * The bill as the app shows it: one row per charged element (Services,
 * Visiting Charges, each fee) carrying that element's own total INCLUDING
 * tax, with the pre-tax price and each tax rule nested underneath.
 *
 * This replaces the flat "Subtotal / Taxes / Fees / Visiting Charges" layout,
 * where the tax was pooled into a single row that matched no individual
 * charge and the per-element detail sat behind a "view breakdown" toggle. The
 * rows here add up to the total on their own, which is what makes the detail
 * worth showing inline.
 *
 * Groups start collapsed by default: the amounts themselves are the bill, and
 * the base-price/tax-rule rows are detail the customer opens when they want
 * to know how a number was reached. `defaultOpen` flips that — desktop shows
 * every row's detail up front, mobile keeps it collapsed to save space.
 * Opening (or closing) animates so the rows below don't jump.
 */
export function BillBreakdown({
  lines,
  currencyOverride,
  size = "md",
  defaultOpen = false,
}: {
  lines: BillLine[];
  /** A booking's own fixed currency; omit for the current location's. */
  currencyOverride?: CurrencyOverride;
  /** "sm" for the mobile bill card, "md" for the desktop summary column. */
  size?: "sm" | "md";
  /** Rows start expanded — desktop defaults to this, mobile doesn't. */
  defaultOpen?: boolean;
}) {
  const { t } = useTranslation();
  const formatPrice = usePriceFormatter();
  const showPrice = (amount: number) => formatPrice(amount, currencyOverride);

  const titleClass = size === "sm" ? "text-sm" : "text-base";
  const detailClass = size === "sm" ? "text-xs" : "text-sm";

  if (lines.length === 0) return null;

  return (
    <div className="flex w-full flex-col items-start gap-3">
      {lines.map((line, index) => (
        <BillBreakdownRow
          key={line.key}
          line={line}
          // Everything after the first element is an addition to it, matching
          // how the amounts actually accumulate into the total.
          showPlus={index > 0}
          title={
            line.title ||
            (line.key === "services"
              ? t("checkoutPage.orderSummary.servicesLine")
              : t("checkoutPage.orderSummary.visitingCharge"))
          }
          showPrice={showPrice}
          titleClass={titleClass}
          detailClass={detailClass}
          defaultOpen={defaultOpen}
        />
      ))}
    </div>
  );
}

function BillBreakdownRow({
  line,
  title,
  showPlus,
  showPrice,
  titleClass,
  detailClass,
  defaultOpen,
}: {
  line: BillLine;
  title: string;
  showPlus: boolean;
  showPrice: (amount: number) => string;
  titleClass: string;
  detailClass: string;
  defaultOpen: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  // A non-taxable fee (and any element on a pre-v5.2.0 cart) has no pre-tax
  // price or rules to show — it's just the amount, so there's nothing to open.
  // Nor is there anything worth opening when the only thing underneath would
  // be a Base Price identical to the total shown here already (no tax rule
  // matched this element) — the chevron would reveal no new information.
  const expandable = line.baseAmount !== undefined && (line.taxComponents?.length ?? 0) > 0;

  return (
    <div className="flex w-full flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => expandable && setOpen((prev) => !prev)}
        disabled={!expandable}
        className="flex w-full items-center gap-2 text-start disabled:cursor-default"
      >
        <span className={`flex items-center gap-1 font-medium text-text-primary ${titleClass}`}>
          {title}
          {expandable && (
            <ChevronDownIcon
              className={`size-4 text-icon-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          )}
        </span>
        <span className={`flex-1 text-end font-medium text-text-primary ${titleClass}`}>
          {showPlus ? "+" : ""}
          {showPrice(line.total)}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expandable && open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full overflow-hidden"
          >
            <div className="mt-1 flex w-full flex-col items-start gap-1 border-s-2 border-border-default ps-3">
              <div className="flex w-full items-center gap-2">
                <span className={`flex-1 text-text-tertiary ${detailClass}`}>
                  {t("checkoutPage.orderSummary.basePrice")}
                </span>
                <span className={`text-text-tertiary ${detailClass}`}>
                  {showPrice(line.baseAmount as number)}
                </span>
              </div>
              {/* A taxable element that no rule matched has no components —
                  the base price alone is the whole story there. */}
              {(line.taxComponents ?? []).map((component, index) => (
                <div key={`${component.name}-${index}`} className="flex w-full items-center gap-2">
                  <span className={`flex-1 text-text-tertiary ${detailClass}`}>
                    {component.name} ({component.percentage}%)
                  </span>
                  <span className={`text-text-tertiary ${detailClass}`}>
                    +{showPrice(component.taxAmount)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
