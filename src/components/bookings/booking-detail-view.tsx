"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { format, parse, parseISO } from "date-fns";
import { Calendar, CreditCard, FileText, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Link } from "@/components/ui/locale-link";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { buildChatHref } from "@/lib/chats/chat-types";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { GalleryLightbox } from "@/components/ui/gallery-lightbox";
import { DateTimeModal } from "@/components/checkout/date-time-modal";
import { MobileRescheduleScreen } from "@/components/bookings/mobile-reschedule-screen";
import { TrackOnMapModal } from "@/components/bookings/track-on-map-modal";
import { useIsMobile } from "@/lib/use-is-mobile";
import { CancelReasonModal } from "@/components/bookings/cancel-reason-modal";
import { ActionSuccessModal } from "@/components/bookings/action-success-modal";
import { MobileActionSuccessScreen } from "@/components/bookings/mobile-action-success-screen";
import { RateModal, type RateModalItem } from "@/components/bookings/rate-modal";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import {
  ArrowLeftIcon,
  ClockIcon,
  LocationPinIcon,
  ChatIcon,
  StarIcon,
  ServiceDistanceIcon,
  DoorstepIcon,
  ProviderStoreIcon,
  VerifiedBadgeIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@/components/icons/icons";
import { addRatingApi, downloadInvoicesApi, saveHandymanReviewApi, updateOrderStatusApi } from "@/api/apiRoutes";
import { useRebook } from "@/lib/checkout/use-rebook";
import { useAdditionalChargePayment } from "@/lib/checkout/use-additional-charge-payment";
import { AdditionalChargePaymentDrawer } from "@/components/bookings/additional-charge-payment-drawer";
import { StripePaymentModal } from "@/components/checkout/stripe-payment-modal";
import { usePaymentGatewaySettings } from "@/lib/checkout/use-payment-gateway-settings";
import {
  toBookingStatusKey,
  toBookingBillLines,
  type BookingDetailApi,
} from "@/lib/orders-catalog";
import { BillBreakdown } from "@/components/common/bill-breakdown";
import { formatDistance, formatRating, getBookingTimelineIconClass, type BookingStatusKey } from "@/lib/helpers";
import { usePriceFormatter } from "@/lib/show-price";
import { useDateTimeFormatter } from "@/lib/use-date-time-formatter";
import { applyMeridiemCase } from "@/lib/date-format-tokens";
import { useDistanceUnit } from "@/lib/use-distance-unit";
import { usePostBookingChatEnabled } from "@/lib/use-post-booking-chat-enabled";
import { useOtpSystemEnabled } from "@/lib/use-otp-system-enabled";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import { cn } from "@/lib/utils";
import stripeLogo from "@/assets/payment-methods/stripe.svg";
import razorpayLogo from "@/assets/payment-methods/razorpay.svg";
import xenditLogo from "@/assets/payment-methods/xendit.svg";
import cashfreeLogo from "@/assets/payment-methods/cashfree.svg";
import codLogo from "@/assets/payment-methods/cod.svg";
import paypalLogo from "@/assets/payment-methods/paypal.svg";
import paystackLogo from "@/assets/payment-methods/paystack.svg";
import flutterwaveLogo from "@/assets/payment-methods/flutterwave.svg";

const PAYMENT_METHOD_BADGE: Record<string, string> = {
  stripe: "bg-indigo-500/10",
  razorpay: "bg-blue-500/10",
  xendit: "bg-slate-500/10",
  cashfree: "bg-teal-500/10",
  paypal: "bg-sky-500/10",
  paystack: "bg-cyan-500/10",
  flutterwave: "bg-orange-500/10",
  cod: "bg-blue-600/10",
};

const PAYMENT_METHOD_LOGO: Record<string, typeof stripeLogo> = {
  stripe: stripeLogo,
  razorpay: razorpayLogo,
  xendit: xenditLogo,
  cashfree: cashfreeLogo,
  paypal: paypalLogo,
  paystack: paystackLogo,
  flutterwave: flutterwaveLogo,
  cod: codLogo,
};

const TIMELINE_LABEL_KEY: Record<BookingStatusKey, string> = {
  awaiting: "booked",
  confirmed: "confirmed",
  rescheduled: "rescheduled",
  started: "started",
  onTheWay: "onTheWay",
  arrived: "arrived",
  completed: "completed",
  bookingEnded: "bookingEnded",
  cancelled: "cancelled",
};

// "Handyman Arrived" assumes a named handyman is on the booking — no handyman
// assigned yet (provider hasn't staffed it), so the generic "Provider
// Arrived" applies instead. Every other timeline label is already
// handyman-agnostic wording.
function timelineLabelKey(statusKey: BookingStatusKey, hasHandyman: boolean): string {
  if (statusKey === "arrived" && !hasHandyman) return "arrivedGeneric";
  return TIMELINE_LABEL_KEY[statusKey];
}

// A booking that has already been rescheduled once reports an empty
// next_status_available from the API — it's not reschedulable again.
const EARLY_STATUSES: BookingStatusKey[] = ["awaiting", "confirmed"];

function ExpandableText({ text }: { text: string }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return;
    setOverflowing(element.scrollHeight > element.clientHeight + 1);
  }, [text]);

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <p
        ref={textRef}
        className={cn("w-full text-base text-text-primary", !expanded && "line-clamp-2")}
      >
        {text}
      </p>
      {!expanded && overflowing && (
        <AppButton variant="link" size="sm" onClick={() => setExpanded(true)}>
          {t("common.readMore")}
        </AppButton>
      )}
    </div>
  );
}

