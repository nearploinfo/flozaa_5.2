"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Calendar, TriangleAlert } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftIcon,
  StarIcon,
  MapPinAreaIcon,
  DownloadIcon,
  ImageAttachmentIcon,
  DocumentAttachmentIcon,
  ChatIcon,
  VerifiedBadgeIcon,
  ChevronDownIcon,
  CheckIcon,
  CloseIcon,
} from "@/components/icons/icons";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { GalleryLightbox } from "@/components/ui/gallery-lightbox";
import { useIsMobile } from "@/lib/use-is-mobile";
import { Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusBadgeClass, formatDistance } from "@/lib/helpers";
import { useDateTimeFormatter } from "@/lib/use-date-time-formatter";
import {
  getCustomJobRequestDetailsApi,
  getCustomJobRequestProvidersApi,
  getReasonsApi,
  cancleCustomJobReqApi,
} from "@/api/apiRoutes";
import {
  toServiceRequestStatus,
  SERVICE_REQUEST_STATUS_TONE,
  type CustomJobRequestDetailApi,
  type CustomJobRequestDetailResponse,
  type CustomJobRequestProviderApi,
  type CustomJobRequestProvidersResponse,
  type CustomJobProviderSort,
} from "@/lib/custom-job-requests";
import { usePriceFormatter } from "@/lib/show-price";
import { useDistanceUnit } from "@/lib/use-distance-unit";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCustomJobData } from "@/store/slices/custom-job-slice";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AccountSidebar } from "@/components/account/account-sidebar";

const SORT_OPTIONS: { value: CustomJobProviderSort; labelKey: string }[] = [
  { value: "price_low_to_high", labelKey: "sortPriceLowToHigh" },
  { value: "price_high_to_low", labelKey: "sortPriceHighToLow" },
  { value: "rating_high_to_low", labelKey: "sortRatingHighToLow" },
  { value: "rating_low_to_high", labelKey: "sortRatingLowToHigh" },
  { value: "distance_low_to_high", labelKey: "sortDistanceLowToHigh" },
  { value: "distance_high_to_low", labelKey: "sortDistanceHighToLow" },
  { value: "duration_shortest_first", labelKey: "sortDurationShortest" },
  { value: "duration_longest_first", labelKey: "sortDurationLongest" },
];

interface CancelReason {
  id: number;
  reason: string;
  translated_reason?: string;
  needs_additional_info?: number | string;
}

