"use client";

import { Calendar } from "lucide-react";
import { useRouter } from "next/router";
import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { ClockIcon, ChatIcon, VerifiedBadgeIcon } from "@/components/icons/icons";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import type { BookingCardData } from "@/lib/orders-catalog";
import { buildChatHref } from "@/lib/chats/chat-types";
import { useRebook } from "@/lib/checkout/use-rebook";
import { useDateTimeFormatter } from "@/lib/use-date-time-formatter";

export function BookingCard({
  booking,
  showInvoiceNumber = false,
  showRebook = false,
}: {
  booking: BookingCardData;
  showInvoiceNumber?: boolean;
  showRebook?: boolean;
}) {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const showPrice = usePriceFormatter();
  const { formatBookingDate, formatBookingTime } = useDateTimeFormatter();
  const bookingHref = localizePath(`/booking/${booking.id}`, lang, defaultLocale);
  const { rebook, isRebooking } = useRebook();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(bookingHref)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(bookingHref);
        }
      }}
      className="flex w-full cursor-pointer flex-col items-start gap-6 overflow-hidden rounded-xl border border-border-default bg-bg-primary p-4"
    >
      {showInvoiceNumber && (
        <span className="rounded-lg bg-bg-brand-subtle px-3 py-2 text-sm text-text-brand">
          {t("bookings.card.invoiceNo", { number: booking.id })}
        </span>
      )}

      <div className="flex w-full items-start gap-4">
        <AppImage src={booking.image} alt={booking.companyName} className="size-24 shrink-0 rounded-lg object-cover" />
        <div className="flex flex-1 flex-col items-start gap-4">
          <div className="flex w-full flex-col items-start gap-1">
            <div className="flex w-full items-center gap-2">
              <div className="flex flex-1 items-center gap-2">
                <span className="line-clamp-1 flex-1 text-base font-medium text-text-primary">
                  {booking.title}
                </span>
                {booking.extraCount > 0 && (
                  <span className="text-base text-text-brand">
                    {t("bookings.card.more", { count: booking.extraCount })}
                  </span>
                )}
              </div>
              <BookingStatusBadge statusKey={booking.statusKey} fallbackLabel={booking.rawStatusLabel} />
            </div>
            <span className="flex items-center gap-1 text-base text-text-primary">
              {booking.companyName}
              {booking.providerVerified && <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />}
            </span>
          </div>

          <div className="flex w-full items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className="flex size-8 items-center justify-center rounded-lg border border-border-default p-1 bg-bg-secondary">
                <Calendar
                  className="size-5 opacity-75 text-icon-primary"
                />
              </span>
              <span className="text-base text-text-primary">{formatBookingDate(booking.dateOfService)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="flex size-8 items-center justify-center rounded-lg border border-border-default p-1 bg-bg-secondary">
                <ClockIcon
                  className="size-5 opacity-75 text-icon-primary"
                />
              </span>
              <span className="text-base text-text-primary">{formatBookingTime(booking.startingTime, booking.dateOfService)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashed-divider" />

      <div className="flex w-full items-center gap-3">
        <span className="flex-1 text-xl font-medium text-text-primary">{showPrice(
            booking.total,
            booking.currencySymbol
              ? { symbol: booking.currencySymbol, decimalPlaces: booking.currencyDecimalPlaces }
              : undefined
          )}</span>
        <AppButton asChild variant="link" size="md">
          <Link href={bookingHref}>{t("bookings.card.viewBooking")}</Link>
        </AppButton>
        {showRebook ? (
          <AppButton
            variant="link"
            size="md"
            disabled={isRebooking(booking.id)}
            onClick={(event) => {
              event.stopPropagation();
              rebook(booking.id);
            }}
          >
            {t("bookings.card.bookAgain")}
          </AppButton>
        ) : (
          booking.chatAllowed && (
          <AppButton
            asChild
            variant="secondary"
            size="md"
            iconOnly
            aria-label={t("common.chat")}
            onClick={(event) => event.stopPropagation()}
          >
            <Link
              href={buildChatHref(
                {
                  partnerId: booking.providerId,
                  bookingId: booking.id,
                  name: booking.companyName,
                  image: booking.image,
                  status: booking.rawStatusLabel,
                  title: booking.title,
                  extraCount: booking.extraCount,
                  date: booking.dateOfService,
                  time: booking.startingTime,
                },
                lang,
                defaultLocale
              )}
            >
              <ChatIcon className="size-6 text-button-secondary-text" />
              <span className="sr-only">{t("common.chat")}</span>
            </Link>
          </AppButton>
          )
        )}
      </div>
    </div>
  );
}
