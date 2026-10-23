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

/** Mobile-only service request card — desktop keeps service-request-card.tsx unchanged. */
export function MobileServiceRequestCard({ request }: { request: CustomJobRequestSummaryApi }) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const statusKey = toServiceRequestStatus(request.status);
  const statusClass =
    statusKey === "expired" ? EXPIRED_BADGE_CLASS : getStatusBadgeClass(SERVICE_REQUEST_STATUS_TONE[statusKey]);
  const visibleBidders = request.bidders.slice(0, MAX_VISIBLE_BIDDERS);
  const currencyOverride = { symbol: request.currency_symbol, decimalPlaces: request.currency_decimal_places };

  return (
    <Link
      href={`/my-service-request-details/${request.id}`}
      className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3"
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div className="flex flex-1 flex-col items-start gap-1">
          <span className="text-sm font-semibold text-text-primary">{request.title}</span>
          <span className="text-xs font-medium text-text-brand">{request.category_name}</span>
        </div>
        <span className={cn("shrink-0 rounded-lg px-2 py-2 text-xs font-medium", statusClass.bg, statusClass.text)}>
          {t(`serviceRequests.status.${statusKey}`)}
        </span>
      </div>

      <div className="flex w-full flex-col items-start gap-2">
        <p className="line-clamp-2 w-full text-xs text-text-secondary">{request.description}</p>
        <div className="flex w-full items-center gap-1 rounded-lg bg-bg-secondary p-2">
          <span className="line-clamp-1 flex-1 text-sm text-text-primary">
            {showPrice(request.min_price, currencyOverride)}
            {Number(request.max_price) > Number(request.min_price)
              ? ` - ${showPrice(request.max_price, currencyOverride)}`
              : ""}
          </span>
        </div>
      </div>

      <div className="dashed-divider" />

      <div className="flex w-full items-center gap-3">
        {request.total_bids > 0 ? (
          <>
            <div className="flex flex-1 flex-col items-start gap-1">
              <div className="flex items-center">
                {visibleBidders.map((bidder) => (
                  <div
                    key={bidder.id}
                    className="relative -ms-2 size-5 shrink-0 overflow-hidden rounded-full first:ms-0"
                  >
                    <AppImage src={bidder.profile_image} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
              <span className="text-xs text-text-secondary">
                {t("serviceRequests.bidsReceived", { count: request.total_bids })}
              </span>
            </div>
            {statusKey === "requested" && (
              <span className="shrink-0 rounded-lg bg-button-primary-bg px-3 py-2 text-sm text-button-primary-text">
                {t("serviceRequests.viewBid")}
              </span>
            )}
          </>
        ) : (
          <span className="flex-1 text-xs text-text-secondary">{t("serviceRequests.noBids")}</span>
        )}
      </div>
    </Link>
  );
}
