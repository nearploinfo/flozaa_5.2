"use client";

import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";
import {
  EXPIRED_BADGE_CLASS,
  SERVICE_REQUEST_STATUS_TONE,
  toServiceRequestStatus,
  type CustomJobRequestSummaryApi,
} from "@/lib/custom-job-requests";
import { getStatusBadgeClass } from "@/lib/helpers";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";

const MAX_VISIBLE_BIDDERS = 4;

export function ServiceRequestCard({ request }: { request: CustomJobRequestSummaryApi }) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const statusKey = toServiceRequestStatus(request.status);
  const statusClass =
    statusKey === "expired" ? EXPIRED_BADGE_CLASS : getStatusBadgeClass(SERVICE_REQUEST_STATUS_TONE[statusKey]);
  const visibleBidders = request.bidders.slice(0, MAX_VISIBLE_BIDDERS);
  const overflowCount = request.total_bids - visibleBidders.length;
  const currencyOverride = { symbol: request.currency_symbol, decimalPlaces: request.currency_decimal_places };

  return (
    <Link
      href={`/my-service-request-details/${request.id}`}
      className="flex h-full w-full flex-col items-start gap-6 overflow-hidden rounded-lg border border-border-default bg-bg-primary p-4"
    >
      <div className="flex w-full items-center justify-between">
        <span className="rounded-lg bg-bg-brand-subtle px-3 py-2 text-sm text-text-brand">
          {request.category_name}
        </span>
        <span className="text-lg font-medium text-text-primary">
          {showPrice(request.min_price, currencyOverride)}-{showPrice(request.max_price, currencyOverride)}
        </span>
      </div>

      <div className="dashed-divider" />

      <div className="flex w-full flex-1 flex-col items-start gap-1">
        <div className="flex w-full items-center gap-4">
          <span className="flex-1 text-base font-medium text-text-primary">{request.title}</span>
          <span className={cn("shrink-0 rounded-2xl px-3 py-1 text-sm", statusClass.bg, statusClass.text)}>
            {t(`serviceRequests.status.${statusKey}`)}
          </span>
        </div>
        <p className="line-clamp-2 w-full text-base text-text-primary opacity-80">{request.description}</p>
      </div>

      {request.total_bids > 0 ? (
        <div className="flex w-full items-center gap-2.5 rounded-lg border border-border-default bg-bg-secondary p-3">
          <div className="flex flex-1 items-center gap-2">
            <span className="text-base text-text-primary">{t("serviceRequests.providerBids")}</span>
            <div className="flex items-center">
              {visibleBidders.map((bidder) => (
                <div
                  key={bidder.id}
                  className="relative -ms-2 size-9 shrink-0 overflow-hidden rounded-full first:ms-0"
                >
                  <AppImage src={bidder.profile_image} alt="" fill className="object-cover" />
                </div>
              ))}
              {overflowCount > 0 && (
                <div className="relative -ms-2 flex size-9 shrink-0 items-center justify-center rounded-full bg-black/60 text-sm text-text-inverse-light">
                  {overflowCount}+
                </div>
              )}
            </div>
          </div>
          <span className="rounded-lg border border-button-secondary-outline-border px-4 py-2 text-base text-button-secondary-outline-text">
            {t("serviceRequests.viewAllBids")}
          </span>
        </div>
      ) : (
        <div className="flex w-full items-center rounded-lg border border-border-default bg-bg-secondary p-3">
          <span className="text-base text-text-primary opacity-80">{t("serviceRequests.noBids")}</span>
        </div>
      )}
    </Link>
  );
}
