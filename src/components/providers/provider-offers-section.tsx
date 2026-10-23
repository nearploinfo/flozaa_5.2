"use client";

import { parse, format, isValid } from "date-fns";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { OfferTagIcon } from "@/components/icons/icons";
import type { PromoCodeApi } from "@/api/apiRoutes";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";

function formatExpiry(rawDate: string): string {
  // Live API returns dd-MM-yyyy regardless of the documented yyyy-MM-dd example.
  const parsed = parse(rawDate, "dd-MM-yyyy", new Date());
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : rawDate;
}

export function ProviderOffersSection({
  offers,
  status,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: {
  offers: PromoCodeApi[];
  status: "loading" | "loaded" | "error";
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid w-full grid-cols-1 gap-6 rounded-xl border border-border-default bg-bg-primary p-6 sm:grid-cols-2 xl:grid-cols-3">
        {status === "loading" &&
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-xl" />
          ))}

        {status !== "loading" && offers.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={OfferTagIcon}
              title={t("providerDetails.offers.emptyTitle")}
              description={t("providerDetails.offers.emptyDescription")}
            />
          </div>
        )}

        {offers.map((offer) => {
          const discountLabel =
            offer.discount_type === "percentage"
              ? t("checkoutPage.coupons.percentOff", {
                  percent: offer.discount,
                })
              : t("checkoutPage.coupons.amountOff", {
                  amount: showPrice(Number(offer.discount)),
                });

          const terms = [
            offer.message || null,
            t("checkoutPage.coupons.minimumOrderTerm", {
              amount: showPrice(offer.minimum_order_amount),
            }),
            t("checkoutPage.coupons.maxDiscountTerm", {
              amount: showPrice(offer.max_discount_amount),
            }),
            t("checkoutPage.coupons.validFromTerm", {
              start: formatExpiry(offer.start_date),
              end: formatExpiry(offer.end_date),
            }),
            offer.no_of_repeat_usage > 1
              ? t("checkoutPage.coupons.limitedUsesTerm", {
                  count: offer.no_of_repeat_usage,
                })
              : t("checkoutPage.coupons.validOnceTerm"),
          ].filter((term): term is string => Boolean(term));

          return (
            <div
              key={offer.id}
              className="flex items-stretch overflow-hidden rounded-xl border border-border-default bg-bg-primary"
            >
              <div className="flex w-14 shrink-0 items-center justify-center rounded-l-xl bg-bg-brand py-4">
                <span className="rotate-180 whitespace-nowrap text-lg font-semibold text-text-inverse-light [writing-mode:vertical-rl]">
                  {discountLabel}
                </span>
              </div>

              <div className="flex flex-1 flex-col items-start gap-3 p-4">
                <div className="flex w-full items-center gap-3">
                  {offer.image && (
                    <AppImage
                      src={offer.image}
                      alt={offer.promo_code}
                      className="size-12 shrink-0 rounded-lg border border-border-default object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <span className="text-sm font-medium text-text-primary">
                      {offer.promo_code}
                    </span>
                    {offer.end_date && (
                      <span className="text-sm text-text-secondary">
                        {t("checkoutPage.coupons.expiresOn", {
                          date: formatExpiry(offer.end_date),
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {terms.length > 0 && (
                  <>
                    <div className="dashed-divider" />
                    <ul className="flex w-full flex-col items-start gap-1">
                      {terms.map((term) => (
                        <li key={term} className="text-sm text-text-primary">
                          • {term}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <AppButton
          variant="secondary-outline"
          size="md"
          disabled={loadingMore}
          onClick={onLoadMore}
        >
          {loadingMore
            ? t("auth.pleaseWait")
            : t("providerDetails.offers.loadMore")}
        </AppButton>
      )}
    </div>
  );
}