const needsAdditionalInfo = (value: CancelReason["needs_additional_info"]) => value === 1 || value === "1";
const toBool = (value: unknown) => value === 1 || value === "1" || value === true;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Ticking "HH:MM:SS" remaining until `targetIso`. Null until mounted, to avoid an SSR/client time mismatch. */
function useCountdown(targetIso: string | null): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!targetIso) return;
    const target = new Date(targetIso).getTime();
    const tick = () => {
      const remainingMs = Math.max(0, target - Date.now());
      const totalSeconds = Math.floor(remainingMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setLabel(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  return label;
}

function fileNameFromUrl(url: string): string {
  try {
    return decodeURIComponent(url.split("/").pop() ?? url);
  } catch {
    return url;
  }
}

/** Thumbnail grid (max 3 shown) for the request's image attachments — clicking any thumbnail
 * or "View All" opens the shared lightbox at that image. */
function AttachmentImagesGroup({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (index: number) => void;
}) {
  const { t } = useTranslation();
  if (images.length === 0) return null;
  const visible = images.slice(0, 3);

  return (
    <div className="flex w-full flex-col items-start gap-3 rounded-lg border border-border-default bg-bg-primary p-3">
      <div className="flex w-full items-center gap-2">
        <span className="flex items-center justify-center rounded-lg bg-bg-secondary p-2">
          <ImageAttachmentIcon className="size-4 text-icon-primary" />
        </span>
        <span className="flex-1 text-base text-text-primary">{t("serviceRequests.allImages")}</span>
        <button
          type="button"
          onClick={() => onOpen(0)}
          className="rounded-sm px-2 py-1 text-sm text-button-link-primary-focus"
        >
          {t("common.viewAll")}
        </button>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2">
        {visible.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => onOpen(index)}
            aria-label={t("common.viewAll")}
            className="relative size-14 shrink-0 overflow-hidden rounded-lg"
          >
            <AppImage src={url} alt="" fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function AttachmentRow({ url, icon: Icon }: { url: string; icon: React.ComponentType<{ className?: string }> }) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-border-default bg-bg-primary p-3">
      <Icon className="size-4 shrink-0 text-icon-primary" />
      <span className="flex-1 truncate text-base text-text-primary">{fileNameFromUrl(url)}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-sm bg-button-secondary-bg p-1"
        aria-label={t("serviceRequests.download")}
      >
        <DownloadIcon className="size-3.5 text-button-secondary-text" />
      </a>
    </div>
  );
}

export function ServiceRequestDetailsView({ id }: { id: string }) {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const isMobile = useIsMobile();
  const dispatch = useAppDispatch();
  const showPrice = usePriceFormatter();
  const { formatDateTime } = useDateTimeFormatter();
  const distanceUnit = useDistanceUnit();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);

  const [detail, setDetail] = useState<CustomJobRequestDetailApi | null>(null);
  const [detailStatus, setDetailStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [providers, setProviders] = useState<CustomJobRequestProviderApi[]>([]);
  const [providersStatus, setProvidersStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [sortBy, setSortBy] = useState<CustomJobProviderSort | "recent">("recent");
  const [mobileTab, setMobileTab] = useState<"details" | "bids">("details");
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [detailRefetchKey, setDetailRefetchKey] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  const [checkingCancelReasons, setCheckingCancelReasons] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReasons, setCancelReasons] = useState<CancelReason[]>([]);
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const [selectedCancelReasonId, setSelectedCancelReasonId] = useState<number | null>(null);
  const [cancelAdditionalInfo, setCancelAdditionalInfo] = useState("");

  useEffect(() => {
    let cancelled = false;
    setDetailStatus("loading");
    getCustomJobRequestDetailsApi({
      id,
      ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
    }).then((response: CustomJobRequestDetailResponse | null) => {
      if (cancelled) return;
      if (response?.error || !response?.data) {
        setDetailStatus("error");
        return;
      }
      setDetail(response.data);
      setDetailStatus("loaded");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lat/lng read once per fetch, not a reactive filter
  }, [id, detailRefetchKey]);

  const isBooked = detail ? toServiceRequestStatus(detail.status) === "booked" : false;

  useEffect(() => {
    if (isBooked) {
      setProvidersStatus("loaded");
      return;
    }
    let cancelled = false;
    setProvidersStatus("loading");
    getCustomJobRequestProvidersApi({
      id,
      ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
      ...(sortBy === "recent" ? {} : { sort_by: sortBy }),
    }).then((response: CustomJobRequestProvidersResponse | null) => {
      if (cancelled) return;
      if (response?.error) {
        setProvidersStatus("error");
        return;
      }
      setProviders(response?.data ?? []);
      setProvidersStatus("loaded");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lat/lng read once per fetch, not a reactive filter
  }, [id, sortBy, isBooked]);

  const handleUnavailable = () => toast.info(t("serviceRequests.actionUnavailable"));

  const submitCancel = async (payload: { cancel_reason_id?: number; additional_info?: string }) => {
    setCancelling(true);
    try {
      const response = await cancleCustomJobReqApi({
        custom_job_request_id: id,
        ...(payload.cancel_reason_id ? { cancel_reason_id: payload.cancel_reason_id } : {}),
        ...(payload.additional_info ? { additional_info: payload.additional_info } : {}),
      });
      if (response?.error) throw new Error(response?.message);
      toast.success(response?.message || t("serviceRequests.cancelModal.success"));
      setCancelSheetOpen(false);
      setDetailRefetchKey((value) => value + 1);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("serviceRequests.cancelModal.failed"));
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelClick = async () => {
    setCheckingCancelReasons(true);
    try {
      const response = await getReasonsApi({ type: "cancel" });
      const reasons: CancelReason[] = Array.isArray(response?.data) ? response.data : [];
      if (reasons.length > 0) {
        setCancelReasons(reasons);
        setSelectedCancelReasonId(null);
        setCancelAdditionalInfo("");
        setCancelSheetOpen(true);
      } else {
        await submitCancel({});
      }
    } catch {
      await submitCancel({});
    } finally {
      setCheckingCancelReasons(false);
    }
  };

  const selectedCancelReason = cancelReasons.find((reason) => reason.id === selectedCancelReasonId) ?? null;
  const cancelReasonNeedsInfo = needsAdditionalInfo(selectedCancelReason?.needs_additional_info);
  const canSubmitCancel =
    selectedCancelReasonId !== null && (!cancelReasonNeedsInfo || cancelAdditionalInfo.trim().length > 0);

  const handleBookProvider = (provider: CustomJobRequestProviderApi) => {
    dispatch(
      setCustomJobData({
        customJobRequestId: Number(id),
        bidderId: provider.provider_id,
        companyName: provider.company_name,
        providerImage: provider.provider_image,
        counterPrice: provider.counter_price,
        duration: provider.duration,
        serviceTitle: detail?.title,
        atDoorstep: toBool(provider.at_doorstep),
        atStore: toBool(provider.at_store),
        providerLatitude: provider.latitude,
        providerLongitude: provider.longitude,
      })
    );
    router.push(localizePath("/checkout", lang, defaultLocale) + `?customJobRequestId=${id}`);
  };

  const statusKey = detail ? toServiceRequestStatus(detail.status) : null;
  const countdown = useCountdown(statusKey === "requested" && detail ? detail.end_date_time : null);

  if (detailStatus === "loading") {
    return (
      <div className="container flex flex-col items-start gap-6 py-16 xl:flex-row xl:justify-center">
        <AccountSidebar />
        <div className="flex w-full flex-1 flex-col items-start gap-4 rounded-xl border border-border-default bg-bg-primary p-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="container flex flex-col items-start gap-6 py-16 xl:flex-row xl:justify-center">
        <AccountSidebar />
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-border-default bg-bg-primary p-16 text-center">
          <span className="text-base text-text-secondary">{t("serviceRequests.notFound")}</span>
        </div>
      </div>
    );
  }

  const resolvedStatusKey = toServiceRequestStatus(detail.status);
  const statusClass =
    resolvedStatusKey === "booked"
      ? { bg: "bg-bg-brand-subtle", text: "text-text-brand" }
      : getStatusBadgeClass(SERVICE_REQUEST_STATUS_TONE[resolvedStatusKey]);

  const attachmentImages = detail.attachments.images;
  const attachmentRows = [
    ...detail.attachments.videos.map((url) => ({ url, icon: Video })),
    ...detail.attachments.others.map((url) => ({ url, icon: DocumentAttachmentIcon })),
  ];
  const hasAttachments = attachmentImages.length > 0 || attachmentRows.length > 0;

  return (
    <>
      <PageBreadcrumb
        title={t("serviceRequests.bookingDetailsBreadcrumb")}
        items={[
          { label: t("nav.myServiceRequests"), href: "/my-services-requests" },
          { label: t("nav.myServiceRequests") },
        ]}
      />

      {/* Mobile — flat layout, no sidebar/card border. Desktop unchanged below. */}
      <div className="flex w-full flex-col items-start bg-bg-secondary xl:hidden">
        {!isBooked && (
          <div className="flex w-full items-center gap-4 bg-bg-primary px-4 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={() => setMobileTab("details")}
              className="flex flex-1 flex-col items-center gap-3 px-3 pt-2"
            >
              <span
                className={cn(
                  "text-sm",
                  mobileTab === "details" ? "font-semibold text-text-brand" : "font-normal text-text-primary"
                )}
              >
                {t("serviceRequests.requestDetailsTab")}
              </span>
              <span className={cn("h-1 w-full rounded-t-lg", mobileTab === "details" && "bg-bg-brand")} />
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("bids")}
              className="flex flex-1 flex-col items-center gap-3 px-3 pt-2"
            >
              <span
                className={cn(
                  "text-sm",
                  mobileTab === "bids" ? "font-semibold text-text-brand" : "font-normal text-text-primary"
                )}
              >
                {t("serviceRequests.providers")} ({String(providers.length).padStart(2, "0")})
              </span>
              <span className={cn("h-1 w-full rounded-t-lg", mobileTab === "bids" && "bg-bg-brand")} />
            </button>
          </div>
        )}

        <div className="flex w-full flex-col items-start gap-4 p-4 pb-20">
          {(isBooked || mobileTab === "details") && (
            <>
              <div className="flex w-full flex-col items-start gap-3 rounded-lg bg-bg-primary p-3">
                <div className="flex w-full items-center gap-4">
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <span className="text-sm font-semibold text-text-primary">{detail.title}</span>
                    <span className="text-xs font-medium text-text-brand">{detail.category_name}</span>
                  </div>
                  <span className={cn("shrink-0 rounded-lg px-2 py-2 text-xs font-medium", statusClass.bg, statusClass.text)}>
                    {t(`serviceRequests.status.${resolvedStatusKey}`)}
                  </span>
                </div>

                {resolvedStatusKey === "requested" && providers.length > 0 && (
                  <div className="flex w-full items-center gap-1 rounded-lg bg-alert-info-bg p-2">
                    <span className="flex-1 text-xs font-medium text-text-brand">
                      {countdown ? `${countdown} ${t("serviceRequests.hoursLeft")}` : " "}
                    </span>
                  </div>
                )}

                {resolvedStatusKey === "expired" && (
                  <div className="flex w-full items-center gap-3 rounded-lg bg-alert-error-bg p-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-error">
                      <TriangleAlert className="size-5 text-icon-inverse" />
                    </span>
                    <div className="flex flex-1 flex-col items-start gap-0.5">
                      <span className="text-xs text-text-primary">{t("serviceRequests.expiredBannerTitle")}</span>
                      <span className="text-xs font-medium text-alert-error-text">
                        {t("serviceRequests.expiredBannerDescription")}
                      </span>
                    </div>
                  </div>
                )}

                {resolvedStatusKey === "cancelled" && detail.cancellation && (
                  <div className="flex w-full flex-col items-start gap-1 rounded-lg bg-alert-error-bg p-3">
                    <span className="text-xs text-text-secondary">
                      {t("serviceRequests.cancellationReasonLabel")}
                    </span>
                    <span className="text-xs font-semibold text-text-primary">{detail.cancellation.reason}</span>
                    {detail.cancellation.additional_info && (
                      <>
                        <span className="mt-1 text-xs text-text-secondary">
                          {t("serviceRequests.cancellationAdditionalInfoLabel")}
                        </span>
                        <span className="text-xs text-text-primary">{detail.cancellation.additional_info}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {isBooked && detail.bid_details && (
                <div className="flex w-full flex-col items-start gap-2">
                  <span className="text-base font-medium text-text-primary">{t("serviceRequests.providers")}</span>
                  <div className="flex w-full flex-col items-start gap-4 rounded-xl bg-bg-primary p-3">
                    <div className="flex w-full items-center gap-3">
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-md">
                        <AppImage src={detail.bid_details.profile_image} alt={detail.bid_details.company_name} fill className="object-cover" />
                      </div>
                      <div className="flex flex-1 flex-col items-start gap-1">
                        <span className="flex items-center gap-1 text-sm font-semibold text-text-primary">
                          {detail.bid_details.company_name}
                          {detail.bid_details.is_verified === 1 && (
                            <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                          )}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                          {Number(detail.bid_details.average_rating) > 0 && (
                            <>
                              <StarIcon className="size-3.5 text-icon-warning" />
                              <span className="text-text-primary">{detail.bid_details.average_rating}</span>
                              <span>({detail.bid_details.total_ratings})</span>
                            </>
                          )}
                          {detail.bid_details.distance != null && (
                            <>
                              <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-40" />
                              <MapPinAreaIcon className="size-3.5 text-icon-secondary" />
                              <span>{formatDistance(detail.bid_details.distance, distanceUnit)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="dashed-divider" />

                    <div className="flex w-full flex-col items-start gap-2">
                      <div className="flex w-full items-start gap-2">
                        <span className="rounded-lg bg-bg-brand-subtle px-3 py-1 text-sm text-text-primary">
                          {showPrice(detail.bid_details.counter_price)}
                        </span>
                        <span className="rounded-lg bg-bg-brand-subtle px-2 py-1 text-sm text-text-primary">
                          {t("common.minutesCount", { count: detail.bid_details.duration })}
                        </span>
                      </div>
                      <div className="flex w-full flex-col items-start gap-1 rounded-lg bg-bg-secondary p-2">
                        <span className="text-xs text-text-primary">{t("serviceRequests.providerMessage")}</span>
                        <span className="text-xs text-text-secondary">{detail.bid_details.message}</span>
                      </div>
                    </div>

                    <div className="flex w-full items-center gap-4">
                      <div className="flex flex-1 flex-col items-start gap-1">
                        <span className="text-xs text-text-secondary">{t("serviceRequests.bidPlacedOn")}</span>
                        <span className="text-xs text-text-primary">{formatDateTime(detail.bid_details.date_time)}</span>
                      </div>
                      <span className="flex items-center gap-1 rounded-lg bg-bg-success px-2 py-2 text-base text-text-inverse-light">
                        <CheckIcon className="size-5 text-icon-inverse" />
                        {t("serviceRequests.booked")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex w-full flex-col items-start gap-4 rounded-lg bg-bg-primary p-3">
                <span className="text-base font-medium text-text-primary">
                  {t("serviceRequests.viewRequestDetailsTitle")}
                </span>
                <div className="dashed-divider" />
                <div className="flex w-full flex-col items-start gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {t("serviceRequests.descriptionSectionLabel")}
                  </span>
                  <p className="w-full text-xs text-text-secondary">{detail.description}</p>
                </div>
                <div className="dashed-divider" />
                <div className="flex w-full items-start gap-2">
                  <span className="flex items-center justify-center rounded-lg bg-bg-secondary p-2">
                    <Calendar className="size-4 text-icon-primary" />
                  </span>
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <span className="text-xs text-text-secondary opacity-80">{t("serviceRequests.startAtLabel")}</span>
                    <span className="text-xs text-text-primary">{formatDateTime(detail.start_date_time)}</span>
                  </div>
                </div>
                <div className="dashed-divider" />
                <div className="flex w-full items-start gap-2">
                  <span className="flex items-center justify-center rounded-lg bg-bg-secondary p-2">
                    <Calendar className="size-4 text-icon-primary" />
                  </span>
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <span className="text-xs text-text-secondary opacity-80">{t("serviceRequests.endAtLabel")}</span>
                    <span className="text-xs text-text-primary">{formatDateTime(detail.end_date_time)}</span>
                  </div>
                </div>
              </div>

              {hasAttachments && (
                <div className="flex w-full flex-col items-start gap-4 rounded-lg bg-bg-primary p-3">
                  <span className="text-base font-medium text-text-primary">{t("serviceRequests.attachments")}</span>
                  <div className="dashed-divider" />
                  <div className="flex w-full flex-col items-start gap-3">
                    <AttachmentImagesGroup images={attachmentImages} onOpen={openLightbox} />
                    {attachmentRows.map((attachment) => (
                      <AttachmentRow key={attachment.url} url={attachment.url} icon={attachment.icon} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!isBooked && mobileTab === "bids" && (
            <>
              <div className="flex w-full items-center gap-4">
                <span className="flex-1 text-base font-medium text-text-primary">
                  {t("serviceRequests.providers")}
                </span>
                <button
                  type="button"
                  onClick={() => setSortSheetOpen(true)}
                  className="flex items-center gap-1 rounded-lg border border-border-default bg-bg-primary p-2 text-xs font-medium text-text-primary"
                >
                  {t("serviceRequests.sortBy")}
                  <ChevronDownIcon className="size-4 text-icon-primary" />
                </button>
              </div>

              {providersStatus === "loading" ? (
                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton key={index} className="h-40 w-full rounded-xl" />
                  ))}
                </div>
              ) : providers.length === 0 ? (
                <span className="w-full py-8 text-center text-sm text-text-secondary">
                  {t("serviceRequests.noBids")}
                </span>
              ) : (
                <div className="grid w-full grid-cols-1 items-stretch gap-4 md:grid-cols-2">
                {providers.map((provider) => (
                  <div
                    key={provider.provider_id}
                    className="flex w-full flex-col items-start gap-4 rounded-xl bg-bg-primary p-3"
                  >
                    <div className="flex w-full items-center gap-3">
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-md">
                        <AppImage src={provider.provider_image} alt={provider.company_name} fill className="object-cover" />
                      </div>
                      <div className="flex flex-1 flex-col items-start gap-1">
                        <span className="flex items-center gap-1 text-sm font-semibold text-text-primary">
                          {provider.company_name}
                          {provider.is_provider_verified === 1 && (
                            <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                          )}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                          {Number(provider.average_rating) > 0 && (
                            <>
                              <StarIcon className="size-3.5 text-icon-warning" />
                              <span className="text-text-primary">{provider.average_rating}</span>
                              <span>({provider.total_ratings})</span>
                            </>
                          )}
                          {provider.distance != null && (
                            <>
                              <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-40" />
                              <MapPinAreaIcon className="size-3.5 text-icon-secondary" />
                              <span>{formatDistance(provider.distance, distanceUnit)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {provider.pre_booking_chat === 1 && (
                        <button
                          type="button"
                          onClick={handleUnavailable}
                          aria-label={t("chats.chatOptions")}
                          className="flex items-center justify-center rounded-lg bg-sky-100 p-2"
                        >
                          <ChatIcon className="size-5 text-icon-brand" />
                        </button>
                      )}
                    </div>

                    <div className="dashed-divider" />

                    <div className="flex w-full flex-col items-start gap-2">
                      <div className="flex w-full items-start gap-2">
                        <span className="rounded-lg bg-bg-brand-subtle px-3 py-1 text-sm text-text-primary">
                          {showPrice(provider.counter_price)}
                        </span>
                        <span className="rounded-lg bg-bg-brand-subtle px-2 py-1 text-sm text-text-primary">
                          {t("common.minutesCount", { count: provider.duration })}
                        </span>
                      </div>
                      <div className="flex w-full flex-col items-start gap-1 rounded-lg bg-bg-secondary p-2">
                        <span className="text-xs text-text-primary">{t("serviceRequests.providerMessage")}</span>
                        <span className="text-xs text-text-secondary">{provider.message}</span>
                      </div>
                    </div>

                    <div className="flex w-full items-center gap-4">
                      <div className="flex flex-1 flex-col items-start gap-1">
                        <span className="text-xs text-text-secondary">{t("serviceRequests.bidPlacedOn")}</span>
                        <span className="text-xs text-text-primary">{formatDateTime(provider.bid_date)}</span>
                      </div>
                      {resolvedStatusKey === "requested" && (
                        <AppButton variant="primary" size="sm" onClick={() => handleBookProvider(provider)}>
                          {t("serviceRequests.bookProvider")}
                        </AppButton>
                      )}
                    </div>
                  </div>
                ))}
                </div>
              )}
            </>
          )}
        </div>

        {isBooked && (
          <div className="fixed inset-x-0 bottom-0 z-40 flex w-full flex-col items-center gap-2 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)] xl:hidden">
            <AppButton variant="primary" size="md" className="w-full" onClick={handleUnavailable}>
              {t("serviceRequests.viewBookingCta")}
            </AppButton>
          </div>
        )}

        {resolvedStatusKey === "requested" && (
          <div className="fixed inset-x-0 bottom-0 z-40 flex w-full flex-col items-center gap-2 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)] xl:hidden">
            <button
              type="button"
              disabled={checkingCancelReasons || cancelling}
              onClick={handleCancelClick}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-alert-error-border bg-alert-error-bg p-3 text-base font-medium text-alert-error-text disabled:opacity-50"
            >
              {t("serviceRequests.cancelRequestCta")}
            </button>
          </div>
        )}

        <Sheet open={sortSheetOpen} onOpenChange={setSortSheetOpen}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="z-70 flex max-h-[80vh] w-full flex-col gap-4 overflow-y-auto rounded-t-2xl p-4 xl:hidden"
          >
            <div className="mx-auto h-1 w-10 shrink-0 rounded-3xl bg-bg-inverse/20" />
            <SheetTitle className="w-full text-center text-base font-medium text-text-primary">
              {t("serviceRequests.sortBy")}
            </SheetTitle>
            <div className="flex w-full flex-col items-start gap-3">
              {[{ value: "recent" as const, labelKey: null }, ...SORT_OPTIONS].map((option, index, array) => {
                const active = sortBy === option.value;
                return (
                  <div key={option.value} className="flex w-full flex-col items-start gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy(option.value);
                        setSortSheetOpen(false);
                      }}
                      className="flex w-full items-center gap-3"
                    >
                      <span className={cn("flex-1 text-start text-sm", active ? "font-semibold text-text-primary" : "font-normal text-text-primary")}>
                        {option.labelKey ? t(`serviceRequests.${option.labelKey}`) : t("serviceRequests.sortDefault")}
                      </span>
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                          active ? "border-border-brand bg-bg-brand" : "border-border-default"
                        )}
                      >
                        {active && <span className="size-2 rounded-full bg-bg-primary" />}
                      </span>
                    </button>
                    {index < array.length - 1 && <div className="dashed-divider" />}
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="container hidden flex-col items-start gap-6 py-16 xl:flex xl:flex-row xl:justify-center">
        <AccountSidebar />
        <div className="flex w-full flex-1 flex-col items-start rounded-xl border border-border-default bg-bg-primary">
          <div className="flex w-full items-center justify-center gap-4 border-b border-border-default p-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-secondary p-2"
              aria-label={t("serviceRequests.back")}
            >
              <ArrowLeftIcon className="size-6 text-button-secondary-outline-text rtl:rotate-180" />
            </button>
            <span className="flex-1 text-xl font-medium text-text-primary">{t("serviceRequests.detailsTitle")}</span>
          </div>

          <div className="flex w-full flex-col items-start gap-6 p-6">
            {resolvedStatusKey === "requested" && providers.length > 0 && (
              <div className="flex w-full items-center gap-4 rounded-lg border border-border-info bg-alert-info-bg p-4">
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className="text-lg font-medium text-text-info">{t("serviceRequests.expiryBannerTitle")}</span>
                  <span className="text-base text-text-primary">{t("serviceRequests.expiryBannerDescription")}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-bg-info px-3 py-2">
                  <span className="text-lg font-medium text-text-inverse-light">
                    {countdown ? `${countdown} ${t("serviceRequests.hoursLeft")}` : " "}
                  </span>
                </div>
              </div>
            )}

            {resolvedStatusKey === "expired" && (
              <div className="flex w-full items-center gap-4 rounded-lg border border-alert-error-border bg-alert-error-bg p-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-bg-error">
                  <TriangleAlert className="size-6 text-icon-inverse" />
                </span>
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className="text-base text-text-primary">{t("serviceRequests.expiredBannerTitle")}</span>
                  <span className="text-lg font-medium text-alert-error-text">
                    {t("serviceRequests.expiredBannerDescription")}
                  </span>
                </div>
              </div>
            )}

            {resolvedStatusKey === "cancelled" && detail.cancellation && (
              <div className="flex w-full flex-col items-start gap-1 rounded-lg border border-alert-error-border bg-alert-error-bg p-4">
                <span className="text-base text-text-secondary">{t("serviceRequests.cancellationReasonLabel")}</span>
                <span className="text-lg font-medium text-text-primary">{detail.cancellation.reason}</span>
                {detail.cancellation.additional_info && (
                  <>
                    <span className="mt-2 text-base text-text-secondary">
                      {t("serviceRequests.cancellationAdditionalInfoLabel")}
                    </span>
                    <span className="text-lg text-text-primary">{detail.cancellation.additional_info}</span>
                  </>
                )}
              </div>
            )}

            <div className="flex w-full flex-col items-start rounded-lg border border-border-default">
              <div className="flex w-full items-center justify-center gap-4 rounded-tl-lg rounded-tr-lg border-b border-border-default bg-bg-secondary p-4">
                <span className="flex-1 text-base text-text-primary opacity-90">{t("serviceRequests.bookingDetails")}</span>
              </div>
              <div className="flex w-full flex-col items-start gap-6 p-4">
                <div className="flex w-full flex-col items-start gap-4">
                  <span className={cn("rounded-lg px-3 py-1 text-base", statusClass.bg, statusClass.text)}>
                    {t(`serviceRequests.status.${resolvedStatusKey}`)}
                  </span>

                  <div className="flex w-full flex-col items-start gap-4">
                    <div className="flex w-full items-center gap-4">
                      <div className="flex flex-1 flex-col items-start gap-2">
                        <span className="text-lg font-medium text-text-primary">{detail.title}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-base text-text-primary opacity-80">
                            {t("serviceRequests.category")}:
                          </span>
                          <span className="text-base font-medium text-text-brand">{detail.category_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="dashed-divider" />
                    <p className="w-full text-base text-text-primary opacity-70">{detail.description}</p>
                  </div>
                </div>

                <div className="flex w-full flex-col items-start gap-4">
                  <div className="flex w-full items-start gap-4">
                    <DetailField
                      icon={Calendar}
                      label={t("serviceRequests.startDate")}
                      value={formatDateTime(detail.start_date_time)}
                    />
                    <DetailField
                      icon={Calendar}
                      label={t("serviceRequests.endDate")}
                      value={formatDateTime(detail.end_date_time)}
                    />
                  </div>
                  {resolvedStatusKey === "requested" && (
                    <>
                      <div className="dashed-divider" />
                      <button
                        type="button"
                        disabled={checkingCancelReasons || cancelling}
                        onClick={handleCancelClick}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-alert-error-border bg-alert-error-bg px-4 text-base font-medium text-alert-error-text disabled:opacity-50"
                      >
                        {t("serviceRequests.cancelRequestCta")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {hasAttachments && (
              <div className="flex w-full flex-col items-start overflow-hidden rounded-lg border border-border-default">
                <div className="flex w-full items-center gap-2 border-b border-border-default bg-bg-secondary p-4">
                  <span className="flex-1 text-base text-text-primary opacity-90">{t("serviceRequests.attachments")}</span>
                </div>
                <div className="flex w-full flex-col items-start gap-4 p-4">
                  <AttachmentImagesGroup images={attachmentImages} onOpen={openLightbox} />
                  <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                    {attachmentRows.map((attachment) => (
                      <AttachmentRow key={attachment.url} url={attachment.url} icon={attachment.icon} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex w-full flex-col items-start overflow-hidden rounded-lg border border-border-default">
              <div className="flex w-full items-center gap-4 border-b border-border-default bg-bg-secondary p-4">
                <div className="flex flex-1 items-center gap-2">
                  <span className="text-base text-text-primary">{t("serviceRequests.providers")}</span>
                  <span className="text-base font-medium text-text-primary">
                    ({String(isBooked ? 1 : providers.length).padStart(2, "0")} {t("serviceRequests.bids")})
                  </span>
                </div>
                {!isBooked && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-text-primary">{t("serviceRequests.sortBy")}</span>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as CustomJobProviderSort)}>
                      <SelectTrigger className="h-12 w-64 rounded-sm border-form-field-border bg-bg-primary px-4 py-2 text-base text-form-field-text">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">{t("serviceRequests.filterAll")}</SelectItem>
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {t(`serviceRequests.${option.labelKey}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col items-center gap-4 p-4">
                {isBooked && detail.bid_details ? (
                  <div className="flex w-full flex-col items-start gap-4 rounded-sm border border-border-default bg-bg-primary p-4">
                    <div className="flex w-full items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                        <AppImage
                          src={detail.bid_details.profile_image}
                          alt={detail.bid_details.company_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col items-start gap-1">
                        <span className="flex items-center gap-1 text-base font-medium text-text-primary">
                          {detail.bid_details.company_name}
                          {detail.bid_details.is_verified === 1 && (
                            <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          {Number(detail.bid_details.average_rating) > 0 && (
                            <div className="flex items-center gap-1">
                              <StarIcon className="size-3.5 text-icon-warning" />
                              <span className="text-sm text-text-primary">{detail.bid_details.average_rating}</span>
                              <span className="text-sm text-text-secondary">({detail.bid_details.total_ratings})</span>
                            </div>
                          )}
                          {detail.bid_details.distance != null && (
                            <>
                              <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-40" />
                              <div className="flex items-center gap-1">
                                <MapPinAreaIcon className="size-3.5 text-icon-secondary" />
                                <span className="text-sm text-text-secondary">
                                  {formatDistance(detail.bid_details.distance, distanceUnit)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-lg font-medium text-text-primary">
                          {showPrice(detail.bid_details.counter_price)}
                        </span>
                        <span className="text-sm text-text-primary">
                          {t("common.minutesCount", { count: detail.bid_details.duration })}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-full flex-col items-start gap-2 bg-bg-secondary p-3">
                      <span className="text-sm text-text-secondary">{t("serviceRequests.providerMessage")}</span>
                      <span className="text-sm text-text-primary">{detail.bid_details.message}</span>
                    </div>

                    <div className="dashed-divider" />

                    <div className="flex w-full items-center gap-6">
                      <div className="flex flex-1 items-center gap-1 opacity-90">
                        <span className="text-sm text-text-primary">{t("serviceRequests.bidPlacedOn")}</span>
                        <span className="text-sm text-text-primary">{formatDateTime(detail.bid_details.date_time)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 rounded-lg bg-bg-success px-4 py-2 text-base text-button-primary-text">
                          {t("serviceRequests.booked")}
                        </span>
                        {detail.bid_details.post_booking_chat === 1 && (
                          <AppButton variant="primary" size="md" leftIcon={ChatIcon} onClick={handleUnavailable}>
                            {t("serviceRequests.chat")}
                          </AppButton>
                        )}
                      </div>
                    </div>
                  </div>
                ) : providersStatus === "loading" ? (
                  <div className="flex w-full flex-col items-start gap-4">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <Skeleton key={index} className="h-40 w-full rounded-sm" />
                    ))}
                  </div>
                ) : providers.length === 0 ? (
                  <span className="w-full py-8 text-center text-base text-text-secondary">
                    {t("serviceRequests.noBids")}
                  </span>
                ) : (
                  providers.map((provider) => (
                    <div
                      key={provider.provider_id}
                      className="flex w-full flex-col items-start gap-4 rounded-sm border border-border-default bg-bg-primary p-4"
                    >
                      <div className="flex w-full items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                          <AppImage src={provider.provider_image} alt={provider.company_name} fill className="object-cover" />
                        </div>
                        <div className="flex flex-1 flex-col items-start gap-1">
                          <span className="flex items-center gap-1 text-base font-medium text-text-primary">
                            {provider.company_name}
                            {provider.is_provider_verified === 1 && (
                              <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            {Number(provider.average_rating) > 0 && (
                              <div className="flex items-center gap-1">
                                <StarIcon className="size-3.5 text-icon-warning" />
                                <span className="text-sm text-text-primary">{provider.average_rating}</span>
                                <span className="text-sm text-text-secondary">({provider.total_ratings})</span>
                              </div>
                            )}
                            {provider.distance != null && (
                              <>
                                <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-40" />
                                <div className="flex items-center gap-1">
                                  <MapPinAreaIcon className="size-3.5 text-icon-secondary" />
                                  <span className="text-sm text-text-secondary">
                                    {formatDistance(provider.distance, distanceUnit)}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-lg font-medium text-text-primary">{showPrice(provider.counter_price)}</span>
                          <span className="text-sm text-text-primary">
                            {t("common.minutesCount", { count: provider.duration })}
                          </span>
                        </div>
                      </div>

                      <div className="flex w-full flex-col items-start gap-2 bg-bg-secondary p-3">
                        <span className="text-sm text-text-secondary">{t("serviceRequests.providerMessage")}</span>
                        <span className="text-sm text-text-primary">{provider.message}</span>
                      </div>

                      <div className="dashed-divider" />

                      <div className="flex w-full items-center gap-6">
                        <div className="flex flex-1 items-center gap-1 opacity-90">
                          <span className="text-sm text-text-primary">{t("serviceRequests.bidPlacedOn")}</span>
                          <span className="text-sm text-text-primary">{formatDateTime(provider.bid_date)}</span>
                        </div>
                        {resolvedStatusKey === "requested" && (
                          <div className="flex items-center gap-3">
                            <AppButton variant="primary-outline" size="md" onClick={() => handleBookProvider(provider)}>
                              {t("serviceRequests.bookProvider")}
                            </AppButton>
                            {provider.pre_booking_chat === 1 && (
                              <AppButton
                                variant="primary-outline"
                                size="md"
                                iconOnly
                                leftIcon={ChatIcon}
                                onClick={handleUnavailable}
                              >
                                {t("chats.chatOptions")}
                              </AppButton>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMobile ? (
        <Sheet
          open={cancelSheetOpen}
          onOpenChange={(next) => {
            if (!next) {
              setSelectedCancelReasonId(null);
              setCancelAdditionalInfo("");
            }
            setCancelSheetOpen(next);
          }}
        >
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="z-70 flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden rounded-t-2xl p-0"
          >
            <div className="flex w-full flex-col items-center gap-2 px-4 pt-4">
              <div className="h-2 w-10 shrink-0 rounded-3xl bg-bg-inverse/20" />
              <SheetTitle className="w-full text-center text-base font-medium text-text-primary">
                {t("serviceRequests.cancelModal.mobileTitle")}
              </SheetTitle>
              <div className="dashed-divider" />
            </div>

            <div className="flex w-full flex-1 flex-col items-start gap-4 overflow-y-auto p-4">
              <CancelReasonList
                variant="radio"
                reasons={cancelReasons}
                selectedReasonId={selectedCancelReasonId}
                onSelect={setSelectedCancelReasonId}
                needsAdditionalInfo={cancelReasonNeedsInfo}
                additionalInfo={cancelAdditionalInfo}
                onAdditionalInfoChange={setCancelAdditionalInfo}
                t={t}
              />
            </div>

            <div className="flex w-full shrink-0 items-center gap-3 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
              <AppButton variant="primary-outline" size="lg" className="flex-1 justify-center" onClick={() => setCancelSheetOpen(false)}>
                {t("serviceRequests.cancelModal.mobileCancel")}
              </AppButton>
              <AppButton
                variant="primary"
                size="lg"
                className="flex-1 justify-center"
                disabled={!canSubmitCancel || cancelling}
                onClick={() =>
                  selectedCancelReasonId !== null &&
                  submitCancel({
                    cancel_reason_id: selectedCancelReasonId,
                    additional_info: cancelReasonNeedsInfo ? cancelAdditionalInfo.trim() : "",
                  })
                }
              >
                {t("serviceRequests.cancelModal.mobileConfirm")}
              </AppButton>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog
          open={cancelSheetOpen}
          onOpenChange={(next) => {
            if (!next) {
              setSelectedCancelReasonId(null);
              setCancelAdditionalInfo("");
            }
            setCancelSheetOpen(next);
          }}
        >
          <DialogContent
            showCloseButton={false}
            className="flex w-[520px] max-w-[calc(100%-2rem)] flex-col items-start gap-0 overflow-hidden rounded-2xl bg-bg-primary p-0 ring-1 ring-border-default sm:max-w-[520px]"
          >
            <div className="flex w-full items-start gap-8 border-b border-border-default px-6 py-4">
              <div className="flex flex-1 flex-col items-start gap-0.5">
                <DialogTitle className="text-xl font-medium text-text-primary">
                  {t("serviceRequests.cancelModal.title")}
                </DialogTitle>
                <span className="text-sm text-text-secondary">{t("serviceRequests.cancelModal.description")}</span>
              </div>
              <button
                type="button"
                aria-label={t("checkoutPage.dateTime.modal.closeAriaLabel")}
                onClick={() => setCancelSheetOpen(false)}
                className="flex items-center justify-center rounded-lg border border-button-secondary-outline-border bg-bg-secondary p-2 text-button-secondary-outline-text hover:opacity-90"
              >
                <CloseIcon className="size-3.5" />
              </button>
            </div>

            <div className="flex max-h-[400px] w-full flex-col items-center gap-4 overflow-y-auto p-6">
              <CancelReasonList
                reasons={cancelReasons}
                selectedReasonId={selectedCancelReasonId}
                onSelect={setSelectedCancelReasonId}
                needsAdditionalInfo={cancelReasonNeedsInfo}
                additionalInfo={cancelAdditionalInfo}
                onAdditionalInfoChange={setCancelAdditionalInfo}
                t={t}
              />
            </div>

            <div className="flex w-full items-center gap-4 border-t border-border-default px-6 py-4">
              <AppButton
                variant="primary"
                size="md"
                className="flex-1"
                disabled={!canSubmitCancel || cancelling}
                onClick={() =>
                  selectedCancelReasonId !== null &&
                  submitCancel({
                    cancel_reason_id: selectedCancelReasonId,
                    additional_info: cancelReasonNeedsInfo ? cancelAdditionalInfo.trim() : "",
                  })
                }
              >
                {t("serviceRequests.cancelModal.confirm")}
              </AppButton>
              <AppButton variant="secondary-outline" size="md" className="flex-1" onClick={() => setCancelSheetOpen(false)}>
                {t("serviceRequests.cancelModal.dismiss")}
              </AppButton>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <GalleryLightbox
        images={attachmentImages}
        title={detail.title}
        open={lightboxOpen}
        activeIndex={activeImageIndex}
        onOpenChange={setLightboxOpen}
        onActiveIndexChange={setActiveImageIndex}
      />
    </>
  );
}

function CancelReasonList({
  variant = "card",
  reasons,
  selectedReasonId,
  onSelect,
  needsAdditionalInfo,
  additionalInfo,
  onAdditionalInfoChange,
  t,
}: {
  variant?: "card" | "radio";
  reasons: CancelReason[];
  selectedReasonId: number | null;
  onSelect: (id: number) => void;
  needsAdditionalInfo: boolean;
  additionalInfo: string;
  onAdditionalInfoChange: (value: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-3">
      {reasons.map((reason) => {
        const active = selectedReasonId === reason.id;
        const label = reason.translated_reason ?? reason.reason;
        return (
          <button
            key={reason.id}
            type="button"
            onClick={() => onSelect(reason.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl border p-3 text-left",
              variant === "card" && "flex-col items-start gap-4 rounded-lg p-4",
              active && "border-border-brand",
              !active && "border-border-default",
              variant === "card" && (active ? "bg-bg-brand-subtle text-text-brand" : "bg-bg-primary text-text-primary")
            )}
          >
            {variant === "radio" && (
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  active ? "border-border-brand bg-bg-brand" : "border-border-default"
                )}
              >
                {active && <span className="size-2 rounded-full bg-bg-primary" />}
              </span>
            )}
            <span
              className={cn(
                variant === "card" ? "text-base" : "text-sm",
                variant === "radio" && (active ? "text-text-primary" : "text-text-secondary")
              )}
            >
              {label}
            </span>
          </button>
        );
      })}

      {selectedReasonId !== null && needsAdditionalInfo && (
        <div className="flex w-full flex-col items-start gap-2">
          <label className="text-sm text-form-field-label">
            {t("serviceRequests.cancelModal.additionalInfoLabel")}
          </label>
          <textarea
            value={additionalInfo}
            onChange={(event) => onAdditionalInfoChange(event.target.value)}
            placeholder={t("serviceRequests.cancelModal.additionalInfoPlaceholder")}
            maxLength={500}
            className="min-h-[100px] w-full resize-none rounded-sm border border-form-field-border px-4 py-2 text-base text-text-primary outline-none placeholder:text-form-field-placeholder"
          />
        </div>
      )}
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
  full,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", full ? "w-full" : "flex-1")}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-border-default bg-bg-secondary p-2">
        <Icon className="size-5 text-icon-primary" />
      </span>
      <div className="flex flex-1 flex-col items-start gap-1">
        <span className="text-base text-text-primary opacity-80">{label}</span>
        <span className="text-base font-medium text-text-primary">{value}</span>
      </div>
    </div>
  );
}
