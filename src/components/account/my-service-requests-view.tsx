"use client";

import { useEffect, useState } from "react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { ServiceRequestCard } from "@/components/account/service-request-card";
import { MobileServiceRequestCard } from "@/components/account/mobile-service-request-card";
import { MobileServiceRequestStatusChips } from "@/components/account/mobile-service-request-status-chips";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { NoDataFoundState } from "@/components/ui/no-data-found-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "@/components/icons/icons";
import { RequestServiceModal } from "@/components/layout/request-service-modal";
import { MobileRequestServiceScreen } from "@/components/layout/mobile-request-service-screen";
import { useIsMobile } from "@/lib/use-is-mobile";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getCustomJobRequestsApi } from "@/api/apiRoutes";
import {
  toRawCustomJobStatus,
  type CustomJobRequestSummaryApi,
  type CustomJobRequestSummaryListResponse,
  type ServiceRequestStatus,
} from "@/lib/custom-job-requests";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useAppSelector } from "@/store/hooks";

type StatusFilter = "all" | ServiceRequestStatus;

const PAGE_SIZE = 20;

export function MyServiceRequestsView() {
  const { t } = useTranslation();
  const title = t("nav.myServiceRequests");
  const { requireAuth } = useRequireAuth();
  const isMobile = useIsMobile();
  // Custom job requests are tied to a service location — no location, no "where" to
  // request service for, so hide the entry point until one's picked.
  const hasLocation = useAppSelector((state) => Boolean(state.location.current));

  const [requestServiceOpen, setRequestServiceOpen] = useState(false);
  const [requests, setRequests] = useState<CustomJobRequestSummaryApi[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getCustomJobRequestsApi({
      ...(statusFilter === "all" ? {} : { status: toRawCustomJobStatus(statusFilter) }),
      offset,
      limit: PAGE_SIZE,
    }).then((response: CustomJobRequestSummaryListResponse | null) => {
      if (cancelled) return;
      if (response?.error) {
        setStatus("error");
        return;
      }
      const page = response?.data ?? [];
      setRequests((prev) => (offset === 0 ? page : [...prev, ...page]));
      setTotal(Number(response?.total ?? 0));
      setStatus("loaded");
    });
    return () => {
      cancelled = true;
    };
  }, [offset, statusFilter, refetchKey]);

  const handleRequestSubmitted = () => {
    setOffset(0);
    setRefetchKey((value) => value + 1);
  };

  const hasMore = requests.length < total;

  const handleFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setOffset(0);
  };

  return (
    <>
      <PageBreadcrumb title={title} items={[{ label: title }]} hideMobileDivider hideBack />

      {/* Mobile — flat layout, no sidebar/card border. Desktop unchanged below. */}
      <div className="flex w-full flex-col items-start xl:hidden">
        <div className="w-full bg-bg-primary px-4 py-3 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.04)]">
          <MobileServiceRequestStatusChips value={statusFilter} onChange={handleFilterChange} />
        </div>

        <div className="flex w-full flex-col items-start gap-4 p-4">
          {status === "loading" && requests.length === 0 ? (
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <NoDataFoundState
              title={t("serviceRequests.empty")}
              description={t("serviceRequests.emptyDescription")}
              className="w-full"
            />
          ) : (
            <>
              <div className="grid w-full grid-cols-1 items-stretch gap-4 md:grid-cols-2">
                {requests.map((request) => (
                  <MobileServiceRequestCard key={request.id} request={request} />
                ))}
              </div>
              {hasMore && (
                <AppButton
                  variant="secondary-outline"
                  size="md"
                  className="mx-auto"
                  disabled={status === "loading"}
                  onClick={() => setOffset((value) => value + PAGE_SIZE)}
                >
                  {t("serviceRequests.loadMore")}
                </AppButton>
              )}
            </>
          )}
        </div>

        {hasLocation && (
          <button
            type="button"
            aria-label={t("header.requestService")}
            onClick={() => requireAuth(() => setRequestServiceOpen(true))}
            className="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-bg-brand text-text-inverse-light shadow-[0px_4px_4px_0px_rgba(0,0,0,0.04)]"
          >
            <PlusIcon className="size-6" />
          </button>
        )}
      </div>

      <div className="container hidden flex-col items-start gap-6 py-16 xl:flex xl:flex-row xl:justify-center">
        <AccountSidebar />
        <div className="flex w-full flex-1 flex-col items-start rounded-xl border border-border-default bg-bg-primary">
          <div className="flex w-full items-center justify-center gap-4 border-b border-border-default p-6">
            <span className="flex-1 text-xl font-medium text-text-primary">{title}</span>
            {hasLocation && (
              <AppButton
                variant="primary"
                size="md"
                leftIcon={PlusIcon}
                onClick={() => requireAuth(() => setRequestServiceOpen(true))}
              >
                {t("header.requestService")}
              </AppButton>
            )}
          </div>

          <div className="flex w-full flex-col items-start gap-6 p-6">
            <div className="flex items-center gap-3">
              <span className="text-lg text-text-primary">{t("serviceRequests.sortBy")}</span>
              <Select value={statusFilter} onValueChange={(value) => handleFilterChange(value as StatusFilter)}>
                <SelectTrigger className="h-12 w-52 rounded-sm border-form-field-border px-4 py-2 text-base text-form-field-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("serviceRequests.filterAll")}</SelectItem>
                  <SelectItem value="requested">{t("serviceRequests.status.requested")}</SelectItem>
                  <SelectItem value="expired">{t("serviceRequests.status.expired")}</SelectItem>
                  <SelectItem value="booked">{t("serviceRequests.status.booked")}</SelectItem>
                  <SelectItem value="cancelled">{t("serviceRequests.status.cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "loading" && requests.length === 0 ? (
              <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-48 w-full rounded-lg" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <NoDataFoundState
                title={t("serviceRequests.empty")}
                description={t("serviceRequests.emptyDescription")}
                className="w-full"
              />
            ) : (
              <>
                <div className="grid w-full grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
                  {requests.map((request) => (
                    <ServiceRequestCard key={request.id} request={request} />
                  ))}
                </div>
                {hasMore && (
                  <AppButton
                    variant="secondary-outline"
                    size="md"
                    className="mx-auto"
                    disabled={status === "loading"}
                    onClick={() => setOffset((value) => value + PAGE_SIZE)}
                  >
                    {t("serviceRequests.loadMore")}
                  </AppButton>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isMobile ? (
        <MobileRequestServiceScreen
          open={requestServiceOpen}
          onOpenChange={setRequestServiceOpen}
          onSubmitted={handleRequestSubmitted}
        />
      ) : (
        <RequestServiceModal
          open={requestServiceOpen}
          onOpenChange={setRequestServiceOpen}
          onSubmitted={handleRequestSubmitted}
        />
      )}
    </>
  );
}