export function BookingDetailView({
  booking,
  onBookingUpdated,
}: {
  booking: BookingDetailApi;
  onBookingUpdated: () => void;
}) {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const formatPrice = usePriceFormatter();
  // Every amount on this page belongs to the same booking, fixed at the
  // country it was made in — apply that currency once instead of at each
  // of this page's ~20 showPrice call sites.
  const currencyOverride = booking.currency_symbol
    ? { symbol: booking.currency_symbol, decimalPlaces: booking.currency_decimal_places }
    : undefined;
  const showPrice = (amount: number | string | null | undefined) => formatPrice(amount, currencyOverride);
  const { formatBookingDate, formatBookingTime, timePattern, lowercaseMeridiem } = useDateTimeFormatter();
  const distanceUnit = useDistanceUnit();
  const postBookingChatEnabled = usePostBookingChatEnabled();
  const otpSystemEnabled = useOtpSystemEnabled();
  const isMobile = useIsMobile();
  const { rebook, isRebooking } = useRebook();

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [rateModalMode, setRateModalMode] = useState<"service" | "handyman" | null>(null);
  const [successModalMode, setSuccessModalMode] = useState<"reschedule" | "cancel" | null>(null);
  const [mobileTimelineOpen, setMobileTimelineOpen] = useState(false);
  const [mobileBillOpen, setMobileBillOpen] = useState(false);

  const statusKey = toBookingStatusKey(booking.status);
  const isCustomJob = Boolean(booking.custom_job_request);
  // Custom-job bookings are created from a provider's bid on a customer's job request, and
  // list under /requested-bookings, not the regular /general-bookings list — back/breadcrumb
  // must return there or it'd land the user on a list that never shows this booking.
  const bookingListHref = isCustomJob ? "/requested-bookings" : "/general-bookings";
  const isDoorstep = booking.booking_type === "at_doorstep";
  const isCancelled = statusKey === "cancelled";
  const isCompleted = statusKey === "completed";
  const showOtp = otpSystemEnabled && Boolean(booking.otp);
  const copyOtp = async () => {
    if (!booking.otp) return;
    try {
      await navigator.clipboard.writeText(booking.otp);
      toast.success(t("bookings.detail.otpCopied"));
    } catch (error) {
      console.error("Failed to copy OTP:", error);
    }
  };
  const showReschedule = statusKey !== null && EARLY_STATUSES.includes(statusKey);
  const showTrack =
    statusKey === "onTheWay" &&
    Number(booking.live_tracking_started) === 1 &&
    booking.booking_type === "at_doorstep";
  const showBookAgain = isCompleted && booking.is_reorder_allowed === "1";
  // is_cancelable from the API isn't reliable on its own — it can still read
  // 1 on an already-cancelled or completed booking, so gate on status too.
  const showCancel = booking.is_cancelable === 1 && !isCancelled && !isCompleted;
  // Both the system-wide setting and this specific provider's own toggle must
  // allow it - shown-but-disabled once the booking is terminal, not hidden.
  const chatAvailable = postBookingChatEnabled && booking.provider.post_booking_chat === 1;
  const chatDisabled = isCancelled || isCompleted;

  const paymentBadgeClass = PAYMENT_METHOD_BADGE[booking.payment_method] ?? "bg-bg-secondary";
  const paymentLogo = PAYMENT_METHOD_LOGO[booking.payment_method];
  // API sends either word codes ("success"/"pending"/"failed") or numeric
  // codes ("0"/"1"/"2") depending on gateway/flow - normalize both.
  const paymentStatusKey =
    booking.payment_status === "success" || booking.payment_status === "1"
      ? "success"
      : booking.payment_status === "failed" || booking.payment_status === "2"
        ? "failed"
        : "pending";
  const paymentStatusTone =
    paymentStatusKey === "success"
      ? { border: "border-alert-success-border", text: "text-alert-success-text" }
      : paymentStatusKey === "failed"
        ? { border: "border-alert-error-border", text: "text-alert-error-text" }
        : { border: "border-alert-warning-border", text: "text-alert-warning-text" };
  const paymentStatusLabel = t(`bookings.detail.paymentStatus.${paymentStatusKey}`);
  const additionalPaymentBadgeClass =
    PAYMENT_METHOD_BADGE[booking.additional_charges_payment_method] ?? "bg-bg-secondary";
  const additionalPaymentLogo = PAYMENT_METHOD_LOGO[booking.additional_charges_payment_method];
  const additionalPaymentStatusKey =
    booking.additional_charges_payment_status === "success" || booking.additional_charges_payment_status === "1"
      ? "success"
      : booking.additional_charges_payment_status === "failed" || booking.additional_charges_payment_status === "2"
        ? "failed"
        : "pending";
  const additionalPaymentStatusTone =
    additionalPaymentStatusKey === "success"
      ? { border: "border-alert-success-border", text: "text-alert-success-text" }
      : additionalPaymentStatusKey === "failed"
        ? { border: "border-alert-error-border", text: "text-alert-error-text" }
        : { border: "border-alert-warning-border", text: "text-alert-warning-text" };
  const additionalPaymentStatusLabel = t(`bookings.detail.paymentStatus.${additionalPaymentStatusKey}`);

  const hasProof = booking.work_started_proof.length > 0 || booking.work_completed_proof.length > 0;

  const totalAdditionalCharges = booking.additional_charges.reduce((sum, charge) => sum + Number(charge.charge), 0);

  // One row per charged element (Services, Visiting Charges, each fee),
  // already including that element's own tax — see toBookingBillLines.
  const promoTaxReduction = Number(booking.promo_tax_reduction) || 0;
  const billLines = toBookingBillLines(booking);
  // There's no per-charge payment status — additional_charges_payment_status
  // covers the whole set, so the pending total is all-or-nothing.
  const additionalChargesPaid =
    booking.additional_charges_payment_status === "success" || booking.additional_charges_payment_status === "1";
  const pendingAdditionalTotal = additionalChargesPaid ? 0 : totalAdditionalCharges;
  const showPayAdditional = statusKey === "bookingEnded" && pendingAdditionalTotal > 0;
  const [additionalChargeDrawerOpen, setAdditionalChargeDrawerOpen] = useState(false);
  const gatewaySettings = usePaymentGatewaySettings();
  const {
    pay: payAdditionalCharge,
    isProcessing: isPayingAdditionalCharge,
    stripeModal: additionalChargeStripeModal,
    closeStripeModal: closeAdditionalChargeStripeModal,
    handleStripeModalSuccess: handleAdditionalChargeStripeSuccess,
    handleStripeModalFailure: handleAdditionalChargeStripeFailure,
  } = useAdditionalChargePayment({
    orderId: booking.id,
    amount: pendingAdditionalTotal,
  });
  const handlePayAdditional = () => setAdditionalChargeDrawerOpen(true);

  const latestTimelineEntry = booking.service_status_timeline[booking.service_status_timeline.length - 1];
  const latestTimelineKey = latestTimelineEntry ? toBookingStatusKey(latestTimelineEntry.status) : null;
  const latestTimelineIconClass = latestTimelineKey
    ? getBookingTimelineIconClass(latestTimelineKey)
    : { bg: "bg-bg-secondary", icon: "text-icon-inverse" };

  const currentBookingDate = (() => {
    const parsed = parse(booking.date, "yyyy-MM-dd", new Date());
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  })();
  const currentBookingTime = booking.start_time ? formatBookingTime(booking.start_time, booking.date) : null;

  const handleCancel = () => setCancelOpen(true);
  const handleTrack = () => {
    if (isMobile) {
      toast.info(t("bookings.detail.trackUnavailable"));
      return;
    }
    setTrackModalOpen(true);
  };
  const handleBookAgain = () => rebook(booking.id);

  const handleRescheduleConfirm = async (date: Date, time: string) => {
    try {
      const response = await updateOrderStatusApi({
        order_id: booking.id,
        status: "rescheduled",
        date: format(date, "yyyy-MM-dd"),
        time: format(parse(time, "hh:mm a", new Date()), "HH:mm"),
      });
      if (response?.error) throw new Error(response?.message);
      onBookingUpdated();
      setSuccessModalMode("reschedule");
      return true;
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("bookings.detail.rescheduleFailed"));
      return false;
    }
  };

  const serviceRateItems: RateModalItem[] = booking.services.map((service) => ({
    id: service.service_id,
    image: service.image,
    title: service.title,
    meta: `${t("bookings.detail.rateModal.qty", { count: service.quantity })} • ${showPrice(service.price)}`,
    initialRating: service.rating ?? 0,
    initialReview: service.review ?? "",
    initialImages: service.review_images ?? [],
  }));

  const handymanRateItems: RateModalItem[] = booking.assigned_handymen.map((handyman) => ({
    id: handyman.id,
    image: handyman.profile_image,
    title: handyman.username,
    badge: handyman.is_lead === 1 ? t("bookings.detail.leadTag") : undefined,
    initialRating: handyman.rating ?? 0,
    initialReview: handyman.review ?? "",
    initialImages: handyman.review_images ?? [],
  }));

  const handleSubmitRating = async (
    itemId: number,
    payload: { rating: number; review: string; images: File[]; imagesToDelete: string[] }
  ) => {
    if (rateModalMode === "service") {
      const response = await addRatingApi({
        order_id: booking.id,
        ...(isCustomJob ? { custom_job_request_id: booking.custom_job_request?.id } : { service_id: itemId }),
        rating: payload.rating,
        comment: payload.review,
        images: payload.images,
        images_to_delete: payload.imagesToDelete,
      });
      if (response?.error) throw new Error(response?.message);
    } else if (rateModalMode === "handyman") {
      const handyman = booking.assigned_handymen.find((item) => item.id === itemId);
      const response = await saveHandymanReviewApi({
        id: handyman?.rating_id ?? undefined,
        order_id: booking.id,
        handyman_id: itemId,
        rating: payload.rating,
        review: payload.review,
        images: payload.images,
        images_to_delete: payload.imagesToDelete,
      });
      if (response?.error) throw new Error(response?.message);
    }
  };

  const handleConfirmCancel = async (payload: { cancel_reason_id: number; additional_info: string }) => {
    setCancelling(true);
    try {
      const response = await updateOrderStatusApi({
        order_id: booking.id,
        status: "cancelled",
        cancel_reason_id: payload.cancel_reason_id,
        additional_info: payload.additional_info,
      });
      if (response?.error) throw new Error(response?.message);
      setCancelOpen(false);
      onBookingUpdated();
      setSuccessModalMode("cancel");
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("bookings.detail.cancelFailed"));
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (downloadingInvoice) return;
    setDownloadingInvoice(true);
    try {
      const blob = await downloadInvoicesApi({ order_id: booking.id });
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${booking.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("bookings.detail.downloadInvoiceFailed"));
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <>
      <PageBreadcrumb
        title={t("bookings.detail.title")}
        items={[
          { label: t("bookings.title"), href: bookingListHref },
          { label: t("bookings.detail.title") },
        ]}
        backHref={bookingListHref}
      />
      <div className="hidden w-full xl:container xl:flex xl:flex-row xl:items-start xl:justify-center xl:gap-6 xl:py-16">
        <AccountSidebar />
        <div className="flex w-full flex-1 flex-col items-start rounded-xl border border-border-default bg-bg-primary">
          <div className="flex w-full items-center justify-center gap-4 border-b border-border-default p-6">
            <button
              type="button"
              onClick={() => router.push(localizePath(bookingListHref, lang, defaultLocale))}
              className="flex items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-secondary p-2"
              aria-label={t("bookings.detail.back")}
            >
              <ArrowLeftIcon className="size-6 text-button-secondary-outline-text rtl:rotate-180" />
            </button>
            <span className="flex-1 text-xl font-medium text-text-primary">{t("bookings.detail.title")}</span>
          </div>

          <div className="flex w-full items-start gap-6 p-6">
            <div className="flex flex-1 flex-col items-start gap-6">
              {isCancelled && (
                <div className="flex w-full items-center gap-4 rounded-lg border border-border-error/20 bg-alert-error-bg p-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-bg-error p-3">
                    <TriangleAlert className="size-6 text-icon-inverse" />
                  </span>
                  <div className="flex flex-1 flex-col items-start gap-0.5">
                    <span className="text-base text-text-primary">
                      {booking.cancellation?.reason
                        ? t("bookings.detail.cancellationReasonTitle")
                        : t("bookings.detail.serviceStatusTitle")}
                    </span>
                    <span className="text-lg font-medium text-text-error">
                      {booking.cancellation?.reason ??
                        (paymentStatusKey === "failed"
                          ? t("bookings.detail.paymentFailedMessage")
                          : t("bookings.detail.cancelledMessage"))}
                    </span>
                  </div>
                </div>
              )}

              {/* Booking Details */}
              <div className="flex w-full flex-col items-start rounded-lg border border-border-default bg-bg-primary">
                <div className="flex w-full items-center gap-4 rounded-t-lg border-b border-border-default bg-bg-secondary p-4">
                  <span className="flex-1 text-base text-text-primary opacity-90">
                    {t("bookings.detail.bookingDetails")}
                  </span>
                  {showOtp && (
                    <button
                      type="button"
                      onClick={copyOtp}
                      className="flex cursor-pointer items-center rounded-3xl border border-border-default px-3 py-2 text-sm text-text-primary transition-colors duration-200 hover:bg-bg-secondary"
                    >
                      {t("bookings.detail.otp", { code: booking.otp })}
                    </button>
                  )}
                </div>
                <div className="flex w-full flex-col items-start gap-8 p-4">
                  <div className="flex w-full flex-col items-start gap-4">
                    <div className="flex w-full items-center gap-3">
                      <span className="flex-1 text-base text-text-primary">
                        {t("bookings.card.invoiceNo", { number: booking.id })}
                      </span>
                      <BookingStatusBadge statusKey={statusKey} fallbackLabel={booking.status} />
                    </div>

                    {isCustomJob && (
                      <>
                        <div className="dashed-divider" />
                        <div className="flex w-full items-center gap-4">
                          <div className="flex flex-1 flex-col items-start gap-1">
                            <span className="text-lg font-medium text-text-primary">
                              {booking.services[0]?.title}
                            </span>
                            <span className="text-base text-text-primary opacity-80">
                              {t("bookings.detail.categoryLabel", {
                                category: booking.services[0]?.category_name ?? "",
                              })}
                            </span>
                          </div>
                          <span className="text-xl font-medium text-text-primary">
                            {showPrice(booking.final_total)}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="flex w-full flex-col items-start gap-4">
                      <div className="flex w-full items-start gap-4">
                        <div className="flex flex-1 items-center gap-3">
                          <span className="flex size-11 items-center justify-center rounded-sm border border-border-default bg-bg-secondary p-2">
                            <Calendar className="size-5 text-icon-primary" />
                          </span>
                          <div className="flex flex-1 flex-col items-start gap-1">
                            <span className="text-sm text-text-primary opacity-80">{t("bookings.detail.date")}</span>
                            <span className="text-sm text-text-primary">{formatBookingDate(booking.date)}</span>
                          </div>
                        </div>
                        <div className="flex flex-1 items-center gap-3">
                          <span className="flex size-11 items-center justify-center rounded-sm border border-border-default bg-bg-secondary p-2">
                            <ClockIcon className="size-5 text-icon-primary" />
                          </span>
                          <div className="flex flex-1 flex-col items-start gap-1">
                            <span className="text-sm text-text-primary opacity-80">{t("bookings.detail.time")}</span>
                            <span className="text-sm text-text-primary">
                              {formatBookingTime(booking.start_time, booking.date)} - {formatBookingTime(booking.end_time, booking.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Phone number removed from here — team decided not to expose the
                          provider's contact number to customers. This divider is skipped
                          for a custom job with no address, since there'd be nothing left
                          to separate the date/time row from. */}
                      {(!isCustomJob || booking.address) && <div className="dashed-divider" />}

                      {!isCustomJob && (
                        <div className="flex w-full items-start gap-4">
                          <div className="flex flex-1 items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-sm border border-border-default bg-bg-secondary p-2">
                              {isDoorstep ? (
                                <DoorstepIcon className="size-5 text-icon-primary" />
                              ) : (
                                <ProviderStoreIcon className="size-5 text-icon-primary" />
                              )}
                            </span>
                            <div className="flex flex-1 flex-col items-start gap-1">
                              <span className="text-sm text-text-primary opacity-80">
                                {t("bookings.detail.serviceType")}
                              </span>
                              <span className="text-sm text-text-primary">
                                {isDoorstep ? t("bookings.detail.atDoorstep") : t("bookings.detail.atStore")}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {booking.address && (
                        <>
                          <div className="dashed-divider" />
                          <div className="flex w-full items-start gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-border-default bg-bg-secondary p-2">
                              <LocationPinIcon className="size-5 text-icon-primary" />
                            </span>
                            <div className="flex flex-1 flex-col items-start gap-1">
                              <span className="text-sm text-text-primary opacity-80">
                                {isDoorstep
                                  ? t("bookings.detail.address")
                                  : t("bookings.detail.providerAddress")}
                              </span>
                              <span className="text-sm text-text-primary">{booking.address}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {(showReschedule || showTrack || showBookAgain || showCancel) && (
                    <div className="flex w-full items-center justify-end gap-4">
                      {showTrack && (
                        <AppButton variant="primary" size="md" onClick={handleTrack}>
                          {t("bookings.detail.track")}
                        </AppButton>
                      )}
                      {showBookAgain && (
                        <AppButton
                          variant="primary"
                          size="md"
                          disabled={isRebooking(booking.id)}
                          onClick={handleBookAgain}
                        >
                          {t("bookings.detail.bookAgain")}
                        </AppButton>
                      )}
                      {showReschedule && (
                        <AppButton variant="primary" size="md" onClick={() => setRescheduleOpen(true)}>
                          {t("bookings.detail.reschedule")}
                        </AppButton>
                      )}
                      {showCancel && (
                        <AppButton variant="secondary-outline" size="md" onClick={handleCancel}>
                          {t("bookings.detail.cancelBooking")}
                        </AppButton>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isCustomJob && booking.custom_job_request?.customer_job_description && (
                <div className="flex w-full flex-col items-start rounded-lg border border-border-default bg-bg-primary">
                  <div className="flex w-full items-center gap-4 rounded-t-lg border-b border-border-default bg-bg-secondary p-4">
                    <span className="flex-1 text-base text-text-primary opacity-90">
                      {t("bookings.detail.providersMessage")}
                    </span>
                  </div>
                  <div className="flex w-full flex-col items-start gap-2 p-4">
                    <ExpandableText text={booking.custom_job_request.customer_job_description} />
                  </div>
                </div>
              )}

              {/* Services */}
              {!isCustomJob && (
              <div className="flex w-full flex-col items-start overflow-hidden rounded-lg border border-border-default bg-bg-primary">
                <div className="flex w-full items-center gap-6 border-b border-border-default bg-bg-secondary p-4">
                  <span className="flex-1 text-base text-text-primary opacity-90">
                    {t("bookings.detail.servicesCount", { count: booking.total_services_count })}
                  </span>
                  <span className="w-20 shrink-0 text-base text-text-primary opacity-90">
                    {t("bookings.detail.quantity")}
                  </span>
                  <span className="w-20 shrink-0 text-base text-text-primary opacity-90">
                    {t("bookings.detail.price")}
                  </span>
                </div>
                {booking.services.map((service, index) => (
                  <div
                    key={service.service_id}
                    className={cn(
                      "flex w-full items-center gap-6 p-4",
                      index < booking.services.length - 1 && "border-b border-border-default"
                    )}
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <AppImage
                        src={service.image}
                        alt={service.title}
                        className="size-10 shrink-0 rounded-sm object-cover"
                      />
                      <div className="flex flex-col items-start gap-1">
                        <span className="line-clamp-1 text-sm font-medium text-text-primary">{service.title}</span>
                        <span className="line-clamp-1 text-xs text-text-primary opacity-80">
                          {t("bookings.detail.categoryLabel", { category: service.category_name })}
                        </span>
                      </div>
                    </div>
                    <span className="w-20 shrink-0 text-sm text-text-primary">{service.quantity}</span>
                    <span className="w-20 shrink-0 text-sm text-text-primary">{showPrice(service.price)}</span>
                  </div>
                ))}
              </div>
              )}

              {!isCustomJob && booking.remarks && (
                <div className="flex w-full flex-col items-start rounded-lg border border-border-default bg-bg-primary">
                  <div className="flex w-full items-center gap-4 rounded-t-lg border-b border-border-default bg-bg-secondary p-4">
                    <span className="flex-1 text-base text-text-primary opacity-90">{t("bookings.detail.note")}</span>
                  </div>
                  <div className="flex w-full flex-col items-start gap-2 p-4">
                    <ExpandableText text={booking.remarks} />
                  </div>
                </div>
              )}

              {/* Service Team */}
              <div className="flex w-full flex-col items-start overflow-hidden rounded-lg border border-border-default bg-bg-primary">
                <div className="flex w-full items-center gap-2 border-b border-border-default bg-bg-secondary p-4">
                  <span className="text-base text-text-primary opacity-90">{t("bookings.detail.serviceTeam")}</span>
                </div>
                <div className="flex w-full flex-col items-start gap-4 p-4">
                  <div className="flex w-full items-center gap-3">
                    {booking.provider.slug ? (
                      <Link
                        href={`/provider-details/${booking.provider.slug}`}
                        className="flex flex-1 items-center gap-3"
                      >
                        <AppImage
                          src={booking.provider.profile_image}
                          alt={booking.provider.company_name}
                          className="size-12 shrink-0 rounded-xl object-cover"
                        />
                        <div className="flex flex-1 flex-col items-start gap-1">
                          <span className="flex items-center gap-1 text-base font-medium text-text-primary">
                            {booking.provider.company_name}
                            {booking.provider.is_verified === 1 && (
                              <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            {Number(booking.provider.average_rating) > 0 && (
                              <>
                                <span className="flex items-center gap-1">
                                  <StarIcon className="size-4 text-icon-warning" />
                                  <span className="text-sm text-text-primary">{formatRating(booking.provider.average_rating)}</span>
                                </span>
                                <span className="size-1 rounded-full bg-bg-inverse opacity-40" />
                              </>
                            )}
                            <span className="flex items-center gap-1">
                              <ServiceDistanceIcon className="size-4 text-icon-secondary" />
                              <span className="text-sm text-text-secondary">
                                {formatDistance(booking.provider.distance, distanceUnit)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <>
                        <AppImage
                          src={booking.provider.profile_image}
                          alt={booking.provider.company_name}
                          className="size-12 shrink-0 rounded-xl object-cover"
                        />
                        <div className="flex flex-1 flex-col items-start gap-1">
                          <span className="flex items-center gap-1 text-base font-medium text-text-primary">
                            {booking.provider.company_name}
                            {booking.provider.is_verified === 1 && (
                              <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            {Number(booking.provider.average_rating) > 0 && (
                              <>
                                <span className="flex items-center gap-1">
                                  <StarIcon className="size-4 text-icon-warning" />
                                  <span className="text-sm text-text-primary">{formatRating(booking.provider.average_rating)}</span>
                                </span>
                                <span className="size-1 rounded-full bg-bg-inverse opacity-40" />
                              </>
                            )}
                            <span className="flex items-center gap-1">
                              <ServiceDistanceIcon className="size-4 text-icon-secondary" />
                              <span className="text-sm text-text-secondary">
                                {formatDistance(booking.provider.distance, distanceUnit)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {chatAvailable && (
                      <AppButton
                        asChild={!chatDisabled}
                        variant="secondary"
                        size="md"
                        leftIcon={ChatIcon}
                        disabled={chatDisabled}
                      >
                        {chatDisabled ? (
                          t("common.chat")
                        ) : (
                          <Link
                            href={buildChatHref(
                              {
                                partnerId: booking.provider.provider_id,
                                bookingId: booking.id,
                                name: booking.provider.company_name,
                                image: booking.provider.profile_image,
                                status: booking.status,
                                title: booking.services[0]?.title,
                                extraCount: Math.max(0, booking.total_services_count - 1),
                                date: booking.date,
                                time: booking.start_time,
                              },
                              lang,
                              defaultLocale
                            )}
                          >
                            {t("common.chat")}
                          </Link>
                        )}
                      </AppButton>
                    )}
                  </div>

                  {booking.assigned_handymen.length > 0 && (
                    <>
                      <div className="dashed-divider" />
                      <div className="flex w-full flex-col items-start gap-3">
                        <span className="text-sm text-text-primary opacity-90">
                          {t("bookings.detail.assignedHandyman")}
                        </span>
                        {booking.assigned_handymen.map((handyman) => (
                          <div key={handyman.id} className="flex w-full items-center gap-3">
                            <AppImage
                              src={handyman.profile_image}
                              alt={handyman.username}
                              className="size-9 shrink-0 rounded-xl object-cover"
                            />
                            <div className="flex flex-1 items-center gap-1">
                              <span className="text-sm font-medium text-text-primary">{handyman.username}</span>
                              {handyman.is_lead === 1 && (
                                <span className="rounded-lg bg-bg-brand-subtle px-2 py-1 text-sm text-text-brand">
                                  {t("bookings.detail.leadTag")}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {isCompleted && booking.total_handymen_count > 0 && (
                    <div className="flex w-full items-center gap-3 rounded-lg border border-border-default bg-bg-primary p-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-bg-warning-subtle p-2">
                        <StarIcon className="size-5 text-icon-warning" />
                      </span>
                      <div className="flex flex-1 flex-col items-start gap-1">
                        <span className="text-sm text-text-primary">
                          {t("bookings.detail.handymenRated", {
                            rated: booking.rated_handymen_count,
                            total: booking.total_handymen_count,
                          })}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {t("bookings.detail.rateTeamDescription")}
                        </span>
                      </div>
                      <AppButton variant="primary" size="sm" onClick={() => setRateModalMode("handyman")}>
                        {booking.rated_handymen_count > 0 ? t("bookings.detail.edit") : t("bookings.detail.rate")}
                      </AppButton>
                    </div>
                  )}
                </div>
              </div>

              {isCustomJob && booking.custom_job_request?.provider_bid_note && (
                <div className="flex w-full flex-col items-start rounded-lg border border-border-default bg-bg-primary">
                  <div className="flex w-full items-center gap-4 rounded-t-lg border-b border-border-default bg-bg-secondary p-4">
                    <span className="flex-1 text-base text-text-primary opacity-90">
                      {t("bookings.detail.noteForProvider")}
                    </span>
                  </div>
                  <div className="flex w-full flex-col items-start gap-2 p-4">
                    <ExpandableText text={booking.custom_job_request.provider_bid_note} />
                  </div>
                </div>
              )}

              {hasProof && (
                <div className="flex w-full flex-col items-start rounded-lg border border-border-default bg-bg-primary">
                  <div className="flex w-full items-center gap-2 border-b border-border-default bg-bg-secondary p-4">
                    <span className="flex-1 text-base text-text-primary opacity-90">
                      {t("bookings.detail.workProof")}
                    </span>
                  </div>
                  <div className="flex w-full flex-col items-start gap-4 p-4">
                    {booking.work_started_proof.length > 0 && (
                      <div className="flex w-full flex-col items-start gap-3">
                        <span className="text-sm text-text-primary opacity-90">
                          {t("bookings.detail.startImages")}
                        </span>
                        <div className="flex items-start gap-3">
                          {booking.work_started_proof.map((image, index) => (
                            <AppButton
                              key={image}
                              variant="link"
                              className="size-14 shrink-0 p-0"
                              onClick={() => {
                                setLightboxImages(booking.work_started_proof);
                                setLightboxIndex(index);
                              }}
                            >
                              <AppImage
                                src={image}
                                alt={`${t("bookings.detail.startImages")} ${index + 1}`}
                                className="size-14 rounded-sm object-cover"
                              />
                            </AppButton>
                          ))}
                        </div>
                      </div>
                    )}
                    {booking.work_started_proof.length > 0 && booking.work_completed_proof.length > 0 && (
                      <div className="dashed-divider" />
                    )}
                    {booking.work_completed_proof.length > 0 && (
                      <div className="flex w-full flex-col items-start gap-3">
                        <span className="text-sm text-text-primary opacity-90">{t("bookings.detail.endImages")}</span>
                        <div className="flex items-start gap-3">
                          {booking.work_completed_proof.map((image, index) => (
                            <AppButton
                              key={image}
                              variant="link"
                              className="size-14 shrink-0 p-0"
                              onClick={() => {
                                setLightboxImages(booking.work_completed_proof);
                                setLightboxIndex(index);
                              }}
                            >
                              <AppImage
                                src={image}
                                alt={`${t("bookings.detail.endImages")} ${index + 1}`}
                                className="size-14 rounded-sm object-cover"
                              />
                            </AppButton>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="hidden w-96 shrink-0 flex-col items-start gap-6 xl:flex">
              {/* Price Summary */}
              <div className="flex w-full flex-col items-start overflow-hidden rounded-lg border border-border-default bg-bg-primary">
                <div className="flex w-full items-center gap-2 border-b border-border-default bg-bg-secondary p-4">
                  <span className="text-base text-text-primary opacity-90">{t("bookings.detail.priceSummary")}</span>
                </div>
                <div className="flex w-full flex-col items-start gap-4 p-4">
                  <div className="flex w-full flex-col items-start gap-4">
                    <BillBreakdown lines={billLines} currencyOverride={currencyOverride} defaultOpen />
                    {booking.promo_discount > 0 && (
                      <div className="flex w-full items-start gap-6">
                        <span className="text-sm text-text-primary">
                          {t("bookings.detail.promocode", { code: booking.promo_code })}
                        </span>
                        <span className="flex-1 text-end text-sm text-text-primary">
                          -{showPrice(booking.promo_discount)}
                        </span>
                      </div>
                    )}
                    {/* The promo also lowers the tax — without this line the
                        bill doesn't add up to the total that was charged. */}
                    {promoTaxReduction > 0 && (
                      <div className="flex w-full items-start gap-6">
                        <span className="flex-1 text-sm text-text-primary">
                          {t("bookings.detail.promoTaxReduction")}
                        </span>
                        <span className="flex-1 text-end text-sm text-text-primary">
                          -{showPrice(promoTaxReduction)}
                        </span>
                      </div>
                    )}
                    {booking.additional_charges.length > 0 && (
                      <div className="flex w-full items-start gap-6">
                        <span className="flex-1 text-sm text-text-primary">
                          {t("bookings.detail.additionalCharges")}
                        </span>
                        <span className="flex-1 text-end text-sm text-text-primary">
                          +{showPrice(totalAdditionalCharges)}
                        </span>
                      </div>
                    )}
                    <div className="dashed-divider" />
                    <div className="flex w-full items-start gap-6">
                      <span className="flex-1 text-sm font-medium text-text-primary">
                        {t("bookings.detail.totalPaid")}
                      </span>
                      <span className="flex-1 text-end text-sm font-medium text-text-primary">
                        {showPrice(booking.final_total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full items-center gap-3 rounded-lg border border-border-default bg-bg-secondary p-3">
                    <div className="flex flex-1 items-center gap-3">
                      <span className={cn("flex items-center justify-center rounded-lg p-2.5", paymentBadgeClass)}>
                        {paymentLogo ? (
                          <AppImage src={paymentLogo} alt={booking.payment_method} className="size-5" />
                        ) : (
                          <CreditCard className="size-5" />
                        )}
                      </span>
                      <div className="flex flex-1 flex-col items-start gap-1">
                        <span className="text-xs text-text-secondary">{t("bookings.detail.paymentWith")}</span>
                        <span className="text-base font-medium capitalize text-text-primary">
                          {booking.payment_method}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-3xl border bg-bg-primary px-3 py-1 text-sm capitalize",
                        paymentStatusTone.border,
                        paymentStatusTone.text
                      )}
                    >
                      {paymentStatusLabel}
                    </span>
                  </div>

                  {Boolean(booking.additional_charges_payment_method) && (
                    <div className="flex w-full items-center gap-3 rounded-lg border border-border-default bg-bg-secondary p-3">
                      <div className="flex flex-1 items-center gap-3">
                        <span
                          className={cn("flex items-center justify-center rounded-lg p-2.5", additionalPaymentBadgeClass)}
                        >
                          {additionalPaymentLogo ? (
                            <AppImage
                              src={additionalPaymentLogo}
                              alt={booking.additional_charges_payment_method}
                              className="size-5"
                            />
                          ) : (
                            <CreditCard className="size-5" />
                          )}
                        </span>
                        <div className="flex flex-1 flex-col items-start gap-1">
                          <span className="text-xs text-text-secondary">
                            {t("bookings.detail.additionalChargePaidWith")}
                          </span>
                          <span className="text-base font-medium capitalize text-text-primary">
                            {booking.additional_charges_payment_method}
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-3xl border bg-bg-primary px-3 py-1 text-sm capitalize",
                          additionalPaymentStatusTone.border,
                          additionalPaymentStatusTone.text
                        )}
                      >
                        {additionalPaymentStatusLabel}
                      </span>
                    </div>
                  )}

                  {showPayAdditional && (
                    <AppButton
                      variant="primary"
                      size="md"
                      className="w-full justify-center"
                      disabled={isPayingAdditionalCharge}
                      onClick={handlePayAdditional}
                    >
                      {t("bookings.detail.payAdditional", { amount: showPrice(pendingAdditionalTotal) })}
                    </AppButton>
                  )}

                  {statusKey === "completed" && (
                    <AppButton
                      variant="secondary-outline"
                      size="md"
                      className="w-full"
                      disabled={downloadingInvoice}
                      onClick={handleDownloadInvoice}
                    >
                      {t("bookings.detail.downloadInvoice")}
                    </AppButton>
                  )}
                </div>
              </div>

              {/* Service Timeline */}
              {booking.service_status_timeline.length > 0 && (
                <div className="flex w-full flex-col items-start overflow-hidden rounded-lg border border-border-default bg-bg-primary">
                  <div className="flex w-full items-center gap-2 border-b border-border-default bg-bg-secondary p-4">
                    <span className="text-base text-text-primary opacity-90">
                      {t("bookings.detail.serviceTimeline")}
                    </span>
                  </div>
                  <div className="flex w-full flex-col items-start gap-4 p-4">
                    {booking.service_status_timeline.map((entry, index) => {
                      const entryKey = toBookingStatusKey(entry.status);
                      const { bg, icon } = entryKey
                        ? getBookingTimelineIconClass(entryKey)
                        : { bg: "bg-bg-secondary", icon: "text-icon-inverse" };
                      const isLast = index === booking.service_status_timeline.length - 1;
                      const timestamp = parseISO(entry.timestamp);
                      return (
                        <div key={`${entry.status}-${entry.timestamp}`} className="flex w-full items-start gap-3">
                          <div className="flex flex-col items-center gap-2">
                            <span className={cn("flex size-11 items-center justify-center rounded-xl p-2", bg)}>
                              <CheckCircleIcon className={cn("size-5", icon)} />
                            </span>
                            {!isLast && (
                              <div className="flex-1 border-l border-dashed border-border-strong" />
                            )}
                          </div>
                          <div className="flex flex-1 flex-col items-start gap-1 pb-1">
                            <span className="text-sm font-medium text-text-primary">
                              {entryKey
                                ? t(
                                    `bookings.timeline.${timelineLabelKey(entryKey, booking.assigned_handymen.length > 0)}`
                                  )
                                : entry.status}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-text-secondary">
                              <span>{format(timestamp, "d MMM,")}</span>
                              <span>{applyMeridiemCase(format(timestamp, timePattern), lowercaseMeridiem)}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isCompleted && booking.total_services_count > 0 && (
                <div className="flex w-full items-center gap-3 rounded-lg border border-border-default bg-bg-primary p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-bg-warning-subtle p-2">
                    <StarIcon className="size-5 text-icon-warning" />
                  </span>
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <span className="text-sm text-text-primary">
                      {t("bookings.detail.servicesRated", {
                        rated: booking.rated_services_count,
                        total: booking.total_services_count,
                      })}
                    </span>
                    <span className="text-xs text-text-secondary">{t("bookings.detail.rateServiceDescription")}</span>
                  </div>
                  <AppButton variant="primary" size="sm" onClick={() => setRateModalMode("service")}>
                    {booking.rated_services_count > 0 ? t("bookings.detail.edit") : t("bookings.detail.rate")}
                  </AppButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile — status-driven stacked cards. Desktop above stays untouched. */}
      <div className="flex w-full flex-col items-start gap-4 bg-bg-secondary px-4 py-6 pb-28 xl:hidden">
        <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-1 flex-col items-start gap-1">
              <span className="text-xs text-text-secondary">{t("bookings.card.invoiceLabel")}</span>
              <span className="text-xs font-medium text-text-primary">
                {t("bookings.card.invoiceNumber", { number: booking.id })}
              </span>
            </div>
            <BookingStatusBadge statusKey={statusKey} fallbackLabel={booking.status} />
          </div>

          <div className="dashed-divider" />

          {showOtp && (
            <button
              type="button"
              onClick={copyOtp}
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-bg-brand-subtle px-2 py-1"
            >
              <span className="text-xs text-text-primary">{t("bookings.detail.otpLabel")}</span>
              <span className="text-sm font-semibold text-text-primary">{booking.otp}</span>
            </button>
          )}

          {isCustomJob && (
            <>
              <div className="flex w-full flex-col items-start gap-1">
                <span className="text-sm font-semibold text-text-primary">{booking.services[0]?.title}</span>
                <span className="text-xs font-medium text-text-brand">{booking.services[0]?.category_name}</span>
              </div>
              <span className="text-base font-medium text-text-primary">{showPrice(booking.final_total)}</span>
              <div className="dashed-divider" />
            </>
          )}

          <div className="flex w-full flex-col items-start gap-4">
            <div className="flex w-full items-start gap-3.5">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 shrink-0 text-icon-primary" />
                <span className="text-sm text-text-primary">{formatBookingDate(booking.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="size-5 shrink-0 text-icon-primary" />
                <span className="text-sm text-text-primary">
                  {formatBookingTime(booking.start_time, booking.date)} - {formatBookingTime(booking.end_time, booking.date)}
                </span>
              </div>
            </div>

            {booking.address && (
              <div className="flex w-full items-start gap-2">
                {isCustomJob ? (
                  <LocationPinIcon className="size-5 shrink-0 text-icon-primary" />
                ) : isDoorstep ? (
                  <DoorstepIcon className="size-5 shrink-0 text-icon-primary" />
                ) : (
                  <ProviderStoreIcon className="size-5 shrink-0 text-icon-primary" />
                )}
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className={cn("text-xs", isCustomJob ? "text-text-secondary" : "text-text-brand")}>
                    {isCustomJob
                      ? t("bookings.detail.serviceAddress")
                      : isDoorstep
                        ? t("bookings.detail.atDoorstep")
                        : t("bookings.detail.atStore")}
                  </span>
                  <span className="text-xs font-medium text-text-primary">{booking.address}</span>
                </div>
              </div>
            )}
          </div>

          {isCancelled && (
            <>
              <div className="dashed-divider" />
              <div className="flex w-full flex-col items-start gap-1 rounded-lg bg-bg-error-subtle p-2">
                {booking.cancellation?.reason ? (
                  <>
                    <span className="text-xs text-text-secondary">
                      {t("bookings.detail.cancellationReasonLabel")}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">
                      {booking.cancellation.reason}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-text-error">
                    {paymentStatusKey === "failed"
                      ? t("bookings.detail.paymentFailedMessage")
                      : t("bookings.detail.cancelledMessage")}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {latestTimelineEntry && (
          <button
            type="button"
            onClick={() => setMobileTimelineOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl bg-bg-primary p-3"
          >
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", latestTimelineIconClass.bg)}>
              <CheckCircleIcon className={cn("size-4", latestTimelineIconClass.icon)} />
            </span>
            <div className="flex flex-1 flex-col items-start gap-1 text-left">
              <span className="text-sm font-semibold text-text-primary">
                {latestTimelineKey
                  ? t(`bookings.timeline.${timelineLabelKey(latestTimelineKey, booking.assigned_handymen.length > 0)}`)
                  : latestTimelineEntry.status}
              </span>
              <span className="line-clamp-1 text-xs text-text-secondary">
                {format(parseISO(latestTimelineEntry.timestamp), "d MMM,")}{" "}
                {applyMeridiemCase(format(parseISO(latestTimelineEntry.timestamp), timePattern), lowercaseMeridiem)}
              </span>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-bg-secondary">
              <ChevronDownIcon className="size-5 text-icon-primary" />
            </span>
          </button>
        )}

        {showTrack && (
          <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3">
            <span className="text-sm font-semibold text-text-primary">{t("bookings.detail.trackProvider")}</span>
            <div className="dashed-divider" />
            <button
              type="button"
              onClick={handleTrack}
              className="flex h-64 w-full items-center justify-center rounded-lg bg-bg-secondary"
              aria-label={t("bookings.detail.track")}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-bg-primary">
                <LocationPinIcon className="size-5 text-icon-primary" />
              </span>
            </button>
          </div>
        )}

        {isCustomJob && booking.custom_job_request?.customer_job_description && (
          <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3">
            <span className="text-sm font-medium text-text-primary">{t("bookings.detail.providersMessage")}</span>
            <div className="dashed-divider" />
            <ExpandableText text={booking.custom_job_request.customer_job_description} />
          </div>
        )}

        {!isCustomJob && booking.remarks && (
          <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3">
            <span className="text-sm font-medium text-text-primary">{t("bookings.detail.notes")}</span>
            <div className="dashed-divider" />
            <ExpandableText text={booking.remarks} />
          </div>
        )}

        {isCustomJob && booking.custom_job_request?.provider_bid_note && (
          <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3">
            <span className="text-sm font-medium text-text-primary">{t("bookings.detail.noteForProvider")}</span>
            <div className="dashed-divider" />
            <ExpandableText text={booking.custom_job_request.provider_bid_note} />
          </div>
        )}

        {!isCustomJob && (
          <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3">
            <span className="text-sm font-semibold text-text-primary">
              {t("bookings.detail.servicesCount", { count: booking.total_services_count })}
            </span>
            <div className="dashed-divider" />
            <div className="flex w-full flex-col items-start gap-3">
              {booking.services.map((service, index) => (
                <div key={service.service_id} className="flex w-full flex-col items-start gap-3">
                  {index > 0 && <div className="dashed-divider" />}
                  <div className="flex w-full items-start gap-3">
                    <AppImage
                      src={service.image}
                      alt={service.title}
                      className="size-11 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex flex-1 flex-col items-start gap-2">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs font-medium text-text-primary">{service.title}</span>
                        <span className="text-xs text-text-brand">{service.category_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-primary">
                          {t("bookings.detail.rateModal.qty", { count: service.quantity })}
                        </span>
                        <span className="h-3 w-px bg-border-default" />
                        <span className="text-xs text-text-primary">{showPrice(service.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isCompleted && booking.total_services_count > 0 && (
              <>
                <div className="dashed-divider" />
                <div className="flex w-full items-center gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-bg-warning-subtle">
                    <StarIcon className="size-5 text-icon-warning" />
                  </span>
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <span className="text-xs font-medium text-text-primary">
                      {t("bookings.detail.servicesRated", {
                        rated: booking.rated_services_count,
                        total: booking.total_services_count,
                      })}
                    </span>
                    <span className="text-xs text-text-secondary">{t("bookings.detail.rateServiceDescription")}</span>
                  </div>
                  <AppButton variant="primary" size="sm" onClick={() => setRateModalMode("service")}>
                    {booking.rated_services_count > 0 ? t("bookings.detail.edit") : t("bookings.detail.rate")}
                  </AppButton>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3">
          <span className="text-sm font-semibold text-text-primary">{t("bookings.detail.serviceTeam")}</span>
          <div className="dashed-divider" />
          <div className="flex w-full items-start gap-3">
            <AppImage
              src={booking.provider.profile_image}
              alt={booking.provider.company_name}
              className="size-16 shrink-0 rounded-xl object-cover"
            />
            <div className="flex flex-1 flex-col items-start gap-2">
              {booking.provider.slug ? (
                <Link
                  href={`/provider-details/${booking.provider.slug}`}
                  className="flex flex-col items-start gap-2"
                >
                  <div className="flex items-center gap-1">
                    <span className="line-clamp-1 text-xs font-medium text-text-primary">
                      {booking.provider.company_name}
                    </span>
                    {booking.provider.is_verified === 1 && (
                      <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {Number(booking.provider.average_rating) > 0 && (
                      <>
                        <StarIcon className="size-4 text-icon-warning" />
                        <span className="text-xs text-text-secondary">{formatRating(booking.provider.average_rating)}</span>
                        <span className="h-3 w-px bg-border-default" />
                      </>
                    )}
                    <ServiceDistanceIcon className="size-4 text-icon-secondary" />
                    <span className="text-xs text-text-secondary">
                      {formatDistance(booking.provider.distance, distanceUnit)}
                    </span>
                  </div>
                </Link>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <span className="line-clamp-1 text-xs font-medium text-text-primary">
                      {booking.provider.company_name}
                    </span>
                    {booking.provider.is_verified === 1 && (
                      <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {Number(booking.provider.average_rating) > 0 && (
                      <>
                        <StarIcon className="size-4 text-icon-warning" />
                        <span className="text-xs text-text-secondary">{formatRating(booking.provider.average_rating)}</span>
                        <span className="h-3 w-px bg-border-default" />
                      </>
                    )}
                    <ServiceDistanceIcon className="size-4 text-icon-secondary" />
                    <span className="text-xs text-text-secondary">
                      {formatDistance(booking.provider.distance, distanceUnit)}
                    </span>
                  </div>
                </>
              )}
              {chatAvailable && (
                <AppButton
                  asChild={!chatDisabled}
                  variant="link"
                  size="sm"
                  disabled={chatDisabled}
                  className="p-0"
                >
                  {chatDisabled ? (
                    t("common.chat")
                  ) : (
                    <Link
                      href={buildChatHref(
                        {
                          partnerId: booking.provider.provider_id,
                          bookingId: booking.id,
                          name: booking.provider.company_name,
                          image: booking.provider.profile_image,
                          status: booking.status,
                          title: booking.services[0]?.title,
                          extraCount: Math.max(0, booking.total_services_count - 1),
                          date: booking.date,
                          time: booking.start_time,
                        },
                        lang,
                        defaultLocale
                      )}
                    >
                      {t("common.chat")}
                    </Link>
                  )}
                </AppButton>
              )}
            </div>
          </div>

          {booking.assigned_handymen.length > 0 && (
            <div className="flex w-full flex-col items-start gap-3">
              <span className="text-xs text-text-secondary">{t("bookings.detail.assignedHandyman")}</span>
              <div className="flex w-full flex-col items-start gap-2">
                {booking.assigned_handymen.map((handyman) => (
                  <div key={handyman.id} className="flex w-full items-center gap-2">
                    <AppImage
                      src={handyman.profile_image}
                      alt={handyman.username}
                      className="size-6 shrink-0 rounded-sm object-cover"
                    />
                    <span className="line-clamp-1 text-xs font-medium text-text-primary">{handyman.username}</span>
                    {handyman.is_lead === 1 && (
                      <span className="rounded-sm bg-bg-brand-subtle px-1 py-1 text-xs text-text-brand">
                        {t("bookings.detail.leadTag")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isCompleted && booking.total_handymen_count > 0 && (
            <>
              <div className="dashed-divider" />
              <div className="flex w-full items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-bg-warning-subtle">
                  <StarIcon className="size-5 text-icon-warning" />
                </span>
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className="text-xs font-medium text-text-primary">
                    {t("bookings.detail.handymenRated", {
                      rated: booking.rated_handymen_count,
                      total: booking.total_handymen_count,
                    })}
                  </span>
                  <span className="text-xs text-text-secondary">{t("bookings.detail.rateTeamDescription")}</span>
                </div>
                <AppButton variant="primary" size="sm" onClick={() => setRateModalMode("handyman")}>
                  {booking.rated_handymen_count > 0 ? t("bookings.detail.edit") : t("bookings.detail.rate")}
                </AppButton>
              </div>
            </>
          )}
        </div>

        {hasProof && (
          <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3">
            <span className="text-sm font-medium text-text-primary">{t("bookings.detail.gallery")}</span>
            <div className="dashed-divider" />
            {booking.work_started_proof.length > 0 && (
              <div className="flex w-full flex-col items-start gap-2">
                <span className="text-xs text-text-secondary">{t("bookings.detail.startImages")}</span>
                <div className="flex items-start gap-3">
                  {booking.work_started_proof.map((image, index) => (
                    <AppButton
                      key={image}
                      variant="link"
                      className="size-12 shrink-0 p-0"
                      onClick={() => {
                        setLightboxImages(booking.work_started_proof);
                        setLightboxIndex(index);
                      }}
                    >
                      <AppImage
                        src={image}
                        alt={`${t("bookings.detail.startImages")} ${index + 1}`}
                        className="size-12 rounded-xl object-cover"
                      />
                    </AppButton>
                  ))}
                </div>
              </div>
            )}
            {booking.work_completed_proof.length > 0 && (
              <div className="flex w-full flex-col items-start gap-2">
                <span className="text-xs text-text-secondary">{t("bookings.detail.endImages")}</span>
                <div className="flex items-start gap-3">
                  {booking.work_completed_proof.map((image, index) => (
                    <AppButton
                      key={image}
                      variant="link"
                      className="size-12 shrink-0 p-0"
                      onClick={() => {
                        setLightboxImages(booking.work_completed_proof);
                        setLightboxIndex(index);
                      }}
                    >
                      <AppImage
                        src={image}
                        alt={`${t("bookings.detail.endImages")} ${index + 1}`}
                        className="size-12 rounded-xl object-cover"
                      />
                    </AppButton>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3">
          {mobileBillOpen ? (
            <button
              type="button"
              onClick={() => setMobileBillOpen(false)}
              className="flex w-full items-center justify-between gap-2"
            >
              <span className="text-sm font-semibold text-text-primary">{t("bookings.detail.billDetails")}</span>
              <span className="flex size-9 items-center justify-center rounded-3xl bg-bg-secondary">
                <ChevronUpIcon className="size-5 text-icon-primary" />
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMobileBillOpen(true)}
              className="flex w-full items-center justify-between gap-2"
            >
              <div className="flex flex-1 flex-col items-start gap-1 text-left">
                <span className="text-sm font-semibold text-text-primary">
                  {t("bookings.detail.totalAmount", { amount: showPrice(booking.final_total) })}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  {t("bookings.detail.paymentMode", { method: booking.payment_method })}
                </span>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-bg-secondary">
                <ChevronDownIcon className="size-5 text-icon-primary" />
              </span>
            </button>
          )}

          <AnimatePresence initial={false}>
            {mobileBillOpen && (
              <motion.div
                key="mobile-bill-details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex w-full flex-col items-start gap-3 overflow-hidden"
              >
                <div className="dashed-divider" />

                {booking.additional_charges.length > 0 && (
                  <>
                    <div className="flex w-full items-center gap-6">
                      <span className="flex-1 text-xs font-medium text-text-primary">
                        {t("bookings.detail.additionalCharges")}
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        +{showPrice(totalAdditionalCharges)}
                      </span>
                    </div>
                    <div className="dashed-divider" />
                  </>
                )}

                <div className="flex w-full flex-col items-start gap-3">
                  <BillBreakdown lines={billLines} currencyOverride={currencyOverride} size="sm" />
                  {booking.promo_discount > 0 && (
                    <div className="flex w-full items-center gap-6">
                      <span className="text-xs text-text-secondary">
                        {t("bookings.detail.promocode", { code: booking.promo_code })}
                      </span>
                      <span className="flex-1 text-end text-xs text-text-primary">
                        -{showPrice(booking.promo_discount)}
                      </span>
                    </div>
                  )}
                  {promoTaxReduction > 0 && (
                    <div className="flex w-full items-center gap-6">
                      <span className="flex-1 text-xs text-text-secondary">
                        {t("bookings.detail.promoTaxReduction")}
                      </span>
                      <span className="text-xs text-text-primary">-{showPrice(promoTaxReduction)}</span>
                    </div>
                  )}
                </div>

                <div className="dashed-divider" />

                <div className="flex w-full items-center gap-6">
                  <span className="flex-1 text-sm font-semibold text-text-primary">
                    {t("bookings.detail.totalPaid")}
                  </span>
                  <span className="text-sm font-semibold text-text-brand">{showPrice(booking.final_total)}</span>
                </div>

                <div className="flex w-full items-center gap-3 rounded-lg border border-border-muted bg-bg-secondary p-2">
                  <span className={cn("flex items-center justify-center rounded-md p-2", paymentBadgeClass)}>
                    {paymentLogo ? (
                      <AppImage src={paymentLogo} alt={booking.payment_method} className="size-4" />
                    ) : (
                      <CreditCard className="size-4" />
                    )}
                  </span>
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <span className="text-xs text-text-tertiary">{t("bookings.detail.paymentWith")}</span>
                    <span className="text-xs font-medium capitalize text-text-primary">
                      {booking.payment_method}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2 py-1 text-xs capitalize",
                      paymentStatusTone.border,
                      paymentStatusTone.text
                    )}
                  >
                    {paymentStatusLabel}
                  </span>
                </div>

                {Boolean(booking.additional_charges_payment_method) && (
                  <div className="flex w-full items-center gap-3 rounded-lg border border-border-muted bg-bg-secondary p-2">
                    <span className={cn("flex items-center justify-center rounded-md p-2", additionalPaymentBadgeClass)}>
                      {additionalPaymentLogo ? (
                        <AppImage
                          src={additionalPaymentLogo}
                          alt={booking.additional_charges_payment_method}
                          className="size-4"
                        />
                      ) : (
                        <CreditCard className="size-4" />
                      )}
                    </span>
                    <div className="flex flex-1 flex-col items-start gap-1">
                      <span className="text-xs text-text-tertiary">
                        {t("bookings.detail.additionalChargePaidWith")}
                      </span>
                      <span className="text-xs font-medium capitalize text-text-primary">
                        {booking.additional_charges_payment_method}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-2 py-1 text-xs capitalize",
                        additionalPaymentStatusTone.border,
                        additionalPaymentStatusTone.text
                      )}
                    >
                      {additionalPaymentStatusLabel}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {(showCancel || showReschedule || showBookAgain || statusKey === "completed" || showPayAdditional) && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)] xl:hidden">
          {showPayAdditional ? (
            <AppButton
              variant="primary"
              size="lg"
              className="flex-1 justify-center"
              disabled={isPayingAdditionalCharge}
              onClick={handlePayAdditional}
            >
              {t("bookings.detail.payAdditional", { amount: showPrice(pendingAdditionalTotal) })}
            </AppButton>
          ) : isCompleted ? (
            <>
              <AppButton
                variant="secondary-outline"
                size="lg"
                className="flex-1 justify-center whitespace-nowrap text-sm"
                disabled={downloadingInvoice}
                onClick={handleDownloadInvoice}
              >
                {t("bookings.detail.getInvoice")}
              </AppButton>
              {showBookAgain && (
                <AppButton
                  variant="primary"
                  size="lg"
                  className="flex-1 justify-center whitespace-nowrap text-sm"
                  disabled={isRebooking(booking.id)}
                  onClick={handleBookAgain}
                >
                  {t("bookings.detail.bookAgain")}
                </AppButton>
              )}
            </>
          ) : (
            <>
              {showCancel && (
                <AppButton
                  variant="secondary-outline"
                  size="lg"
                  className="flex-1 justify-center"
                  onClick={handleCancel}
                >
                  {t("bookings.detail.cancel")}
                </AppButton>
              )}
              {showReschedule && (
                <AppButton
                  variant="primary"
                  size="lg"
                  className="flex-1 justify-center"
                  onClick={() => setRescheduleOpen(true)}
                >
                  {t("bookings.detail.reschedule")}
                </AppButton>
              )}
            </>
          )}
        </div>
      )}

      <Drawer open={mobileTimelineOpen} onOpenChange={setMobileTimelineOpen}>
        <DrawerContent className="bg-bg-primary">
          <div className="flex w-full flex-col items-start gap-4 px-4 pb-4">
            <DrawerTitle className="w-full text-center text-base font-medium text-text-primary">
              {t("bookings.detail.serviceTimeline")}
            </DrawerTitle>
            <div className="flex w-full flex-col items-start gap-4">
              {booking.service_status_timeline.map((entry, index) => {
                const entryKey = toBookingStatusKey(entry.status);
                const { bg, icon } = entryKey
                  ? getBookingTimelineIconClass(entryKey)
                  : { bg: "bg-bg-secondary", icon: "text-icon-inverse" };
                const isLast = index === booking.service_status_timeline.length - 1;
                const timestamp = parseISO(entry.timestamp);
                return (
                  <div key={`${entry.status}-${entry.timestamp}`} className="flex w-full items-start gap-3">
                    <div className="flex flex-col items-center gap-2">
                      <span className={cn("flex size-9 items-center justify-center rounded-xl p-2", bg)}>
                        <CheckCircleIcon className={cn("size-4", icon)} />
                      </span>
                      {!isLast && <div className="flex-1 border-l border-dashed border-border-strong" />}
                    </div>
                    <div className="flex flex-1 flex-col items-start gap-1 pb-1">
                      <span className="text-sm font-semibold text-text-primary">
                        {entryKey
                          ? t(`bookings.timeline.${timelineLabelKey(entryKey, booking.assigned_handymen.length > 0)}`)
                          : entry.status}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {format(timestamp, "d MMM,")} {applyMeridiemCase(format(timestamp, timePattern), lowercaseMeridiem)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {isMobile ? (
        <MobileRescheduleScreen
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          title={t("bookings.detail.rescheduleModalTitle")}
          providerId={booking.provider.provider_id}
          currentDate={currentBookingDate}
          currentTimeRangeLabel={
            booking.start_time && booking.end_time
              ? `${formatBookingTime(booking.start_time, booking.date)} to ${formatBookingTime(booking.end_time, booking.date)}`
              : currentBookingTime
          }
          address={booking.address}
          selectedDate={currentBookingDate}
          selectedTime={currentBookingTime}
          lockStatus="idle"
          lockError={null}
          confirmLabel={t("bookings.detail.rescheduleModalConfirm")}
          onConfirm={handleRescheduleConfirm}
        />
      ) : (
        <DateTimeModal
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          providerId={booking.provider.provider_id}
          selectedDate={currentBookingDate}
          selectedTime={currentBookingTime}
          lockStatus="idle"
          lockError={null}
          title={t("bookings.detail.rescheduleModalTitle")}
          confirmLabel={t("bookings.detail.rescheduleModalConfirm")}
          onConfirm={handleRescheduleConfirm}
        />
      )}

      {showTrack && (
        <TrackOnMapModal
          open={trackModalOpen}
          onOpenChange={setTrackModalOpen}
          orderId={booking.id}
          isArrived={false}
          providerName={booking.assigned_handymen[0]?.username || booking.provider.company_name}
          providerImage={booking.assigned_handymen[0]?.profile_image || booking.provider.profile_image}
          customerAddress={booking.address}
        />
      )}

      <CancelReasonModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onSubmit={handleConfirmCancel}
        submitting={cancelling}
      />

      {successModalMode &&
        (isMobile ? (
          <MobileActionSuccessScreen
            open
            title={t(
              successModalMode === "reschedule"
                ? "bookings.detail.rescheduleSuccessModal.title"
                : "bookings.detail.cancelSuccessModal.title"
            )}
            description={t(
              successModalMode === "reschedule"
                ? "bookings.detail.rescheduleSuccessModal.description"
                : "bookings.detail.cancelSuccessModal.description"
            )}
            confirmLabel={t(
              successModalMode === "reschedule"
                ? "bookings.detail.rescheduleSuccessModal.confirm"
                : "bookings.detail.cancelSuccessModal.confirm"
            )}
            onConfirm={() => setSuccessModalMode(null)}
            onBackToHome={() => router.push(localizePath("/", lang, defaultLocale))}
          />
        ) : (
          <ActionSuccessModal
            open
            onOpenChange={(next) => !next && setSuccessModalMode(null)}
            title={t(
              successModalMode === "reschedule"
                ? "bookings.detail.rescheduleSuccessModal.title"
                : "bookings.detail.cancelSuccessModal.title"
            )}
            description={t(
              successModalMode === "reschedule"
                ? "bookings.detail.rescheduleSuccessModal.description"
                : "bookings.detail.cancelSuccessModal.description"
            )}
            confirmLabel={t(
              successModalMode === "reschedule"
                ? "bookings.detail.rescheduleSuccessModal.confirm"
                : "bookings.detail.cancelSuccessModal.confirm"
            )}
            onConfirm={() => setSuccessModalMode(null)}
          />
        ))}

      {rateModalMode && (
        <RateModal
          open
          onOpenChange={(next) => !next && setRateModalMode(null)}
          mode={rateModalMode}
          items={rateModalMode === "service" ? serviceRateItems : handymanRateItems}
          onSubmitItem={handleSubmitRating}
          onSubmitted={onBookingUpdated}
        />
      )}

      <GalleryLightbox
        images={lightboxImages ?? []}
        title={t("bookings.detail.workProof")}
        open={lightboxImages !== null}
        activeIndex={lightboxIndex}
        onOpenChange={(open) => {
          if (!open) setLightboxImages(null);
        }}
        onActiveIndexChange={setLightboxIndex}
      />

      <AdditionalChargePaymentDrawer
        open={additionalChargeDrawerOpen}
        onOpenChange={setAdditionalChargeDrawerOpen}
        amount={pendingAdditionalTotal}
        currencyOverride={currencyOverride}
        isProcessing={isPayingAdditionalCharge}
        onSelect={payAdditionalCharge}
      />
      <StripePaymentModal
        open={additionalChargeStripeModal.open}
        clientSecret={additionalChargeStripeModal.clientSecret}
        publishableKey={gatewaySettings.stripe_publishable_key ?? ""}
        onClose={closeAdditionalChargeStripeModal}
        onSuccess={handleAdditionalChargeStripeSuccess}
        onFailure={handleAdditionalChargeStripeFailure}
      />
    </>
  );
}
