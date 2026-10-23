"use client";

import { useRouter } from "next/router";
import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { Calendar } from "lucide-react";
import { ChatBubbleDotsIcon, ClockIcon, VerifiedBadgeIcon } from "@/components/icons/icons";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import type { BookingCardData } from "@/lib/orders-catalog";
import { buildChatHref } from "@/lib/chats/chat-types";
import { useRebook } from "@/lib/checkout/use-rebook";
import { useDateTimeFormatter } from "@/lib/use-date-time-formatter";

/** Mobile-only booking card — desktop keeps booking-card.tsx unchanged.
 * `compact` (used for the ongoing horizontal-scroll strip) drops the price/
 * invoice row and keeps date+time inline next to the status pill; the
 * default (vertical list) variant shows invoice number, price+date+time,
 * and a "Re Book" button for completed bookings. */
export function MobileBookingCard({
  booking,
  compact = false,
  showInvoiceNumber = false,
  showRebook = false,
}: {
  booking: BookingCardData;
  compact?: boolean;
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
      className={compact ? "flex w-72 shrink-0 flex-col items-start gap-3 rounded-xl bg-bg-primary p-3" : "flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3"}
    >
      <div className="flex w-full flex-col items-start gap-4">
        <div className="flex w-full items-center justify-between gap-2">
          {showInvoiceNumber ? (
            <div className="flex flex-1 flex-col items-start gap-1">
              <span className="text-xs text-text-secondary">{t("bookings.card.invoiceLabel")}</span>
              <span className="text-xs text-text-primary">{t("bookings.card.invoiceNumber", { number: booking.id })}</span>
            </div>
          ) : (
            <div className="flex-1">
              <span className="text-xs text-text-secondary">{t("bookings.card.dateTimeLabel")}</span>
              <div className="text-xs text-text-primary">
                {formatBookingDate(booking.dateOfService)}, {formatBookingTime(booking.startingTime, booking.dateOfService)}
              </div>
            </div>
          )}
          <BookingStatusBadge statusKey={booking.statusKey} fallbackLabel={booking.rawStatusLabel} />
        </div>

        <div className="flex w-full flex-col items-start gap-1">
          <span className="line-clamp-2 w-full text-sm text-text-primary">{booking.title}</span>
          {booking.extraCount > 0 && (
            <span className="text-xs text-text-brand">{t("bookings.card.more", { count: booking.extraCount })}</span>
          )}
        </div>

        {showInvoiceNumber && (
          <div className="flex w-full items-center gap-3">
            <span className="text-base font-medium text-text-primary">{showPrice(
            booking.total,
            booking.currencySymbol
              ? { symbol: booking.currencySymbol, decimalPlaces: booking.currencyDecimalPlaces }
              : undefined
          )}</span>
            <span className="h-4 w-px bg-border-default" />
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <Calendar className="size-4 text-icon-secondary" />
              {formatBookingDate(booking.dateOfService)}
            </div>
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <ClockIcon className="size-4 text-icon-secondary" />
              {formatBookingTime(booking.startingTime, booking.dateOfService)}
            </div>
          </div>
        )}
      </div>

      <div className="dashed-divider" />

      <div className="flex w-full items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <AppImage src={booking.image} alt={booking.companyName} className="size-8 shrink-0 rounded-md object-cover" />
          <div className="flex flex-1 flex-col items-start gap-1">
            <span className="text-xs text-text-secondary">{t("bookings.card.providerLabel")}</span>
            <span className="flex items-center gap-1 text-xs text-text-primary">
              <span className="line-clamp-1">{booking.companyName}</span>
              {booking.providerVerified && <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />}
            </span>
          </div>
        </div>
        {showRebook ? (
          <button
            type="button"
            disabled={isRebooking(booking.id)}
            onClick={(event) => {
              event.stopPropagation();
              rebook(booking.id);
            }}
            className="shrink-0 rounded-lg bg-button-primary-bg px-2 py-2 text-sm text-button-primary-text disabled:opacity-60"
          >
            {t("bookings.card.bookAgain")}
          </button>
        ) : (
          booking.chatAllowed && (
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
              onClick={(event) => event.stopPropagation()}
              aria-label={t("common.chat")}
              className="flex shrink-0 items-center justify-center rounded-lg bg-bg-brand-subtle p-2"
            >
              <ChatBubbleDotsIcon className="size-5 text-icon-brand" />
            </Link>
          )
        )}
      </div>
    </div>
  );
}
