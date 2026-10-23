import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { Calendar, Clock } from "lucide-react";
import {
  CheckCircleIcon,
  CloseIcon,
  DoorstepIcon,
  ProviderStoreIcon,
  LocationPinIcon,
  AccountBookingsIcon,
} from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import { clearPendingPayment } from "@/lib/checkout/pending-payment";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { cn } from "@/lib/utils";
import { getBookingDetailsApi } from "@/api/apiRoutes";
import { formatBookingDate, formatBookingTime, type BookingDetailApi } from "@/lib/orders-catalog";
import { usePriceFormatter } from "@/lib/show-price";

interface PageProps {
  translation: TranslationPageProps;
}

const METHOD_LABEL_KEY: Record<string, string> = {
  stripe: "checkoutPage.payment.stripe",
  razorpay: "checkoutPage.payment.razorpay",
  xendit: "checkoutPage.payment.xendit",
  cashfree: "checkoutPage.payment.cashfree",
  paypal: "checkoutPage.payment.paypal",
  paystack: "checkoutPage.payment.paystack",
  flutterwave: "checkoutPage.payment.flutterwave",
  cod: "checkoutPage.payment.payOnService",
};

const STATUS_TONE = {
  successful: {
    headerBg: "bg-bg-success",
    icon: "text-icon-success",
  },
  pending: {
    headerBg: "bg-bg-warning",
    icon: "text-icon-warning",
  },
  failed: {
    headerBg: "bg-bg-error",
    icon: "text-icon-error",
  },
} as const;

export default function PaymentStatusPage() {
  const router = useRouter();
  const { t, lang, defaultLocale } = useTranslation();
  const showPrice = usePriceFormatter();
  const [booking, setBooking] = useState<BookingDetailApi | null>(null);

  useEffect(() => {
    clearPendingPayment();
  }, []);

  const orderId = typeof router.query.order_id === "string" ? router.query.order_id : null;

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    getBookingDetailsApi({ id: orderId })
      .then((response) => {
        if (cancelled) return;
        if (!response?.error && response?.data) setBooking(response.data);
      })
      .catch(() => {
        // Keep the compact fallback card if the booking can't be fetched.
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Query params aren't known during SSR/static render (router.isReady is
  // false until hydration) — render nothing until then so the server and
  // client's first paint match, instead of reading router.query too early.
  if (!router.isReady) {
    return <div className="flex w-full flex-1 items-center justify-center bg-bg-secondary px-6 py-16" />;
  }

  const method = typeof router.query.method === "string" ? router.query.method : booking?.payment_method ?? null;

  // Our own links use `status`, but redirect gateways (PayPal, Xendit, etc.)
  // send us back with their own param names/values on their return URL —
  // `payment_status` and/or `st`, values like "success"/"Completed"/"pending".
  const normalize = (value: string | string[] | undefined): string | null => {
    if (!value) return null;
    const last = Array.isArray(value) ? value[value.length - 1] : value;
    return last.toLowerCase().trim();
  };
  const rawStatus = normalize(router.query.status);
  const rawPaymentStatus = normalize(router.query.payment_status);
  const rawSt = normalize(router.query.st);

  const isSuccess =
    rawStatus === "successful" ||
    rawStatus === "success" ||
    rawPaymentStatus === "success" ||
    rawPaymentStatus === "completed" ||
    rawSt === "success" ||
    rawSt === "completed";
  const isPending = rawStatus === "pending" || rawPaymentStatus === "pending" || rawSt === "pending";

  const status = isSuccess ? "successful" : isPending ? "pending" : "failed";
  const tone = STATUS_TONE[status];
  const methodLabelKey = method ? METHOD_LABEL_KEY[method] : null;

  const goToBookings = () =>
    router.push(localizePath(orderId ? `/booking/${orderId}` : "/general-bookings", lang, defaultLocale));

  const firstService = booking?.services[0] ?? null;
  const isDoorstep = booking?.booking_type === "at_doorstep";

  return (
    <div className="flex w-full flex-1 items-center justify-center bg-bg-secondary px-6 py-16">
      <div className="flex w-full max-w-[800px] flex-col items-start overflow-hidden rounded-2xl border border-border-default bg-bg-primary shadow-sm">
        <div className={cn("flex w-full items-center justify-center gap-4 p-6", tone.headerBg)}>
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-bg-primary p-3 shadow-sm">
            {isSuccess ? (
              <CheckCircleIcon className={cn("size-9", tone.icon)} />
            ) : isPending ? (
              <Clock className={cn("size-9", tone.icon)} />
            ) : (
              <CloseIcon className={cn("size-8", tone.icon)} />
            )}
          </div>
          <div className="flex flex-1 flex-col items-start gap-1">
            <span className="w-full text-xl font-semibold text-text-inverse-light">
              {t(
                isSuccess
                  ? "checkoutPage.paymentStatus.successTitle"
                  : isPending
                    ? "checkoutPage.paymentStatus.pendingTitle"
                    : "checkoutPage.paymentStatus.failedTitle"
              )}
            </span>
            <span className="w-full text-base text-text-inverse-light">
              {t(
                isSuccess
                  ? "checkoutPage.paymentStatus.successDescription"
                  : isPending
                    ? "checkoutPage.paymentStatus.pendingDescription"
                    : "checkoutPage.paymentStatus.failedDescription"
              )}
            </span>
          </div>
        </div>

        {booking && (
          <div className="flex w-full items-center gap-4 border-b border-border-default p-6">
            <div className="flex flex-1 flex-col items-start gap-2">
              <div className="flex w-full items-center gap-2">
                <span className="line-clamp-1 text-lg font-medium text-text-primary">
                  {firstService?.title ?? ""}
                </span>
                {booking.total_services_count > 1 && (
                  <span className="text-lg font-medium text-text-primary">
                    {t("checkoutPage.paymentStatus.servicesCount", { count: booking.total_services_count })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base text-text-brand">
                  {t("checkoutPage.paymentStatus.bookingId", { id: booking.id })}
                </span>
                <span className="size-1 rounded-full bg-bg-inverse opacity-40" />
                <span className="text-base text-text-secondary">{booking.provider.company_name}</span>
              </div>
            </div>
          </div>
        )}

        {booking && (
          <div className="flex w-full flex-col items-start gap-6 p-6">
            <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-border-default bg-bg-secondary p-4">
              <div className="flex w-full items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-border-default bg-bg-primary p-2">
                  <Calendar className="size-5 text-icon-primary" />
                </span>
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className="text-sm text-text-primary opacity-80">
                    {t("checkoutPage.paymentStatus.dateTimeLabel")}
                  </span>
                  <span className="text-sm text-text-primary">
                    {formatBookingDate(booking.date)} - {formatBookingTime(booking.start_time)} to{" "}
                    {formatBookingTime(booking.end_time)}
                  </span>
                </div>
              </div>

              <div className="h-px w-full bg-border-default" />

              <div className="flex w-full items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-border-default bg-bg-primary p-2">
                  {isDoorstep ? (
                    <DoorstepIcon className="size-5 text-icon-primary" />
                  ) : (
                    <ProviderStoreIcon className="size-5 text-icon-primary" />
                  )}
                </span>
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className="text-sm text-text-primary opacity-80">
                    {t("checkoutPage.paymentStatus.serviceTypeLabel")}
                  </span>
                  <span className="text-sm text-text-primary">
                    {isDoorstep ? t("bookings.detail.atDoorstep") : t("bookings.detail.atStore")}
                  </span>
                </div>
              </div>

              {booking.address && (
                <>
                  <div className="h-px w-full bg-border-default" />
                  <div className="flex w-full items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-border-default bg-bg-primary p-2">
                      <LocationPinIcon className="size-5 text-icon-primary" />
                    </span>
                    <div className="flex flex-1 flex-col items-start gap-1">
                      <span className="text-sm text-text-primary opacity-80">
                        {t("checkoutPage.paymentStatus.addressLabel")}
                      </span>
                      <span className="text-sm text-text-primary">{booking.address}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex w-full items-center justify-end gap-4">
              <div className="flex flex-1 flex-col items-start gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-base text-text-primary opacity-80">
                    {t("checkoutPage.paymentStatus.paymentVia")}
                  </span>
                  {methodLabelKey && (
                    <span className="text-base font-medium text-text-brand">{t(methodLabelKey)}</span>
                  )}
                </div>
                <span className="text-lg font-medium text-text-primary">{showPrice(booking.final_total)}</span>
              </div>
              <AppButton variant="primary" size="md" leftIcon={AccountBookingsIcon} onClick={goToBookings}>
                {t("checkoutPage.paymentStatus.viewBooking")}
              </AppButton>
            </div>
          </div>
        )}

        {!booking && (
          <div className="flex w-full flex-col items-center gap-3 p-6">
            <EmptyState
              icon={AccountBookingsIcon}
              title={t("checkoutPage.paymentStatus.detailsUnavailableTitle")}
              description={t("checkoutPage.paymentStatus.detailsUnavailableDescription")}
              className="py-4"
            />
            {orderId && (
              <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-border-default bg-bg-secondary p-4">
                <span className="text-sm text-text-secondary">{t("checkoutPage.paymentStatus.orderId")}</span>
                <span className="text-sm font-medium text-text-primary">#{orderId}</span>
              </div>
            )}
            {(isSuccess || isPending) && orderId ? (
              <AppButton variant="primary" size="lg" className="w-full" onClick={goToBookings}>
                {t("checkoutPage.paymentStatus.viewBooking")}
              </AppButton>
            ) : (
              <AppButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => router.push(localizePath("/cart", lang, defaultLocale))}
              >
                {t("checkoutPage.paymentStatus.backToCart")}
              </AppButton>
            )}
            <AppButton
              variant="secondary-outline"
              size="lg"
              className="w-full"
              onClick={() => router.push(localizePath("/", lang, defaultLocale))}
            >
              {t("checkoutPage.paymentStatus.backToHome")}
            </AppButton>
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      const translation = await getTranslationProps(lang);
      if (!translation) return { notFound: true };
      return { props: { translation } };
    }
  : undefined;
